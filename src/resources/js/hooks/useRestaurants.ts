import { useQuery, useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getRestaurants, getRestaurant, getPrefectures } from '@/api/restaurants';
import type { CursorPaginatedResponse } from '@/api/restaurants';
import type { Restaurant, RestaurantDetail, RestaurantSearchParams } from '@/types/restaurant';

export function useRestaurants(params: RestaurantSearchParams) {
  return useInfiniteQuery({
    queryKey: ['restaurants', params],
    queryFn: ({ pageParam }) => getRestaurants({ ...params, cursor: pageParam || undefined }),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    maxPages: 25,
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
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.reviews_count === 0) return false;
      if (!data.review_summary || data.review_summary.review_count !== data.reviews_count) {
        if (query.state.dataUpdateCount > 12) return false; // 上限12回（約1分）で停止
        return 5_000;
      }
      return false;
    },
    placeholderData: () => {
      const queriesData = queryClient.getQueriesData<InfiniteData<CursorPaginatedResponse<Restaurant>>>({
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
