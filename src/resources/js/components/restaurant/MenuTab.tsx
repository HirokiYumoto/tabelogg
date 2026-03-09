import type { RestaurantDetail } from '@/types/restaurant';

export default function MenuTab({ restaurant }: { restaurant: RestaurantDetail }) {
  if (!restaurant.menu_info) {
    return (
      <p className="text-gray-500 text-center py-12">
        メニュー情報はまだ登録されていません。
      </p>
    );
  }

  return (
    <div className="prose max-w-none">
      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {restaurant.menu_info}
      </p>
    </div>
  );
}
