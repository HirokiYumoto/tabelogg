import { useQuery, useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getRestaurants, getRestaurant, getPrefectures } from '@/api/restaurants';
import type { PaginatedResponse } from '@/api/restaurants';
import type { Restaurant, RestaurantDetail, RestaurantSearchParams } from '@/types/restaurant';

export function useRestaurants(params: RestaurantSearchParams) {
  return useInfiniteQuery({
    queryKey: ['restaurants', params],
    queryFn: ({ pageParam = 1 }) => getRestaurants({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    initialPageParam: 1,
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
      const queriesData = queryClient.getQueriesData<InfiniteData<PaginatedResponse<Restaurant>>>({
        queryKey: ['restaurants'],
      });
      for (const [, data] of queriesData) {
        if (!data?.pages) continue;
        for (const page of data.pages) {
          const found = page.data?.find((r) => r.id === id);
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
