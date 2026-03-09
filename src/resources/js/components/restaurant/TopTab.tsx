import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { addFavorite, removeFavorite } from '@/api/favorites';
import type { DashboardData } from '@/api/dashboard';
import type { RestaurantDetail } from '@/types/restaurant';
import StarRating from '@/components/ui/StarRating';
import ImageGallery from '@/components/ui/ImageGallery';
import BusinessHours from './BusinessHours';

export default function TopTab({ restaurant }: { restaurant: RestaurantDetail }) {
  const { user, isOwner } = useAuth();
  const queryClient = useQueryClient();

  const favoriteMutation = useMutation({
    mutationFn: () =>
      restaurant.is_favorited
        ? removeFavorite(restaurant.id)
        : addFavorite(restaurant.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurant.id] });

      queryClient.setQueryData<DashboardData>(['dashboard'], (old) => {
        if (!old) return old;
        if (restaurant.is_favorited) {
          return {
            ...old,
            favorites: old.favorites.filter((f) => f.restaurant.id !== restaurant.id),
          };
        }
        return {
          ...old,
          favorites: [
            ...old.favorites,
            {
              id: Date.now(),
              restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                city: restaurant.city
                  ? { name: restaurant.city.name, prefecture: restaurant.city.prefecture ?? null }
                  : null,
              },
            },
          ],
        };
      });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  const prefectureName = restaurant.city?.prefecture?.name ?? '';
  const cityName = restaurant.city?.name ?? '';
  const locationLabel = [prefectureName, cityName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      {/* Header: name (left) + rating & favorite (right) */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{restaurant.name}</h2>

        <div className="shrink-0 text-right space-y-2">
          <div className="flex items-center justify-end gap-2">
            <StarRating rating={restaurant.reviews_avg_rating ?? 0} size="lg" />
            <span className="text-lg font-semibold text-gray-700">
              {restaurant.reviews_avg_rating != null
                ? restaurant.reviews_avg_rating.toFixed(1)
                : '-'}
            </span>
            <span className="text-sm text-gray-500">
              ({restaurant.reviews_count}件)
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => favoriteMutation.mutate()}
                disabled={favoriteMutation.isPending}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                  restaurant.is_favorited
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${favoriteMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill={restaurant.is_favorited ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {restaurant.is_favorited ? 'お気に入り済み' : 'お気に入り'}
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                お気に入り
              </Link>
            )}
            <span className="text-sm text-gray-500">
              {restaurant.favorites_count}
            </span>
          </div>
        </div>
      </div>

      {/* Restaurant images with lightbox */}
      <ImageGallery
        images={restaurant.images.map((img) => ({ id: img.id, src: `/storage/${img.image_path}` }))}
        alt={restaurant.name}
        heroOverlay={
          (locationLabel || restaurant.nearest_station) ? (
            <div className="absolute bottom-0 left-0 bg-black/60 text-white px-4 py-3 rounded-tr-lg pointer-events-none">
              {locationLabel && (
                <p className="text-sm font-medium">{locationLabel}</p>
              )}
              {restaurant.nearest_station && (
                <p className="text-xs text-gray-300 mt-0.5">
                  {restaurant.nearest_station}
                </p>
              )}
            </div>
          ) : undefined
        }
      />

      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {restaurant.description}
      </p>

      {restaurant.time_settings.length > 0 && (
        <BusinessHours timeSettings={restaurant.time_settings} />
      )}

      {user && user.id !== restaurant.user_id && (
        <div className="pt-2">
          <Link
            to={`/chat?restaurant=${restaurant.id}`}
            className="inline-flex items-center gap-2 rounded-md border border-orange-500 px-4 py-2 text-sm font-medium text-orange-500 shadow hover:bg-orange-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            オーナーにチャット
          </Link>
        </div>
      )}

      {isOwner && user && user.id === restaurant.user_id && (
        <div className="flex gap-3 pt-2">
          <Link
            to={`/restaurants/${restaurant.id}/edit`}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-600 transition-colors"
          >
            編集
          </Link>
          <Link
            to={`/owner/restaurants/${restaurant.id}/dashboard`}
            className="rounded-md border border-orange-500 px-4 py-2 text-sm font-medium text-orange-500 shadow hover:bg-orange-50 transition-colors"
          >
            ダッシュボード
          </Link>
        </div>
      )}
    </div>
  );
}
