import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRestaurants, getRestaurant, getPrefectures } from '@/api/restaurants';
import type { PaginatedResponse } from '@/api/restaurants';
import type { Restaurant, RestaurantDetail, RestaurantSearchParams } from '@/types/restaurant';

export function useRestaurants(params: RestaurantSearchParams) {
  return useQuery({
    queryKey: ['restaurants', params],
    queryFn: () => getRestaurants(params),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useRestaurant(id: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => getRestaurant(id),
    enabled: id > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: () => {
      const queriesData = queryClient.getQueriesData<PaginatedResponse<Restaurant>>({
        queryKey: ['restaurants'],
      });
      for (const [, data] of queriesData) {
        const found = data?.data?.find((r) => r.id === id);
        if (found) {
          return {
            ...found,
            menu_info: null,
            user_id: 0,
            reviews: [],
            review_summary: null,
            seat_types: [],
            time_settings: [],
            is_favorited: false,
            has_reviewed: false,
          } as RestaurantDetail;
        }
      }
      return undefined;
    },
  });
}

export function usePrefectures() {
  return useQuery({
    queryKey: ['prefectures'],
    queryFn: getPrefectures,
    staleTime: Infinity,
  });
}
