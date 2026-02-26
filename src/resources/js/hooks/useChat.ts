import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as chatApi from '@/api/chat';
import { getEcho } from '@/lib/echo';
import type { ChatMessage } from '@/types/chat';

export function useChatRooms(polling = false) {
  return useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatApi.getChatRooms,
    staleTime: 0,
    refetchInterval: polling ? 5_000 : false,
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
      // メッセージ一覧キャッシュに追加
      queryClient.setQueryData(
        ['chatMessages', newMessage.chat_room_id],
        (old: any) => {
          if (!old) return old;
          const firstPage = old.pages[0];
          return {
            ...old,
            pages: [
              { ...firstPage, data: [newMessage, ...firstPage.data] },
              ...old.pages.slice(1),
            ],
          };
        }
      );
      // ルーム一覧・未読数も更新
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['chatUnreadCount'] });
    },
  });
}

export function useMarkRead(roomId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.markRead(roomId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.refetchQueries({ queryKey: ['chatUnreadCount'] });
    },
  });
}

/**
 * Echo チャンネル購読: 新着メッセージをリアルタイムで受信
 */
export function useChatSubscription(roomId: number | null, currentUserId?: number) {
  const queryClient = useQueryClient();

  const handleNewMessage = useCallback(
    (e: { message: ChatMessage }) => {
      const newMessage = e.message;

      // メッセージ一覧キャッシュに追加
      queryClient.setQueryData(
        ['chatMessages', roomId],
        (old: any) => {
          if (!old) return old;
          // 重複チェック
          const exists = old.pages.some((page: any) =>
            page.data.some((m: ChatMessage) => m.id === newMessage.id)
          );
          if (exists) return old;

          const firstPage = old.pages[0];
          return {
            ...old,
            pages: [
              { ...firstPage, data: [newMessage, ...firstPage.data] },
              ...old.pages.slice(1),
            ],
          };
        }
      );

      // 相手からのメッセージ → 開いているので即既読にする
      if (roomId && currentUserId && newMessage.sender_id !== currentUserId) {
        chatApi.markRead(roomId).then(() => {
          queryClient.refetchQueries({ queryKey: ['chatUnreadCount'] });
        });
      }

      // ルーム一覧も更新
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
    [roomId, currentUserId, queryClient]
  );

  useEffect(() => {
    if (!roomId) return;

    const echoInstance = getEcho();
    const channel = echoInstance.private(`chat.room.${roomId}`);
    channel.listen('.message.sent', handleNewMessage);

    return () => {
      channel.stopListening('.message.sent', handleNewMessage);
      echoInstance.leave(`chat.room.${roomId}`);
    };
  }, [roomId, handleNewMessage]);
}
