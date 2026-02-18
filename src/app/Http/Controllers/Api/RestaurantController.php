<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Http\Resources\RestaurantDetailResource;
use App\Models\Restaurant;
use App\Models\City;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    public function index(Request $request)
    {
        $query = Restaurant::query()
            ->select(['id', 'name', 'description', 'city_id', 'latitude', 'longitude', 'created_at'])
            ->with(['city.prefecture', 'images:id,restaurant_id,image_path'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->withCount('favorites');

        // Keyword search
        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('description', 'like', "%{$keyword}%")
                  ->orWhere('menu_info', 'like', "%{$keyword}%")
                  ->orWhere('nearest_station', 'like', "%{$keyword}%")
                  ->orWhere('address', 'like', "%{$keyword}%")
                  ->orWhereHas('city', function ($cq) use ($keyword) {
                      $cq->where('name', 'like', "%{$keyword}%")
                         ->orWhereHas('prefecture', function ($pq) use ($keyword) {
                             $pq->where('name', 'like', "%{$keyword}%");
                         });
                  });
            });
        }

        // Prefecture filter
        if ($request->filled('prefecture_id')) {
            $query->whereIn('city_id', City::where('prefecture_id', $request->prefecture_id)->select('id'));
        }

        // City filter (prefix match for designated cities like 横浜市 → 横浜市西区, 横浜市中区, etc.)
        if ($request->filled('city_id')) {
            $selectedCity = City::find($request->input('city_id'));
            if ($selectedCity) {
                $query->whereIn('city_id',
                    City::where('prefecture_id', $selectedCity->prefecture_id)
                        ->where('name', 'like', $selectedCity->name . '%')
                        ->select('id')
                );
            }
        }

        // Sort
        $sort = $request->input('sort');
        $lat = $request->input('lat');
        $lng = $request->input('lng');

        $useDistance = $sort === 'distance' && $lat && $lng;

        switch ($sort) {
            case 'distance':
                if ($useDistance) {
                    $query->selectRaw(
                        '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance',
                        [$lat, $lng, $lat]
                    )->orderBy('distance')->orderBy('restaurants.id');
                } else {
                    $query->latest('restaurants.created_at')->orderByDesc('restaurants.id');
                }
                break;
            case 'rating':
                $query->orderByRaw('COALESCE(reviews_avg_rating, 0) DESC')->orderByDesc('restaurants.id');
                break;
            case 'favorites':
                $query->orderByDesc('favorites_count')->orderByDesc('restaurants.id');
                break;
            case 'reviews':
                $query->orderByDesc('reviews_count')->orderByDesc('restaurants.id');
                break;
            default:
                $query->latest('restaurants.created_at')->orderByDesc('restaurants.id');
                break;
        }

        // Cursor pagination
        $perPage = 12;
        $cursor = $request->input('cursor');

        if ($cursor) {
            $decoded = json_decode(base64_decode($cursor), true);
            if ($decoded && isset($decoded['id'])) {
                $cursorValue = $decoded['v'];
                $cursorId = $decoded['id'];
                $this->applyCursorCondition($query, $sort, $useDistance, $cursorValue, $cursorId);
            }
        }

        $results = $query->limit($perPage + 1)->get();
        $hasMore = $results->count() > $perPage;
        $items = $hasMore ? $results->take($perPage) : $results;

        // Build next cursor
        $nextCursor = null;
        if ($hasMore && $items->isNotEmpty()) {
            $last = $items->last();
            $sortValue = match (true) {
                $sort === 'distance' && $useDistance => $last->distance,
                $sort === 'rating' => round((float) ($last->reviews_avg_rating ?? 0), 10),
                $sort === 'favorites' => (int) ($last->favorites_count ?? 0),
                $sort === 'reviews' => (int) ($last->reviews_count ?? 0),
                default => $last->created_at?->toISOString(),
            };
            $nextCursor = base64_encode(json_encode(['v' => $sortValue, 'id' => $last->id]));
        }

        return RestaurantResource::collection($items)->additional([
            'next_cursor' => $nextCursor,
        ]);
    }

    private function applyCursorCondition($query, $sort, $useDistance, $cursorValue, $cursorId)
    {
        switch ($sort) {
            case 'distance':
                if ($useDistance) {
                    // ASC: distance > cursor OR (distance = cursor AND id > cursorId)
                    $query->havingRaw(
                        '(distance > ? OR (distance = ? AND restaurants.id > ?))',
                        [$cursorValue, $cursorValue, $cursorId]
                    );
                } else {
                    // Fallback to newest DESC
                    $query->whereRaw(
                        '(restaurants.created_at < ? OR (restaurants.created_at = ? AND restaurants.id < ?))',
                        [$cursorValue, $cursorValue, $cursorId]
                    );
                }
                break;
            case 'rating':
                // DESC: COALESCE(rating, 0) < cursor OR (= cursor AND id < cursorId)
                $query->havingRaw(
                    '(COALESCE(reviews_avg_rating, 0) < ? OR (COALESCE(reviews_avg_rating, 0) = ? AND restaurants.id < ?))',
                    [$cursorValue, $cursorValue, $cursorId]
                );
                break;
            case 'favorites':
                $query->havingRaw(
                    '(favorites_count < ? OR (favorites_count = ? AND restaurants.id < ?))',
                    [$cursorValue, $cursorValue, $cursorId]
                );
                break;
            case 'reviews':
                $query->havingRaw(
                    '(reviews_count < ? OR (reviews_count = ? AND restaurants.id < ?))',
                    [$cursorValue, $cursorValue, $cursorId]
                );
                break;
            default:
                // newest: created_at DESC, id DESC
                $query->whereRaw(
                    '(restaurants.created_at < ? OR (restaurants.created_at = ? AND restaurants.id < ?))',
                    [$cursorValue, $cursorValue, $cursorId]
                );
                break;
        }
    }

    public function show($id)
    {
        $restaurant = Restaurant::with([
                'city.prefecture',
                'reviews.user',
                'reviews.images',
                'images',
                'seatTypes',
                'timeSettings',
            ])
            ->withCount('favorites')
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->findOrFail($id);

        return new RestaurantDetailResource($restaurant);
    }
}
