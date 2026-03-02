import { Link } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserReviews } from '@/api/dashboard';
import { deleteReview } from '@/api/reviews';
import VirtualGrid from '@/components/ui/VirtualGrid';
import { ReviewCardSkeleton } from '@/components/ui/Skeleton';
import type { DashboardReview } from '@/api/dashboard';

function stars(rating: number) {
  return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
}

export default function MyReviewsPage() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['userReviews'],
    queryFn: ({ pageParam }) => getUserReviews(pageParam || undefined),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
    maxPages: 25,
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

  const reviews = data?.pages.flatMap((page) => page.data) ?? [];

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

      {!isLoading && reviews.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-10">投稿した口コミはありません。</p>
      ) : (
        <>
          <VirtualGrid<DashboardReview>
            items={reviews}
            columns={1}
            estimateRowHeight={200}
            hasNextPage={hasNextPage ?? false}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            renderItem={(review) => (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
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
              </div>
            )}
            renderSkeleton={() => <ReviewCardSkeleton />}
            skeletonCount={3}
            gap="gap-6"
            isLoading={isLoading}
          />

          {!isLoading && !hasNextPage && reviews.length > 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              すべての口コミを表示しました
            </p>
          )}
        </>
      )}
    </div>
  );
}
