import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminDashboard,
  deleteUser,
  deleteAdminRestaurant,
  deleteAdminReview,
} from '@/api/admin';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';
import StarRating from '@/components/ui/StarRating';

type TabKey = 'users' | 'restaurants' | 'reviews';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'users', label: 'ユーザー管理' },
  { key: 'restaurants', label: '店舗管理' },
  { key: 'reviews', label: '口コミ管理' },
];

const ROLE_LABELS: Record<number, string> = {
  1: '一般',
  2: 'オーナー',
  3: '管理者',
};

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [usersPage, setUsersPage] = useState(1);
  const [restaurantsPage, setRestaurantsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminDashboard', usersPage, restaurantsPage, reviewsPage],
    queryFn: () =>
      getAdminDashboard({
        users_page: usersPage,
        restaurants_page: restaurantsPage,
        reviews_page: reviewsPage,
      }),
    staleTime: 2 * 60 * 1000,
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: deleteAdminRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: deleteAdminReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });

  const handleDeleteUser = (id: number, name: string) => {
    if (!window.confirm(`ユーザー「${name}」を削除しますか？`)) return;
    deleteUserMutation.mutate(id);
  };

  const handleDeleteRestaurant = (id: number, name: string) => {
    if (!window.confirm(`店舗「${name}」を削除しますか？`)) return;
    deleteRestaurantMutation.mutate(id);
  };

  const handleDeleteReview = (id: number) => {
    if (!window.confirm('この口コミを削除しますか？')) return;
    deleteReviewMutation.mutate(id);
  };

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center">
        <p className="text-gray-500">ダッシュボードの情報を取得できませんでした。</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">管理者ダッシュボード</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div>
          {data.users.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg shadow text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-gray-600">
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">名前</th>
                      <th className="px-4 py-3 font-medium">メールアドレス</th>
                      <th className="px-4 py-3 font-medium">権限</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.data.map((user) => (
                      <tr key={user.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{user.id}</td>
                        <td className="px-4 py-3">{user.name}</td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              user.role_id === 3
                                ? 'bg-purple-100 text-purple-700'
                                : user.role_id === 2
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {ROLE_LABELS[user.role_id] ?? '不明'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={deleteUserMutation.isPending}
                            className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={data.users.meta.current_page}
                lastPage={data.users.meta.last_page}
                onPageChange={setUsersPage}
              />
            </>
          ) : (
            <p className="text-gray-500 bg-white rounded-lg shadow p-6 text-center">
              ユーザーがいません。
            </p>
          )}
        </div>
      )}

      {/* Restaurants tab */}
      {activeTab === 'restaurants' && (
        <div>
          {data.restaurants.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg shadow text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-gray-600">
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">店舗名</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.restaurants.data.map((restaurant) => (
                      <tr key={restaurant.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{restaurant.id}</td>
                        <td className="px-4 py-3">{restaurant.name}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteRestaurant(restaurant.id, restaurant.name)}
                            disabled={deleteRestaurantMutation.isPending}
                            className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={data.restaurants.meta.current_page}
                lastPage={data.restaurants.meta.last_page}
                onPageChange={setRestaurantsPage}
              />
            </>
          ) : (
            <p className="text-gray-500 bg-white rounded-lg shadow p-6 text-center">
              店舗がありません。
            </p>
          )}
        </div>
      )}

      {/* Reviews tab */}
      {activeTab === 'reviews' && (
        <div>
          {data.reviews.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg shadow text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-gray-600">
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">投稿者</th>
                      <th className="px-4 py-3 font-medium">評価</th>
                      <th className="px-4 py-3 font-medium">コメント</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reviews.data.map((review) => (
                      <tr key={review.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{review.id}</td>
                        <td className="px-4 py-3">{review.user?.name ?? '-'}</td>
                        <td className="px-4 py-3">
                          <StarRating rating={review.rating} size="sm" />
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="truncate text-gray-600">
                            {review.comment.length > 50
                              ? review.comment.slice(0, 50) + '...'
                              : review.comment}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={deleteReviewMutation.isPending}
                            className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={data.reviews.meta.current_page}
                lastPage={data.reviews.meta.last_page}
                onPageChange={setReviewsPage}
              />
            </>
          ) : (
            <p className="text-gray-500 bg-white rounded-lg shadow p-6 text-center">
              口コミがありません。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
