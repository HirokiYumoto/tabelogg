<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRestaurantRequest;
use App\Http\Resources\RestaurantDetailResource;
use App\Models\City;
use App\Models\Restaurant;
use App\Models\RestaurantImage;
use App\Models\RestaurantSeatType;
use App\Models\RestaurantTimeSetting;
use App\Services\GeocodingService;

class RestaurantManageController extends Controller
{
    private GeocodingService $geocoding;

    public function __construct(GeocodingService $geocoding)
    {
        parent::__construct();
        $this->geocoding = $geocoding;
    }

    public function store(StoreRestaurantRequest $request)
    {
        $city = City::with('prefecture')->find($request->city_id);
        [$latitude, $longitude] = $this->geocoding->geocode($city, $request->address);

        $restaurant = Restaurant::create([
            'name' => $request->name,
            'description' => $request->description,
            'city_id' => $request->city_id,
            'postal_code' => $request->postal_code,
            'address' => $request->address,
            'nearest_station' => $request->nearest_station,
            'menu_info' => $request->menu_info,
            'max_party_size' => $request->max_party_size,
            'user_id' => auth()->id(),
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        $this->saveImages($restaurant, $request);
        $this->saveSeatTypes($restaurant, $request);
        $this->saveTimeSettings($restaurant, $request);

        return new RestaurantDetailResource($this->loadRelations($restaurant));
    }

    public function update(StoreRestaurantRequest $request, $id)
    {
        $restaurant = Restaurant::findOrFail($id);
        $this->authorize('update', $restaurant);

        $latitude = $restaurant->latitude;
        $longitude = $restaurant->longitude;

        if ($request->address !== $restaurant->address || (int) $request->city_id !== $restaurant->city_id) {
            $city = City::with('prefecture')->find($request->city_id);
            [$latitude, $longitude] = $this->geocoding->geocode($city, $request->address);
        }

        $restaurant->update([
            'name' => $request->name,
            'description' => $request->description,
            'city_id' => $request->city_id,
            'postal_code' => $request->postal_code,
            'address' => $request->address,
            'nearest_station' => $request->nearest_station,
            'menu_info' => $request->menu_info,
            'max_party_size' => $request->max_party_size,
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        $this->saveImages($restaurant, $request);

        $restaurant->seatTypes()->delete();
        $this->saveSeatTypes($restaurant, $request);

        $restaurant->timeSettings()->delete();
        $this->saveTimeSettings($restaurant, $request);

        return new RestaurantDetailResource($this->loadRelations($restaurant));
    }

    public function destroy($id)
    {
        $restaurant = Restaurant::findOrFail($id);
        $this->authorize('delete', $restaurant);

        $restaurant->delete();

        return response()->json(['message' => '店舗を削除しました。']);
    }

    private function saveImages(Restaurant $restaurant, StoreRestaurantRequest $request): void
    {
        if (!$request->hasFile('images')) return;

        foreach ($request->file('images') as $image) {
            $path = $image->store('restaurant_images', 'public');
            RestaurantImage::create([
                'restaurant_id' => $restaurant->id,
                'image_path' => $path,
            ]);
        }
    }

    private function saveSeatTypes(Restaurant $restaurant, StoreRestaurantRequest $request): void
    {
        if (!$request->has('seat_types')) return;

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

    private function saveTimeSettings(Restaurant $restaurant, StoreRestaurantRequest $request): void
    {
        if (!$request->has('time_settings')) return;

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

    private function loadRelations(Restaurant $restaurant): Restaurant
    {
        $restaurant->load(['city.prefecture', 'images', 'seatTypes', 'timeSettings', 'reviews.user', 'reviews.images']);
        $restaurant->loadCount(['favorites', 'reviews']);
        $restaurant->loadAvg('reviews', 'rating');
        return $restaurant;
    }
}
