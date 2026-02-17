import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRestaurant } from '@/hooks/useRestaurants';
import { useAuth } from '@/contexts/AuthContext';
import { addFavorite, removeFavorite } from '@/api/favorites';
import { deleteReview } from '@/api/reviews';
import type { DashboardData } from '@/api/dashboard';
import type { RestaurantDetail } from '@/types/restaurant';
import StarRating from '@/components/ui/StarRating';
import Spinner from '@/components/ui/Spinner';
import ImageGallery from '@/components/ui/ImageGallery';
import ReservationWizard from '@/components/reservation/ReservationWizard';

type TabKey = 'top' | 'menu' | 'reviews' | 'access' | 'reservation';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'top', label: 'トップ' },
  { key: 'menu', label: 'メニュー' },
  { key: 'reviews', label: '口コミ' },
  { key: 'access', label: 'アクセス' },
  { key: 'reservation', label: '予約' },
];

/* ========================================================================
   Tab content components
   ======================================================================== */

function TopTab({ restaurant }: { restaurant: RestaurantDetail }) {
  const { user, isOwner } = useAuth();
  const queryClient = useQueryClient();

  const favoriteMutation = useMutation({
    mutationFn: () =>
      restaurant.is_favorited
        ? removeFavorite(restaurant.id)
        : addFavorite(restaurant.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurant.id] });

      // Optimistically update dashboard cache so MyPage reflects the change immediately
      queryClient.setQueryData<DashboardData>(['dashboard'], (old) => {
        if (!old) return old;
        if (restaurant.is_favorited) {
          // Was favorited → now removed
          return {
            ...old,
            favorites: old.favorites.filter((f) => f.restaurant.id !== restaurant.id),
          };
        }
        // Was not favorited → now added
        return {
          ...old,
          favorites: [
            ...old.favorites,
            {
              id: Date.now(), // Temporary id; replaced on next server fetch
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
  const heroImage = restaurant.images.length > 0 ? restaurant.images[0] : null;

  return (
    <div className="space-y-6">
      {/* Header: name (left) + rating & favorite (right) */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{restaurant.name}</h2>

        <div className="shrink-0 text-right space-y-2">
          {/* Rating + review count */}
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

          {/* Favorite button + count */}
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

      {/* Description */}
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {restaurant.description}
      </p>

      {/* Owner actions */}
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

function MenuTab({ restaurant }: { restaurant: RestaurantDetail }) {
  if (!restaurant.menu_info) {
    return (
      <p className="text-gray-500 text-center py-12">
        メニュー情報はまだ登録されていません。
      </p>
    );
  }

  return (
    <div className="prose max-w-none">
      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {restaurant.menu_info}
      </p>
    </div>
  );
}

function ReviewsTab({ restaurant }: { restaurant: RestaurantDetail }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurant.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  const handleDeleteReview = (reviewId: number) => {
    if (window.confirm('この口コミを削除しますか?')) {
      deleteMutation.mutate(reviewId);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header: title + write review button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          口コミ ({restaurant.reviews_count}件)
        </h3>
        {user && !restaurant.has_reviewed ? (
          <Link
            to={`/restaurants/${restaurant.id}/reviews/create`}
            className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            口コミを投稿
          </Link>
        ) : user && restaurant.has_reviewed ? (
          <span className="text-sm text-gray-400">投稿済み</span>
        ) : (
          <Link
            to="/login"
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            ログインして投稿
          </Link>
        )}
      </div>

      {/* Review summary */}
      {restaurant.review_summary && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">口コミまとめ</h3>
          <p className="text-gray-700 leading-relaxed">
            {restaurant.review_summary.text}
          </p>

          {restaurant.review_summary.good_points.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-2">良い点</h4>
              <ul className="space-y-1">
                {restaurant.review_summary.good_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                    <span className="mt-0.5 shrink-0">&#10003;</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {restaurant.review_summary.bad_points.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-600 mb-2">改善点</h4>
              <ul className="space-y-1">
                {restaurant.review_summary.bad_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                    <span className="mt-0.5 shrink-0">&#10007;</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Review list */}
      <div>

        {restaurant.reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            まだ口コミはありません。
          </p>
        ) : (
          <div className="space-y-6">
            {restaurant.reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-200 pb-6 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800">
                      {review.user?.name ?? '匿名'}
                    </span>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {review.comment}
                </p>

                {/* Review images */}
                {review.images.length > 0 && (
                  <div className="mt-3">
                    <ImageGallery
                      images={review.images.map((img) => ({ id: img.id, src: `/storage/${img.image_path}` }))}
                      alt="口コミ画像"
                      heroMaxH="max-h-[300px]"
                      thumbSize="w-16 h-16"
                    />
                  </div>
                )}

                {/* Delete button for own review */}
                {user && review.user?.id === user.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={deleteMutation.isPending}
                    className="mt-3 text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? '削除中...' : '削除する'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AccessTab({ restaurant }: { restaurant: RestaurantDetail }) {
  return (
    <div className="space-y-6">
      {/* Address */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">住所</h3>
        <p className="text-gray-600">{restaurant.address}</p>
      </div>

      {restaurant.nearest_station && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">最寄り駅</h3>
          <p className="text-gray-600">{restaurant.nearest_station}</p>
        </div>
      )}

      {/* Google Maps embed */}
      {restaurant.latitude != null && restaurant.longitude != null && (
        <div className="rounded-lg overflow-hidden border">
          <iframe
            title="Google Maps"
            src={`https://maps.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}&z=16&output=embed`}
            className="w-full h-96"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {restaurant.latitude == null && restaurant.longitude == null && (
        <p className="text-gray-500 text-center py-8">
          地図情報は登録されていません。
        </p>
      )}
    </div>
  );
}

function ReservationTab({ restaurant }: { restaurant: RestaurantDetail }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-gray-600">予約するにはログインが必要です。</p>
        <Link
          to="/login"
          className="inline-block rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 transition-colors"
        >
          ログインする
        </Link>
      </div>
    );
  }

  return <ReservationWizard restaurant={restaurant} />;
}

/* ========================================================================
   Main page component
   ======================================================================== */

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);
  const [activeTab, setActiveTab] = useState<TabKey>('top');
  const [accessMounted, setAccessMounted] = useState(false);

  if (activeTab === 'access' && !accessMounted) {
    setAccessMounted(true);
  }

  const { data: restaurant, isLoading, isError } = useRestaurant(restaurantId);

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  if (isError || !restaurant) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-red-500">
        レストラン情報の取得に失敗しました。
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        一覧に戻る
      </Link>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'top' && <TopTab restaurant={restaurant} />}
      {activeTab === 'menu' && <MenuTab restaurant={restaurant} />}
      {activeTab === 'reviews' && <ReviewsTab restaurant={restaurant} />}
      {accessMounted && (
        <div style={{ display: activeTab === 'access' ? undefined : 'none' }}>
          <AccessTab restaurant={restaurant} />
        </div>
      )}
      {activeTab === 'reservation' && <ReservationTab restaurant={restaurant} />}
    </div>
  );
}
