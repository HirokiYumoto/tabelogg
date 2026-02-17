import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRestaurant } from '@/hooks/useRestaurants';
import { storeReview } from '@/api/reviews';
import StarRating from '@/components/ui/StarRating';
import Spinner from '@/components/ui/Spinner';

export default function ReviewCreatePage() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading } = useRestaurant(restaurantId);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storeMutation = useMutation({
    mutationFn: (formData: FormData) => storeReview(restaurantId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      navigate(`/restaurants/${restaurantId}`, { replace: true });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('rating', String(rating));
    formData.append('comment', comment);
    images.forEach((file) => {
      formData.append('images[]', file);
    });
    storeMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  if (!restaurant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-red-500">
        レストラン情報の取得に失敗しました。
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        to={`/restaurants/${restaurantId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-6"
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
        {restaurant.name} に戻る
      </Link>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-1">口コミを投稿</h1>
        <p className="text-sm text-gray-500 mb-6">{restaurant.name}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              評価
            </label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onChange={setRating}
            />
          </div>

          {/* Comment */}
          <div>
            <label
              htmlFor="review-comment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              コメント
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="レストランの感想を書いてください..."
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              画像 (任意)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
            />
            {images.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {images.length}枚の画像が選択されています
              </p>
            )}
          </div>

          {/* Error */}
          {storeMutation.isError && (
            <p className="text-sm text-red-600">
              投稿に失敗しました。もう一度お試しください。
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={storeMutation.isPending || !comment.trim()}
              className="rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {storeMutation.isPending ? '送信中...' : '投稿する'}
            </button>
            <Link
              to={`/restaurants/${restaurantId}`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
