import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserReviews } from '@/api/dashboard';
import { deleteReview } from '@/api/reviews';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';

function stars(rating: number) {
  return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
}

export default function MyReviewsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['userReviews', page],
    queryFn: () => getUserReviews(page),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ reviewId }: { reviewId: number; restaurantId: number }) => deleteReview(reviewId),
    onSuccess: (_data, { restaurantId }) => {
      queryClient.invalidateQueries({ queryKey: ['userReviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  const handleDelete = (reviewId: number, restaurantId: number) => {
    if (!window.confirm('本当にこのレビューを削除しますか？')) return;
    deleteMutation.mutate({ reviewId, restaurantId });
  };

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  const reviews = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-12 lg:px-20 py-10">
      <div className="mb-6">
        <Link
          to="/mypage"
          className="text-sm text-orange-500 hover:underline font-bold"
        >
          &larr; マイページに戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">過去の口コミ一覧</h1>

      {reviews.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-10">投稿した口コミはありません。</p>
      ) : (
        <>
          <ul className="space-y-6">
            {reviews.map((review) => (
              <li key={review.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  {review.restaurant ? (
                    <Link
                      to={`/restaurants/${review.restaurant.id}`}
                      className="font-bold text-gray-800 hover:text-orange-500"
                    >
                      {review.restaurant.name}
                    </Link>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                    {new Date(review.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="flex items-center text-xs text-yellow-500 mb-3">
                  {stars(review.rating)}
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mb-3 whitespace-pre-wrap">
                  {review.comment}
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => review.restaurant && handleDelete(review.id, review.restaurant.id)}
                    disabled={deleteMutation.isPending || !review.restaurant}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
                  >
                    削除する
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {meta && (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
