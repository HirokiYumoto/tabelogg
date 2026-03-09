import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as chatApi from '@/api/chat';
import type { ChatMessage, ChatMessagesResponse, ChatRoom } from '@/types/chat';
import {
  updateRoomsWithMessage,
  addMessageToCache,
  type ChatMessagesCache,
} from './useChatSubscription';

// Re-export subscription hooks so existing imports continue to work
export { useGlobalChatSubscription, useChatSubscription } from './useChatSubscription';

// --- Query Hooks ---

export function useChatRooms(polling = false) {
  return useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatApi.getChatRooms,
    staleTime: 0,
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

// --- Mutation Hooks ---

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
      queryClient.setQueryData<ChatMessagesCache>(
        ['chatMessages', newMessage.chat_room_id],
        (old) => addMessageToCache(old, newMessage)
      );

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
      queryClient.setQueryData<ChatMessagesCache>(
        ['chatMessages', newMessage.chat_room_id],
        (old) => addMessageToCache(old, newMessage)
      );

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

export function useReportStatus(userId: number | null) {
  return useQuery({
    queryKey: ['reportStatus', userId],
    queryFn: () => chatApi.getReportStatus(userId!),
    enabled: !!userId,
  });
}

export function useReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      targetUserId,
      reason,
    }: {
      targetUserId: number;
      reason: string;
    }) => chatApi.sendReport(targetUserId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reportStatus', variables.targetUserId] });
    },
  });
}

export function useMarkRead(roomId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomUnread: number) => chatApi.markRead(roomId!),
    onSuccess: (_data, roomUnread) => {
      queryClient.setQueryData(['chatRooms'], (old: ChatRoom[] | undefined) => {
        if (!old || !roomId) return old;
        return old.map((r) =>
          r.id === roomId ? { ...r, unread_count: 0 } : r
        );
      });

      queryClient.setQueryData(['chatUnreadCount'], (old: number | undefined) => {
        if (old === undefined || old <= 0) return 0;
        return Math.max(0, old - roomUnread);
      });
      queryClient.invalidateQueries({ queryKey: ['chatUnreadCount'] });
    },
  });
}
