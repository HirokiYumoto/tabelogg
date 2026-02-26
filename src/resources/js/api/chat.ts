import apiClient from './client';
import type { ChatRoom, ChatMessage, ChatMessagesResponse } from '@/types/chat';

export async function getChatRooms(): Promise<ChatRoom[]> {
  const { data } = await apiClient.get('/chat/rooms');
  return data.data;
}

export async function getChatMessages(
  roomId: number,
  cursor?: number
): Promise<ChatMessagesResponse> {
  const params = cursor ? { cursor } : {};
  const { data } = await apiClient.get(`/chat/rooms/${roomId}/messages`, { params });
  return { data: data.data, next_cursor: data.next_cursor };
}

export async function sendMessage(
  restaurantId: number,
  body: string,
  roomId?: number
): Promise<ChatMessage> {
  const payload: Record<string, unknown> = { body };
  if (roomId) payload.room_id = roomId;
  const { data } = await apiClient.post(`/chat/rooms/${restaurantId}/messages`, payload);
  return data.data;
}

export async function markRead(roomId: number): Promise<void> {
  await apiClient.put(`/chat/rooms/${roomId}/mark-read`);
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get('/chat/unread-count');
  return data.count;
}
