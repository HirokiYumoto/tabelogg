import apiClient from './client';
import type { Reservation, AvailableSeat } from '@/types/reservation';

interface PaginatedReservations {
  data: Reservation[];
  meta: { current_page: number; last_page: number; total: number };
  links: { prev: string | null; next: string | null };
}

export async function getReservations(params?: {
  upcoming_page?: number;
  past_page?: number;
}): Promise<{
  upcoming: PaginatedReservations;
  past: PaginatedReservations;
}> {
  const { data } = await apiClient.get('/reservations', { params });
  return data;
}

export async function storeReservation(
  restaurantId: number,
  params: {
    seat_category: string;
    reservation_date: string;
    reservation_time: string;
    number_of_people: number;
  }
): Promise<Reservation> {
  const { data } = await apiClient.post(`/restaurants/${restaurantId}/reservations`, params);
  return data.data;
}

export async function deleteReservation(id: number): Promise<void> {
  await apiClient.delete(`/reservations/${id}`);
}

export async function getAvailableDates(
  restaurantId: number,
  params: { people: number; year: number; month: number }
): Promise<{ dates: string[]; error?: string }> {
  const { data } = await apiClient.get(
    `/restaurants/${restaurantId}/reservations/available-dates`,
    { params }
  );
  return data;
}

export async function getAvailableTimes(
  restaurantId: number,
  params: { people: number; date: string }
): Promise<{ times: { time: string; available: boolean }[] }> {
  const { data } = await apiClient.get(
    `/restaurants/${restaurantId}/reservations/available-times`,
    { params }
  );
  return data;
}

export async function getAvailableSeats(
  restaurantId: number,
  params: { people: number; date: string; time: string }
): Promise<{ seats: AvailableSeat[]; stay_minutes: number }> {
  const { data } = await apiClient.get(
    `/restaurants/${restaurantId}/reservations/available-seats`,
    { params }
  );
  return data;
}
