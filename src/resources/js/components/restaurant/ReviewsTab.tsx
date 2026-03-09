import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { deleteReview } from '@/api/reviews';
import type { RestaurantDetail } from '@/types/restaurant';
import StarRating from '@/components/ui/StarRating';
import ImageGallery from '@/components/ui/ImageGallery';

export default function ReviewsTab({ restaurant }: { restaurant: RestaurantDetail }) {
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
