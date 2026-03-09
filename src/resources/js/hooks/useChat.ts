import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import * as chatApi from '@/api/chat';
import { getEcho, onReconnect } from '@/lib/echo';
import type { ChatMessage, ChatMessagesResponse, ChatRoom } from '@/types/chat';

// --- 型エイリアス ---
type ChatMessagesCache = InfiniteData<ChatMessagesResponse> | undefined;

// --- Subscription coordination (P4) ---
// Tracks the currently open room so useGlobalChatSubscription can skip
// events that useChatSubscription will handle.
let activeRoomId: number | null = null;

// --- Optimistic helpers ---

function updateRoomsWithMessage(
  rooms: ChatRoom[] | undefined,
  msg: ChatMessage,
  incrementUnread: boolean,
): ChatRoom[] | undefined {
  if (!rooms) return rooms;

  const idx = rooms.findIndex((r) => Number(r.id) === Number(msg.chat_room_id));
  if (idx === -1) return undefined; // unknown room → caller should fallback

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

  // Move updated room to top
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

// --- Hooks ---

export function useChatRooms(polling = false) {
  return useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatApi.getChatRooms,
    staleTime: 0,
    // WebSocket + 再接続キャッチアップが主、ポーリングはフォールバック
    refetchInterval: polling ? 60_000 : false,
  });
}

export function useChatMessages(roomId: number | null) {
  return useInfiniteQuery({
    queryKey: ['chatMessages', roomId],
    queryFn: ({ pageParam }) =>
      chatApi.getChatMessages(roomId!, pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!roomId,
    staleTime: 0,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      body,
      roomId,
    }: {
      restaurantId: number;
      body: string;
      roomId?: number;
    }) => chatApi.sendMessage(restaurantId, body, roomId),
    onSuccess: (newMessage) => {
      // Add to message cache
      queryClient.setQueryData<ChatMessagesCache>(
        ['chatMessages', newMessage.chat_room_id],
        (old) => addMessageToCache(old, newMessage)
      );

      // Optimistic chatRooms update (own message doesn't increment unread)
      // invalidateQueries は setQueryData の外で呼ぶ（アンチパターン回避）
      const rooms = queryClient.getQueryData<ChatRoom[]>(['chatRooms']);
      const updatedRooms = updateRoomsWithMessage(rooms, newMessage, false);
      if (updatedRooms) {
        queryClient.setQueryData(['chatRooms'], updatedRooms);
      } else {
        // New room not in cache yet
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      }
      // Own send doesn't affect own unread count → no chatUnreadCount update
    },
  });
}

export function useSendImageMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      images,
      body,
      roomId,
    }: {
      restaurantId: number;
      images: File[];
      body?: string;
      roomId?: number;
    }) => chatApi.sendImageMessage(restaurantId, images, body, roomId),
    onSuccess: (newMessage) => {
      // Add to message cache
      queryClient.setQueryData<ChatMessagesCache>(
        ['chatMessages', newMessage.chat_room_id],
        (old) => addMessageToCache(old, newMessage)
      );

      // Optimistic chatRooms update
      const rooms = queryClient.getQueryData<ChatRoom[]>(['chatRooms']);
      const updatedRooms = updateRoomsWithMessage(rooms, newMessage, false);
      if (updatedRooms) {
        queryClient.setQueryData(['chatRooms'], updatedRooms);
      } else {
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      }
    },
  });
}

export function useHideMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: number) => chatApi.hideMessage(messageId),
    onSuccess: (_data, messageId) => {
      queryClient.setQueriesData<ChatMessagesCache>(
        { queryKey: ['chatMessages'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: ChatMessagesResponse) => ({
              ...page,
              data: page.data.filter((m: ChatMessage) => m.id !== messageId),
            })),
          };
        }
      );
    },
  });
}

export function useHideRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: number) => chatApi.hideRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => chatApi.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['blockStatus'] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => chatApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['blockStatus'] });
    },
  });
}

export function useBlockStatus(userId: number | null) {
  return useQuery({
    queryKey: ['blockStatus', userId],
    queryFn: () => chatApi.getBlockStatus(userId!),
    enabled: !!userId,
  });
}

export function useReport() {
  return useMutation({
    mutationFn: ({
      targetType,
      targetId,
      reason,
      images,
    }: {
      targetType: string;
      targetId: number;
      reason: string;
      images?: File[];
    }) => chatApi.sendReport(targetType, targetId, reason, images),
  });
}

export function useMarkRead(roomId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.markRead(roomId!),
    onSuccess: () => {
      // Optimistic: set unread_count to 0 for this room
      queryClient.setQueryData(['chatRooms'], (old: ChatRoom[] | undefined) => {
        if (!old || !roomId) return old;
        return old.map((r) =>
          r.id === roomId ? { ...r, unread_count: 0 } : r
        );
      });

      // Optimistic: decrement global unread count by the room's previous unread
      queryClient.setQueryData(['chatUnreadCount'], (old: number | undefined) => {
        if (old === undefined || old <= 0) return 0;
        // We already set the room's unread to 0, just refetch for accuracy
        return Math.max(0, old);
      });
      // Refetch for exact count (markRead may affect multiple messages)
      queryClient.invalidateQueries({ queryKey: ['chatUnreadCount'] });
    },
  });
}

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

      // P4: Skip if useChatSubscription is handling this room
      if (activeRoomId === msg.chat_room_id) return;

      // P3: Optimistic unread count +1
      queryClient.setQueryData(['chatUnreadCount'], (old: number | undefined) =>
        (old ?? 0) + 1
      );

      // P3: Optimistic chatRooms update
      const rooms = queryClient.getQueryData<ChatRoom[]>(['chatRooms']);
      const updatedRooms = updateRoomsWithMessage(rooms, msg, true);
      if (updatedRooms) {
        queryClient.setQueryData(['chatRooms'], updatedRooms);
      } else {
        // Unknown room (new room) → full refetch as fallback
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      }

      // Add message to cache if that room's messages are loaded
      queryClient.setQueryData<ChatMessagesCache>(
        ['chatMessages', msg.chat_room_id],
        (old) => addMessageToCache(old, msg)
      );
    });

    // P6: Reconnection catch-up
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

  // P4: Track active room for deduplication with global subscription
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

      // 自分が送信したメッセージはスキップ
      // （useSendMessage / useSendImageMessage の onSuccess で既にキャッシュ追加済み）
      if (currentUserIdRef.current && Number(newMessage.sender_id) === Number(currentUserIdRef.current)) {
        return;
      }

      // Add message to cache
      queryClient.setQueryData<ChatMessagesCache>(
        ['chatMessages', rid],
        (old) => addMessageToCache(old, newMessage)
      );

      // P3: Optimistic chatRooms update
      const rooms = queryClient.getQueryData<ChatRoom[]>(['chatRooms']);
      const updatedRooms = updateRoomsWithMessage(rooms, newMessage, false);
      if (updatedRooms) {
        queryClient.setQueryData(['chatRooms'], updatedRooms);
      } else {
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      }

      // Mark as read immediately (room is open) and decrement unread count
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

    // P2: Listen for message.read events (other user read our messages)
    channel.listen('.message.read', (_e: { room_id: number; read_by: number }) => {
      const rid = roomIdRef.current;
      if (!rid) return;

      // Update is_read on all messages in cache sent by current user
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

    // P6: Reconnection catch-up for open room
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
