import apiClient from './client';
import type { ChatRoom, ChatMessage, ChatMessagesResponse, BlockStatus, ReportStatus } from '@/types/chat';

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

export async function sendImageMessage(
  restaurantId: number,
  images: File[],
  body?: string,
  roomId?: number
): Promise<ChatMessage> {
  const formData = new FormData();
  images.forEach((file) => formData.append('images[]', file));
  if (body) formData.append('body', body);
  if (roomId) formData.append('room_id', String(roomId));
  const { data } = await apiClient.post(
    `/chat/rooms/${restaurantId}/messages`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data.data;
}

export async function markRead(roomId: number): Promise<void> {
  await apiClient.put(`/chat/rooms/${roomId}/mark-read`);
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get('/chat/unread-count');
  return data.count;
}

export async function hideMessage(messageId: number): Promise<void> {
  await apiClient.post(`/chat/messages/${messageId}/hide`);
}

export async function hideRoom(roomId: number): Promise<void> {
  await apiClient.post(`/chat/rooms/${roomId}/hide`);
}

export async function getBlockStatus(userId: number): Promise<BlockStatus> {
  const { data } = await apiClient.get(`/users/${userId}/block-status`);
  return data;
}

export async function blockUser(userId: number): Promise<void> {
  await apiClient.post(`/users/${userId}/block`);
}

export async function unblockUser(userId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}/block`);
}

export async function sendReport(targetUserId: number, reason: string): Promise<void> {
  await apiClient.post('/reports', { target_user_id: targetUserId, reason });
}

export async function getReportStatus(userId: number): Promise<ReportStatus> {
  const { data } = await apiClient.get(`/users/${userId}/report-status`);
  return data;
}
