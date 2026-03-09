import { useEffect, useRef } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import * as chatApi from '@/api/chat';
import { getEcho, onReconnect } from '@/lib/echo';
import type { ChatMessage, ChatMessagesResponse, ChatRoom } from '@/types/chat';

type ChatMessagesCache = InfiniteData<ChatMessagesResponse> | undefined;

// --- Subscription coordination ---
// Tracks the currently open room so useGlobalChatSubscription can skip
// events that useChatSubscription will handle.
let activeRoomId: number | null = null;

// --- Shared helpers ---

function updateRoomsWithMessage(
  rooms: ChatRoom[] | undefined,
  msg: ChatMessage,
  incrementUnread: boolean,
): ChatRoom[] | undefined {
  if (!rooms) return rooms;

  const idx = rooms.findIndex((r) => Number(r.id) === Number(msg.chat_room_id));
  if (idx === -1) return undefined;

  const room = rooms[idx];
  const updated: ChatRoom = {
    ...room,
    latest_message: {
      id: msg.id,
      type: msg.type,
      body: msg.body,
      sender_id: msg.sender_id,
      created_at: msg.created_at,
    },
    unread_count: incrementUnread ? room.unread_count + 1 : room.unread_count,
  };

  const rest = [...rooms.slice(0, idx), ...rooms.slice(idx + 1)];
  return [updated, ...rest];
}

function addMessageToCache(old: ChatMessagesCache, msg: ChatMessage): ChatMessagesCache {
  if (!old) return old;
  const msgId = Number(msg.id);
  const exists = old.pages.some((page: ChatMessagesResponse) =>
    page.data.some((m: ChatMessage) => Number(m.id) === msgId)
  );
  if (exists) return old;
  const firstPage = old.pages[0];
  return {
    ...old,
    pages: [
      { ...firstPage, data: [msg, ...firstPage.data] },
      ...old.pages.slice(1),
    ],
  };
}

// Re-export helpers for use in useChat.ts (send mutation optimistic updates)
export { updateRoomsWithMessage, addMessageToCache };
export type { ChatMessagesCache };

/**
 * グローバル通知: user.{userId} チャンネルを購読
 * SiteHeader などアプリ全体で1回だけ呼ぶ。
 * どの画面にいても未読数・ルーム一覧をリアルタイム更新する。
 */
export function useGlobalChatSubscription(userId: number | null) {
  const queryClient = useQueryClient();
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!userId) return;

    const echoInstance = getEcho();
    const channel = echoInstance.private(`user.${userId}`);

    channel.listen('.message.sent', (e: { message: ChatMessage }) => {
      const msg = e.message;

      if (activeRoomId === msg.chat_room_id) return;

      queryClient.setQueryData(['chatUnreadCount'], (old: number | undefined) =>
        (old ?? 0) + 1
      );

      const rooms = queryClient.getQueryData<ChatRoom[]>(['chatRooms']);
      const updatedRooms = updateRoomsWithMessage(rooms, msg, true);
      if (updatedRooms) {
        queryClient.setQueryData(['chatRooms'], updatedRooms);
      } else {
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      }

      queryClient.setQueryData<ChatMessagesCache>(
        ['chatMessages', msg.chat_room_id],
        (old) => addMessageToCache(old, msg)
      );
    });

    const unsubReconnect = onReconnect(() => {
      queryClient.invalidateQueries({ queryKey: ['chatUnreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    });

    return () => {
      channel.stopListening('.message.sent');
      echoInstance.leave(`user.${userId}`);
      unsubReconnect();
    };
  }, [userId, queryClient]);
}

/**
 * ルームチャンネル購読: 開いているルームの新着メッセージをリアルタイムで受信
 * ChatPage でルーム選択時に呼ぶ。
 */
export function useChatSubscription(roomId: number | null, currentUserId?: number) {
  const queryClient = useQueryClient();
  const roomIdRef = useRef(roomId);
  const currentUserIdRef = useRef(currentUserId);
  roomIdRef.current = roomId;
  currentUserIdRef.current = currentUserId;

  useEffect(() => {
    activeRoomId = roomId;
    return () => {
      activeRoomId = null;
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const echoInstance = getEcho();
    const channel = echoInstance.private(`chat.room.${roomId}`);

    channel.listen('.message.sent', (e: { message: ChatMessage }) => {
      const newMessage = e.message;
      const rid = roomIdRef.current;

      if (currentUserIdRef.current && Number(newMessage.sender_id) === Number(currentUserIdRef.current)) {
        return;
      }

      queryClient.setQueryData<ChatMessagesCache>(
        ['chatMessages', rid],
        (old) => addMessageToCache(old, newMessage)
      );

      const rooms = queryClient.getQueryData<ChatRoom[]>(['chatRooms']);
      const updatedRooms = updateRoomsWithMessage(rooms, newMessage, false);
      if (updatedRooms) {
        queryClient.setQueryData(['chatRooms'], updatedRooms);
      } else {
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      }

      if (rid) {
        chatApi.markRead(rid).then(() => {
          queryClient.setQueryData(['chatRooms'], (old: ChatRoom[] | undefined) => {
            if (!old) return old;
            return old.map((r) =>
              r.id === rid ? { ...r, unread_count: 0 } : r
            );
          });
          queryClient.setQueryData(['chatUnreadCount'], (old: number | undefined) => {
            if (old === undefined || old <= 0) return 0;
            return old - 1;
          });
        });
      }
    });

    channel.listen('.message.read', (_e: { room_id: number; read_by: number }) => {
      const rid = roomIdRef.current;
      if (!rid) return;

      queryClient.setQueryData<ChatMessagesCache>(
        ['chatMessages', rid],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: ChatMessagesResponse) => ({
              ...page,
              data: page.data.map((m: ChatMessage) =>
                m.sender_id === currentUserIdRef.current && !m.is_read
                  ? { ...m, is_read: true }
                  : m
              ),
            })),
          };
        }
      );
    });

    const unsubReconnect = onReconnect(() => {
      if (roomIdRef.current) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', roomIdRef.current] });
      }
    });

    return () => {
      channel.stopListening('.message.sent');
      channel.stopListening('.message.read');
      echoInstance.leave(`chat.room.${roomId}`);
      unsubReconnect();
    };
  }, [roomId, queryClient]);
}
