import apiClient, { getCsrfCookie } from './client';
import type { User } from '@/types/user';

export async function login(email: string, password: string): Promise<User> {
  await getCsrfCookie();
  const { data } = await apiClient.post('/login', { email, password });
  return data.data;
}

export async function register(params: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  register_as_owner: boolean;
}): Promise<User> {
  await getCsrfCookie();
  const { data } = await apiClient.post('/register', params);
  return data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/logout');
}

export async function getUser(): Promise<User> {
  const { data } = await apiClient.get('/user');
  return data.data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  await getCsrfCookie();
  const { data } = await apiClient.post('/forgot-password', { email });
  return data;
}

export async function resetPassword(params: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  await getCsrfCookie();
  const { data } = await apiClient.post('/reset-password', params);
  return data;
}
