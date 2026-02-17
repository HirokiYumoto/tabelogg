import { useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getRestaurant } from '@/api/restaurants';
import type { RestaurantSearchParams, Restaurant } from '@/types/restaurant';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';

const SORT_OPTIONS = [
  { value: 'distance', label: '📍 現在地に近い' },
  { value: 'newest', label: '新着順' },
  { value: 'rating', label: '⭐️ 評価が高い' },
  { value: 'favorites', label: '🔖 人気順' },
  { value: 'reviews', label: '💬 口コミ数' },
] as const;

function RestaurantCard({ restaurant, onPrefetch }: { restaurant: Restaurant; onPrefetch: (id: number) => void }) {
  const image = restaurant.images[0];
  const prefectureName = restaurant.city?.prefecture?.name ?? '';
  const detailPath = `/restaurants/${restaurant.id}`;

  // Build filled stars based on rating
  const rating = restaurant.reviews_avg_rating ?? 0;
  const fullStars = Math.round(rating);

  return (
    <div
      className="group bg-white rounded-lg shadow-lg hover:shadow-xl transition duration-300 border border-gray-100 overflow-hidden flex flex-col h-full"
      onPointerEnter={() => onPrefetch(restaurant.id)}
    >
      {/* Image */}
      <Link to={detailPath} className="block relative overflow-hidden h-48">
        {image ? (
          <img
            src={`/storage/${image.image_path}`}
            alt={restaurant.name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <span className="text-4xl">🍜</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          {/* Title row */}
          <div className="flex items-start justify-between">
            <Link
              to={detailPath}
              className="text-xl font-bold text-gray-800 hover:text-orange-500 transition truncate"
            >
              {restaurant.name}
            </Link>
            {prefectureName && (
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2">
                {prefectureName}
              </span>
            )}
          </div>

          {/* Description */}
          {restaurant.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2 mt-2">
              {restaurant.description}
            </p>
          )}
        </div>

        {/* Bottom stats */}
        <div className="border-t pt-3 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Star rating */}
              <span className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill={i <= fullStars ? '#facc15' : '#d1d5db'}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
                <span className="text-sm text-gray-600 ml-1">
                  {restaurant.reviews_avg_rating != null
                    ? restaurant.reviews_avg_rating.toFixed(1)
                    : '-'}
                </span>
              </span>

              {/* Favorites */}
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="#f87171"
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {restaurant.favorites_count}
              </span>

              {/* Reviews count */}
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {restaurant.reviews_count}
              </span>

              {/* Distance */}
              {restaurant.distance != null && (
                <span className="text-xs text-orange-600">
                  {restaurant.distance < 1
                    ? `${Math.round(restaurant.distance * 1000)}m`
                    : `${restaurant.distance.toFixed(1)}km`}
                </span>
              )}
            </div>

            {/* Detail link */}
            <Link
              to={detailPath}
              className="text-orange-500 hover:text-orange-600 text-sm font-bold"
            >
              詳細へ →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const keyword = searchParams.get('keyword') ?? '';
  const prefectureId = searchParams.get('prefecture_id') ?? '';
  const sort = searchParams.get('sort') ?? 'distance';
  const page = Number(searchParams.get('page') ?? '1');

  const { lat, lng, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();

  const handlePrefetch = useCallback(
    (id: number) => {
      queryClient.prefetchQuery({
        queryKey: ['restaurant', id],
        queryFn: () => getRestaurant(id),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient],
  );

  // Request geolocation when "distance" sort is selected
  useEffect(() => {
    if (sort === 'distance' && lat === null && lng === null && !geoLoading) {
      requestLocation();
    }
  }, [sort, lat, lng, geoLoading, requestLocation]);

  // Build query params
  const queryParams: RestaurantSearchParams = {
    keyword: keyword || undefined,
    prefecture_id: prefectureId || undefined,
    sort,
    page,
  };

  if (sort === 'distance' && lat != null && lng != null) {
    queryParams.lat = String(Math.round(lat * 10000) / 10000);
    queryParams.lng = String(Math.round(lng * 10000) / 10000);
  }

  const { data, isLoading, isError } = useRestaurants(queryParams);

  const restaurants = data?.data ?? [];
  const meta = data?.meta;

  const hasSearchFilter = keyword || prefectureId;
  const totalCount = data?.meta?.total;

  const updateParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        // Reset page when filters change
        if (key !== 'page') {
          next.delete('page');
        }
        return next;
      });
    },
    [setSearchParams]
  );

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {hasSearchFilter
            ? `検索結果: ${totalCount ?? 0} 件`
            : 'すべてのお店'}
        </h1>

        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Geolocation status */}
      {sort === 'distance' && geoLoading && (
        <p className="mb-4 text-sm text-gray-500">位置情報を取得中...</p>
      )}
      {sort === 'distance' && geoError && (
        <p className="mb-4 text-sm text-red-500">
          位置情報の取得に失敗しました: {geoError}
        </p>
      )}

      {/* Loading */}
      {isLoading && <Spinner className="py-20" />}

      {/* Error */}
      {isError && (
        <div className="text-center py-20 text-red-500">
          データの取得に失敗しました。もう一度お試しください。
        </div>
      )}

      {/* No results */}
      {!isLoading && !isError && restaurants.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          条件に一致するレストランが見つかりませんでした。
        </div>
      )}

      {/* Restaurant grid */}
      {!isLoading && !isError && restaurants.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} onPrefetch={handlePrefetch} />
            ))}
          </div>

          {/* Pagination */}
          {meta && (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              onPageChange={(p) => updateParam('page', String(p))}
            />
          )}
        </>
      )}
    </div>
  );
}
