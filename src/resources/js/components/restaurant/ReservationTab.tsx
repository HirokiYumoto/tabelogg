import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { RestaurantDetail } from '@/types/restaurant';
import ReservationWizard from '@/components/reservation/ReservationWizard';

export default function ReservationTab({ restaurant }: { restaurant: RestaurantDetail }) {
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
