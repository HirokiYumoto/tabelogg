import apiClient from './client';
import type { Reservation } from '@/types/reservation';

interface PaginatedResponse<T> {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
  links: { prev: string | null; next: string | null };
}

export async function getOwnerDashboard(
  restaurantId: number,
  params?: { page?: number }
): Promise<{
  restaurant: { id: number; name: string };
  reservations: PaginatedResponse<Reservation>;
}> {
  const { data } = await apiClient.get(`/owner/restaurants/${restaurantId}/dashboard`, { params });
  return data;
}
