import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReservations,
  storeReservation,
  deleteReservation,
  getAvailableDates,
  getAvailableTimes,
  getAvailableSeats,
} from '@/api/reservations';

export function useReservations(params?: { upcoming_page?: number; past_page?: number }) {
  return useQuery({
    queryKey: ['reservations', params],
    queryFn: () => getReservations(params),
  });
}

export function useStoreReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      params,
    }: {
      restaurantId: number;
      params: {
        seat_category: string;
        reservation_date: string;
        reservation_time: string;
        number_of_people: number;
      };
    }) => storeReservation(restaurantId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
    },
  });
}

export function useDeleteReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useAvailableDates(
  restaurantId: number,
  params: { people: number; year: number; month: number },
  enabled: boolean
) {
  return useQuery({
    queryKey: ['availableDates', restaurantId, params],
    queryFn: () => getAvailableDates(restaurantId, params),
    enabled,
  });
}

export function useAvailableTimes(
  restaurantId: number,
  params: { people: number; date: string },
  enabled: boolean
) {
  return useQuery({
    queryKey: ['availableTimes', restaurantId, params],
    queryFn: () => getAvailableTimes(restaurantId, params),
    enabled,
  });
}

export function useAvailableSeats(
  restaurantId: number,
  params: { people: number; date: string; time: string },
  enabled: boolean
) {
  return useQuery({
    queryKey: ['availableSeats', restaurantId, params],
    queryFn: () => getAvailableSeats(restaurantId, params),
    enabled,
  });
}
