import apiClient from './client';
import type { User } from '@/types/user';
import type { Restaurant } from '@/types/restaurant';
import type { Review } from '@/types/review';
import type { AdminReport } from '@/types/report';

interface PaginatedResponse<T> {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
  links: { prev: string | null; next: string | null };
}

export async function getAdminDashboard(params?: {
  users_page?: number;
  restaurants_page?: number;
  reviews_page?: number;
}): Promise<{
  users: PaginatedResponse<User>;
  restaurants: PaginatedResponse<Restaurant>;
  reviews: PaginatedResponse<Review>;
}> {
  const { data } = await apiClient.get('/admin/dashboard', { params });
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}

export async function deleteAdminRestaurant(id: number): Promise<void> {
  await apiClient.delete(`/admin/restaurants/${id}`);
}

export async function deleteAdminReview(id: number): Promise<void> {
  await apiClient.delete(`/admin/reviews/${id}`);
}

export async function getAdminReports(params?: {
  page?: number;
}): Promise<PaginatedResponse<AdminReport>> {
  const { data } = await apiClient.get('/admin/reports', { params });
  return data;
}

export async function updateReport(
  id: number,
  payload: { status: AdminReport['status']; admin_note?: string | null }
): Promise<AdminReport> {
  const { data } = await apiClient.patch(`/admin/reports/${id}`, payload);
  return data.data;
}
