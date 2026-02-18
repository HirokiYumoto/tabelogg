import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboard } from '@/api/dashboard';
import { removeFavorite } from '@/api/favorites';
import { deleteReview } from '@/api/reviews';
import { deleteReservation } from '@/api/reservations';
import { deleteRestaurant } from '@/api/restaurants';
import Spinner from '@/components/ui/Spinner';
import type {
  DashboardReservation,
  DashboardFavorite,
  DashboardReview,
  OwnedRestaurant,
} from '@/api/dashboard';

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} (${dow}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function stars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/* ========================================================================
   Owner: Restaurant management section
   ======================================================================== */

function OwnerRestaurantsSection({ restaurants }: { restaurants: OwnedRestaurant[] }) {
  const queryClient = useQueryClient();

  const destroyMutation = useMutation({
    mutationFn: deleteRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  const handleDestroy = (id: number, name: string) => {
    if (!window.confirm(`「${name}」を削除しますか？この操作は取り消せません。`)) return;
    destroyMutation.mutate(id);
  };

  return (
    <>
      {/* CTA */}
      <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-l-4 border-orange-500 mb-8">
        <div className="p-6 text-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">あなたのお店を掲載しませんか？</h3>
            <p className="text-sm text-gray-500">簡単3ステップでお店を登録できます。</p>
          </div>
          <Link
            to="/restaurants/create"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition flex items-center gap-2 whitespace-nowrap"
          >
            新しい店舗を登録する
          </Link>
        </div>
      </div>

      {/* Owned restaurants */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 bg-orange-50 border-b border-orange-100">
          <h3 className="font-bold text-lg text-orange-800">あなたの掲載店舗管理</h3>
        </div>
        <div className="p-6">
          {restaurants.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">登録されている店舗はありません。</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurants.map((r) => (
                <div
                  key={r.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex items-start gap-4 bg-white"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                    {r.image ? (
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-50">
                        🍜
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-lg mb-1">
                      <Link
                        to={`/restaurants/${r.id}`}
                        className="hover:text-orange-500 hover:underline"
                      >
                        {r.name}
                      </Link>
                    </h4>
                    {r.city && (
                      <p className="text-xs text-gray-500 mb-2">
                        {r.city.prefecture?.name} {r.city.name}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Link
                        to={`/restaurants/${r.id}`}
                        className="text-xs whitespace-nowrap text-white px-3 py-1.5 rounded transition font-bold bg-gray-700 hover:bg-gray-800"
                      >
                        確認
                      </Link>
                      <Link
                        to={`/restaurants/${r.id}/edit`}
                        className="text-xs whitespace-nowrap text-white px-3 py-1.5 rounded transition font-bold bg-orange-500 hover:bg-orange-600"
                      >
                        編集
                      </Link>
                      <Link
                        to={`/owner/restaurants/${r.id}/dashboard`}
                        className="text-xs whitespace-nowrap text-white px-3 py-1.5 rounded transition font-bold bg-green-500 hover:bg-green-600"
                      >
                        予約確認
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDestroy(r.id, r.name)}
                        disabled={destroyMutation.isPending}
                        className="text-xs whitespace-nowrap text-white px-3 py-1.5 rounded transition font-bold bg-red-500 hover:bg-red-600 disabled:opacity-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ========================================================================
   Reservation history section
   ======================================================================== */

function ReservationSection({
  upcoming,
  past,
  pastTotal,
}: {
  upcoming: DashboardReservation[];
  past: DashboardReservation[];
  pastTotal: number;
}) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleCancel = (id: number) => {
    if (!window.confirm('この予約をキャンセルしますか？')) return;
    cancelMutation.mutate(id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
      <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-lg text-gray-800">予約履歴</h3>
        <Link to="/reservations" className="text-sm text-orange-500 hover:underline font-bold">
          すべて見る
        </Link>
      </div>
      <div className="p-6">
        {upcoming.length === 0 && past.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">まだ予約はありません。</p>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <>
                <h4 className="text-sm font-bold text-gray-700 mb-3 border-l-4 border-orange-500 pl-2">
                  今後の予約
                </h4>
                <div className="space-y-3 mb-6">
                  {upcoming.map((rv) => (
                    <div
                      key={rv.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        {rv.restaurant ? (
                          <Link
                            to={`/restaurants/${rv.restaurant.id}`}
                            className="font-bold text-orange-600 hover:underline"
                          >
                            {rv.restaurant.name}
                          </Link>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(rv.reserved_at)} 〜 {formatTime(rv.end_at)}
                          {rv.seat_type && <> ・{rv.seat_type.name}</>}
                          {' '}・{rv.number_of_people}名
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancel(rv.id)}
                        disabled={cancelMutation.isPending}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 px-3 py-1.5 rounded-full font-bold transition disabled:opacity-50 self-start sm:self-auto"
                      >
                        キャンセル
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Past */}
            {past.length > 0 && (
              <>
                <h4 className="text-sm font-bold text-gray-700 mb-3 border-l-4 border-gray-400 pl-2">
                  過去の予約
                </h4>
                <div className="space-y-2">
                  {past.map((rv) => (
                    <div key={rv.id} className="p-3 bg-gray-50 rounded-lg opacity-70">
                      {rv.restaurant ? (
                        <Link
                          to={`/restaurants/${rv.restaurant.id}`}
                          className="font-bold text-sm text-gray-700 hover:underline"
                        >
                          {rv.restaurant.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDateTime(rv.reserved_at)}
                        {rv.seat_type && <> ・{rv.seat_type.name}</>}
                        {' '}・{rv.number_of_people}名
                      </div>
                    </div>
                  ))}
                  {pastTotal > 3 && (
                    <Link
                      to="/reservations"
                      className="block text-center text-xs text-gray-500 hover:text-orange-500 pt-2"
                    >
                      他 {pastTotal - 3}件の過去の予約を見る
                    </Link>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ========================================================================
   Favorites section
   ======================================================================== */

function FavoritesSection({ favorites }: { favorites: DashboardFavorite[] }) {
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: (restaurantId: number) => removeFavorite(restaurantId),
    onSuccess: (_data, restaurantId) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  const handleRemove = (restaurantId: number) => {
    removeMutation.mutate(restaurantId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-full overflow-hidden">
      <div className="p-6 bg-gray-50 border-b border-gray-100">
        <h3 className="font-bold text-lg text-gray-800">お気に入り店舗</h3>
      </div>
      <div className="p-6">
        {favorites.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">まだお気に入りのお店はありません。</p>
        ) : (
          <ul className="space-y-4">
            {favorites.map((fav) => (
              <li
                key={fav.id}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/restaurants/${fav.restaurant.id}`}
                    className="font-bold text-blue-600 hover:underline block mb-1"
                  >
                    {fav.restaurant.name}
                  </Link>
                  {fav.restaurant.city && (
                    <p className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">
                      {fav.restaurant.city.prefecture?.name} {fav.restaurant.city.name}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(fav.restaurant.id)}
                  disabled={removeMutation.isPending}
                  className="text-xs text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1.5 rounded transition disabled:opacity-50 flex-shrink-0"
                >
                  解除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ========================================================================
   Reviews section
   ======================================================================== */

function ReviewsSection({ reviews }: { reviews: DashboardReview[] }) {
  const queryClient = useQueryClient();
  const recentReviews = reviews.slice(0, 3);

  const deleteMutation = useMutation({
    mutationFn: ({ reviewId }: { reviewId: number; restaurantId: number }) => deleteReview(reviewId),
    onSuccess: (_data, { restaurantId }) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  const handleDelete = (reviewId: number, restaurantId: number) => {
    if (!window.confirm('本当にこのレビューを削除しますか？')) return;
    deleteMutation.mutate({ reviewId, restaurantId });
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-full overflow-hidden">
      <div className="p-6 bg-gray-50 border-b border-gray-100">
        <h3 className="font-bold text-lg text-gray-800">投稿したレビュー</h3>
      </div>
      <div className="p-6">
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">まだ投稿したレビューはありません。</p>
        ) : (
          <>
            <ul className="space-y-6">
              {recentReviews.map((review) => (
                <li key={review.id} className="border-b border-gray-100 last:border-0 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Link
                      to={`/restaurants/${review.restaurant.id}`}
                      className="font-bold text-sm text-gray-800 hover:text-orange-500"
                    >
                      {review.restaurant.name}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-yellow-500 mb-2">
                    {stars(review.rating)}
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-2 whitespace-pre-wrap">
                    {review.comment}
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id, review.restaurant.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
                    >
                      削除する
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-center">
              <Link
                to="/mypage/reviews"
                className="inline-block text-sm text-orange-500 hover:text-orange-600 font-bold border border-orange-500 hover:bg-orange-50 px-4 py-2 rounded-full transition"
              >
                過去の口コミ一覧
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ========================================================================
   Main MyPage component
   ======================================================================== */

export default function MyPage() {
  const { user, isOwner } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <p className="text-gray-500">マイページの情報を取得できませんでした。</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 py-10 space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">マイページ</h1>
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-500 font-medium transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          プロフィール設定
        </Link>
      </div>

      {/* Owner: restaurant management */}
      {isOwner && data.owned_restaurants && (
        <OwnerRestaurantsSection restaurants={data.owned_restaurants} />
      )}

      {/* Reservations */}
      <ReservationSection
        upcoming={data.upcoming_reservations}
        past={data.past_reservations}
        pastTotal={data.past_reservations_total}
      />

      {/* Favorites & Reviews side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FavoritesSection favorites={data.favorites} />
        <ReviewsSection reviews={data.reviews} />
      </div>
    </div>
  );
}
