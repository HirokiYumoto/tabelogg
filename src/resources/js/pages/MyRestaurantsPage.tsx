import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOwnedRestaurants } from '@/api/dashboard';
import { deleteRestaurant } from '@/api/restaurants';
import Spinner from '@/components/ui/Spinner';
import type { OwnedRestaurant } from '@/api/dashboard';

function RestaurantCard({ r, onDestroy, destroying }: { r: OwnedRestaurant; onDestroy: (id: number, name: string) => void; destroying: boolean }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex items-start gap-4 bg-white">
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
            onClick={() => onDestroy(r.id, r.name)}
            disabled={destroying}
            className="text-xs whitespace-nowrap text-white px-3 py-1.5 rounded transition font-bold bg-red-500 hover:bg-red-600 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyRestaurantsPage() {
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['ownedRestaurants'],
    queryFn: ({ pageParam }) => getOwnedRestaurants(pageParam || undefined),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
  });

  const destroyMutation = useMutation({
    mutationFn: deleteRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownedRestaurants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  const handleDestroy = (id: number, name: string) => {
    if (!window.confirm(`「${name}」を削除しますか？この操作は取り消せません。`)) return;
    destroyMutation.mutate(id);
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  const restaurants = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-12 lg:px-20 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/mypage"
          className="text-sm text-orange-500 hover:underline font-bold"
        >
          &larr; マイページに戻る
        </Link>
        <Link
          to="/restaurants/create"
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-full shadow-md transition text-sm"
        >
          新しい店舗を登録する
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">掲載店舗一覧</h1>

      {restaurants.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-10">登録されている店舗はありません。</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map((r) => (
              <RestaurantCard
                key={r.id}
                r={r}
                onDestroy={handleDestroy}
                destroying={destroyMutation.isPending}
              />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && <Spinner className="py-8" />}

          {!hasNextPage && restaurants.length > 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              すべての掲載店舗を表示しました
            </p>
          )}
        </>
      )}
    </div>
  );
}
