import apiClient from './client';
import type { User } from '@/types/user';

export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get('/profile');
  return data.data;
}

export async function updateProfile(params: { name: string; email: string }): Promise<User> {
  const { data } = await apiClient.patch('/profile', params);
  return data.data;
}

export async function deleteProfile(password: string): Promise<void> {
  await apiClient.delete('/profile', { data: { password } });
}
