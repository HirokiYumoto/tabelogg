<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantDetailResource;
use App\Models\City;
use App\Models\Restaurant;
use App\Models\RestaurantImage;
use App\Models\RestaurantSeatType;
use App\Models\RestaurantTimeSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class RestaurantManageController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'city_id' => 'required|exists:cities,id',
            'address' => 'required|string|max:255',
            'nearest_station' => 'nullable|string|max:255',
            'menu_info' => 'nullable|string',
            'max_party_size' => 'nullable|integer|min:1',
            'images.*' => 'nullable|image|max:2048',
            'seat_types' => 'nullable|array',
            'seat_types.*.type' => 'required_with:seat_types|in:counter,table',
            'seat_types.*.capacity' => 'required_with:seat_types|integer|min:1',
            'seat_types.*.seats_per_unit' => 'required_with:seat_types|integer|min:1',
            'time_settings' => 'nullable|array',
            'time_settings.*.day_of_week' => 'required|integer|between:0,7',
            'time_settings.*.start_time' => 'required|date_format:H:i',
            'time_settings.*.end_time' => ['required', 'regex:/^([01]\d|2[0-4]):[0-5]\d$/'],
            'time_settings.*.stay_minutes' => 'required|integer|in:30,60,90,120',
        ]);

        $city = City::with('prefecture')->find($request->city_id);
        [$latitude, $longitude] = $this->geocode($city, $request->address);

        $restaurant = Restaurant::create([
            'name' => $request->name,
            'description' => $request->description,
            'city_id' => $request->city_id,
            'address' => $request->address,
            'nearest_station' => $request->nearest_station,
            'menu_info' => $request->menu_info,
            'max_party_size' => $request->max_party_size,
            'user_id' => auth()->id(),
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('restaurant_images', 'public');
                RestaurantImage::create([
                    'restaurant_id' => $restaurant->id,
                    'image_path' => $path,
                ]);
            }
        }

        if ($request->has('seat_types')) {
            $now = now();
            $seatRows = collect($request->seat_types)->map(function ($st) use ($restaurant, $now) {
                $type = $st['type'];
                $capacity = (int) $st['capacity'];
                $seatsPerUnit = (int) $st['seats_per_unit'];
                return [
                    'restaurant_id' => $restaurant->id,
                    'name' => RestaurantSeatType::generateName($type, $seatsPerUnit, $capacity),
                    'type' => $type,
                    'seats_per_unit' => $seatsPerUnit,
                    'capacity' => $capacity,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();
            RestaurantSeatType::insert($seatRows);
        }

        if ($request->has('time_settings')) {
            $now = now();
            $timeRows = collect($request->time_settings)->map(function ($ts) use ($restaurant, $now) {
                return [
                    'restaurant_id' => $restaurant->id,
                    'day_of_week' => (int) $ts['day_of_week'],
                    'start_time' => $ts['start_time'],
                    'end_time' => $ts['end_time'],
                    'stay_minutes' => (int) $ts['stay_minutes'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();
            RestaurantTimeSetting::insert($timeRows);
        }

        $restaurant->load(['city.prefecture', 'images', 'seatTypes', 'timeSettings', 'reviews.user', 'reviews.images']);
        $restaurant->loadCount(['favorites', 'reviews']);
        $restaurant->loadAvg('reviews', 'rating');

        return new RestaurantDetailResource($restaurant);
    }

    public function update(Request $request, $id)
    {
        $restaurant = Restaurant::findOrFail($id);
        if ($restaurant->user_id !== auth()->id()) {
            return response()->json(['message' => '権限がありません。'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'city_id' => 'required|exists:cities,id',
            'address' => 'required|string|max:255',
            'nearest_station' => 'nullable|string|max:255',
            'menu_info' => 'nullable|string',
            'max_party_size' => 'nullable|integer|min:1',
            'images.*' => 'nullable|image|max:2048',
            'seat_types' => 'nullable|array',
            'seat_types.*.type' => 'required_with:seat_types|in:counter,table',
            'seat_types.*.capacity' => 'required_with:seat_types|integer|min:1',
            'seat_types.*.seats_per_unit' => 'required_with:seat_types|integer|min:1',
            'time_settings' => 'nullable|array',
            'time_settings.*.day_of_week' => 'required|integer|between:0,7',
            'time_settings.*.start_time' => 'required|date_format:H:i',
            'time_settings.*.end_time' => ['required', 'regex:/^([01]\d|2[0-4]):[0-5]\d$/'],
            'time_settings.*.stay_minutes' => 'required|integer|in:30,60,90,120',
        ]);

        $latitude = $restaurant->latitude;
        $longitude = $restaurant->longitude;

        if ($request->address !== $restaurant->address || (int) $request->city_id !== $restaurant->city_id) {
            $city = City::with('prefecture')->find($request->city_id);
            [$latitude, $longitude] = $this->geocode($city, $request->address);
        }

        $restaurant->update([
            'name' => $request->name,
            'description' => $request->description,
            'city_id' => $request->city_id,
            'address' => $request->address,
            'nearest_station' => $request->nearest_station,
            'menu_info' => $request->menu_info,
            'max_party_size' => $request->max_party_size,
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('restaurant_images', 'public');
                RestaurantImage::create([
                    'restaurant_id' => $restaurant->id,
                    'image_path' => $path,
                ]);
            }
        }

        $restaurant->seatTypes()->delete();
        if ($request->has('seat_types')) {
            $now = now();
            $seatRows = collect($request->seat_types)->map(function ($st) use ($restaurant, $now) {
                $type = $st['type'];
                $capacity = (int) $st['capacity'];
                $seatsPerUnit = (int) $st['seats_per_unit'];
                return [
                    'restaurant_id' => $restaurant->id,
                    'name' => RestaurantSeatType::generateName($type, $seatsPerUnit, $capacity),
                    'type' => $type,
                    'seats_per_unit' => $seatsPerUnit,
                    'capacity' => $capacity,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();
            RestaurantSeatType::insert($seatRows);
        }

        $restaurant->timeSettings()->delete();
        if ($request->has('time_settings')) {
            $now = now();
            $timeRows = collect($request->time_settings)->map(function ($ts) use ($restaurant, $now) {
                return [
                    'restaurant_id' => $restaurant->id,
                    'day_of_week' => (int) $ts['day_of_week'],
                    'start_time' => $ts['start_time'],
                    'end_time' => $ts['end_time'],
                    'stay_minutes' => (int) $ts['stay_minutes'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();
            RestaurantTimeSetting::insert($timeRows);
        }

        $restaurant->load(['city.prefecture', 'images', 'seatTypes', 'timeSettings', 'reviews.user', 'reviews.images']);
        $restaurant->loadCount(['favorites', 'reviews']);
        $restaurant->loadAvg('reviews', 'rating');

        return new RestaurantDetailResource($restaurant);
    }

    /**
     * Geocode an address with city-level fallback.
     * Tries full address first; if Nominatim returns no result, retries with just prefecture + city.
     */
    private function geocode(City $city, string $address): array
    {
        $prefectureName = $city->prefecture->name;
        $cityName = $city->name;

        try {
            // Always get city-level coordinates as baseline
            $cityAddress = $prefectureName . $cityName;
            $cityResult = $this->nominatimSearch($cityAddress);

            // Try full address
            $fullAddress = $prefectureName . $cityName . $address;
            $fullResult = $this->nominatimSearch($fullAddress);

            if ($fullResult && $cityResult) {
                // Verify the full-address result is within reasonable distance from city center (50km)
                $distance = $this->haversineDistance(
                    (float) $fullResult['lat'], (float) $fullResult['lon'],
                    (float) $cityResult['lat'], (float) $cityResult['lon']
                );

                if ($distance <= 50) {
                    return [$fullResult['lat'], $fullResult['lon']];
                }

                // Full address result is too far from city → use city-level
                \Log::info("Geocoding: full address result too far ({$distance}km), using city fallback for: {$fullAddress}");
                return [$cityResult['lat'], $cityResult['lon']];
            }

            if ($fullResult) {
                return [$fullResult['lat'], $fullResult['lon']];
            }

            if ($cityResult) {
                \Log::info("Geocoding fallback used for: {$fullAddress} → {$cityAddress}");
                return [$cityResult['lat'], $cityResult['lon']];
            }
        } catch (\Exception $e) {
            \Log::error('Geocoding Error: ' . $e->getMessage());
        }

        return [null, null];
    }

    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function nominatimSearch(string $query): ?array
    {
        $response = Http::withHeaders([
            'User-Agent' => 'LaravelApp/1.0 (test-user)',
        ])->get('https://nominatim.openstreetmap.org/search', [
            'q' => $query,
            'format' => 'json',
            'limit' => 1,
        ]);

        if ($response->successful() && !empty($response->json())) {
            return $response->json()[0];
        }

        return null;
    }

    public function destroy($id)
    {
        $restaurant = Restaurant::findOrFail($id);
        if ($restaurant->user_id !== auth()->id()) {
            return response()->json(['message' => '権限がありません。'], 403);
        }

        $restaurant->delete();

        return response()->json(['message' => '店舗を削除しました。']);
    }
}
