import type { RestaurantDetail } from '@/types/restaurant';

export default function AccessTab({ restaurant }: { restaurant: RestaurantDetail }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">住所</h3>
        <p className="text-gray-600">{restaurant.address}</p>
      </div>

      {restaurant.nearest_station && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">最寄り駅</h3>
          <p className="text-gray-600">{restaurant.nearest_station}</p>
        </div>
      )}

      {restaurant.latitude != null && restaurant.longitude != null && (
        <div className="rounded-lg overflow-hidden border">
          <iframe
            title="Google Maps"
            src={`https://maps.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}&z=16&output=embed`}
            className="w-full h-96"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {restaurant.latitude == null && restaurant.longitude == null && (
        <p className="text-gray-500 text-center py-8">
          地図情報は登録されていません。
        </p>
      )}
    </div>
  );
}
