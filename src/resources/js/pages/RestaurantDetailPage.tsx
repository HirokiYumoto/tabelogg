import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useRestaurant } from '@/hooks/useRestaurants';
import Spinner from '@/components/ui/Spinner';
import TopTab from '@/components/restaurant/TopTab';
import MenuTab from '@/components/restaurant/MenuTab';
import ReviewsTab from '@/components/restaurant/ReviewsTab';
import AccessTab from '@/components/restaurant/AccessTab';
import ReservationTab from '@/components/restaurant/ReservationTab';

type TabKey = 'top' | 'menu' | 'reviews' | 'access' | 'reservation';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'top', label: 'トップ' },
  { key: 'menu', label: 'メニュー' },
  { key: 'reviews', label: '口コミ' },
  { key: 'access', label: 'アクセス' },
  { key: 'reservation', label: '予約' },
];

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);
  const location = useLocation();
  const initialTab = (location.state as { tab?: TabKey } | null)?.tab ?? 'top';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [accessMounted, setAccessMounted] = useState(false);

  if (activeTab === 'access' && !accessMounted) {
    setAccessMounted(true);
  }

  const { data: restaurant, isLoading, isError } = useRestaurant(restaurantId);

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  if (isError || !restaurant) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-red-500">
        レストラン情報の取得に失敗しました。
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-4"
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
        一覧に戻る
      </Link>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'top' && <TopTab restaurant={restaurant} />}
      {activeTab === 'menu' && <MenuTab restaurant={restaurant} />}
      {activeTab === 'reviews' && <ReviewsTab restaurant={restaurant} />}
      {accessMounted && (
        <div style={{ display: activeTab === 'access' ? undefined : 'none' }}>
          <AccessTab restaurant={restaurant} />
        </div>
      )}
      {activeTab === 'reservation' && <ReservationTab restaurant={restaurant} />}
    </div>
  );
}
