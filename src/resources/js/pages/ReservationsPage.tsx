import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReservations, deleteReservation } from '@/api/reservations';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', upcomingPage, pastPage],
    queryFn: () => getReservations({ upcoming_page: upcomingPage, past_page: pastPage }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  const handleDelete = (id: number) => {
    if (!window.confirm('この予約をキャンセルしますか？')) return;
    deleteMutation.mutate(id);
  };

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">予約一覧</h1>

      {/* Upcoming reservations */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">今後の予約</h2>
        {data && data.upcoming.data.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">店舗名</th>
                    <th className="px-4 py-3 font-medium">日時</th>
                    <th className="px-4 py-3 font-medium">人数</th>
                    <th className="px-4 py-3 font-medium">座席タイプ</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcoming.data.map((r) => (
                    <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {r.restaurant ? (
                          <Link
                            to={`/restaurants/${r.restaurant.id}`}
                            className="text-orange-500 hover:text-orange-600 hover:underline"
                          >
                            {r.restaurant.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">{formatDateTime(r.reserved_at)}</td>
                      <td className="px-4 py-3">{r.number_of_people}名</td>
                      <td className="px-4 py-3">{r.seat_type?.name ?? '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deleteMutation.isPending}
                          className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          キャンセル
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {data.upcoming.data.map((r) => (
                <div key={r.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {r.restaurant ? (
                        <Link
                          to={`/restaurants/${r.restaurant.id}`}
                          className="text-orange-500 hover:text-orange-600 hover:underline font-medium"
                        >
                          {r.restaurant.name}
                        </Link>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      キャンセル
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>日時: {formatDateTime(r.reserved_at)}</p>
                    <p>人数: {r.number_of_people}名</p>
                    <p>座席: {r.seat_type?.name ?? '-'}</p>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={data.upcoming.meta.current_page}
              lastPage={data.upcoming.meta.last_page}
              onPageChange={setUpcomingPage}
            />
          </>
        ) : (
          <p className="text-gray-500 bg-white rounded-lg shadow p-6 text-center">
            今後の予約はありません。
          </p>
        )}
      </section>

      {/* Past reservations */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">過去の予約</h2>
        {data && data.past.data.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">店舗名</th>
                    <th className="px-4 py-3 font-medium">日時</th>
                    <th className="px-4 py-3 font-medium">人数</th>
                    <th className="px-4 py-3 font-medium">座席タイプ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.past.data.map((r) => (
                    <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {r.restaurant ? (
                          <Link
                            to={`/restaurants/${r.restaurant.id}`}
                            className="text-orange-500 hover:text-orange-600 hover:underline"
                          >
                            {r.restaurant.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
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
              {data.past.data.map((r) => (
                <div key={r.id} className="bg-white rounded-lg shadow p-4">
                  <div className="mb-2">
                    {r.restaurant ? (
                      <Link
                        to={`/restaurants/${r.restaurant.id}`}
                        className="text-orange-500 hover:text-orange-600 hover:underline font-medium"
                      >
                        {r.restaurant.name}
                      </Link>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>日時: {formatDateTime(r.reserved_at)}</p>
                    <p>人数: {r.number_of_people}名</p>
                    <p>座席: {r.seat_type?.name ?? '-'}</p>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={data.past.meta.current_page}
              lastPage={data.past.meta.last_page}
              onPageChange={setPastPage}
            />
          </>
        ) : (
          <p className="text-gray-500 bg-white rounded-lg shadow p-6 text-center">
            過去の予約はありません。
          </p>
        )}
      </section>
    </div>
  );
}
