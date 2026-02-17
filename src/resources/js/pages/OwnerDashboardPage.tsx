import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOwnerDashboard } from '@/api/owner';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';

export default function OwnerDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['ownerDashboard', restaurantId, page],
    queryFn: () => getOwnerDashboard(restaurantId, { page }),
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  });

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-gray-500">ダッシュボードの情報を取得できませんでした。</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">{data.restaurant.name} - ダッシュボード</h1>
        <Link
          to={`/restaurants/${data.restaurant.id}/edit`}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          店舗情報を編集
        </Link>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">予約一覧</h2>

        {data.reservations.data.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">予約者</th>
                    <th className="px-4 py-3 font-medium">日時</th>
                    <th className="px-4 py-3 font-medium">人数</th>
                    <th className="px-4 py-3 font-medium">座席タイプ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reservations.data.map((r) => (
                    <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3">{r.user?.name ?? '-'}</td>
                      <td className="px-4 py-3">{formatDateTime(r.reserved_at)}</td>
                      <td className="px-4 py-3">{r.number_of_people}名</td>
                      <td className="px-4 py-3">{r.seat_type?.name ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {data.reservations.data.map((r) => (
                <div key={r.id} className="bg-white rounded-lg shadow p-4">
                  <p className="font-medium text-gray-800 mb-2">{r.user?.name ?? '-'}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>日時: {formatDateTime(r.reserved_at)}</p>
                    <p>人数: {r.number_of_people}名</p>
                    <p>座席: {r.seat_type?.name ?? '-'}</p>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={data.reservations.meta.current_page}
              lastPage={data.reservations.meta.last_page}
              onPageChange={setPage}
            />
          </>
        ) : (
          <p className="text-gray-500 bg-white rounded-lg shadow p-6 text-center">
            予約はまだありません。
          </p>
        )}
      </section>
    </div>
  );
}
