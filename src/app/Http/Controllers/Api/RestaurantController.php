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

        // Sort
        $sort = $request->input('sort');
        $lat = $request->input('lat');
        $lng = $request->input('lng');

        switch ($sort) {
            case 'distance':
                if ($lat && $lng) {
                    $query->selectRaw(
                        '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance',
                        [$lat, $lng, $lat]
                    )->orderBy('distance');
                }
                break;
            case 'rating':
                $query->orderByDesc('reviews_avg_rating');
                break;
            case 'favorites':
                $query->orderByDesc('favorites_count');
                break;
            case 'reviews':
                $query->orderByDesc('reviews_count');
                break;
            default:
                $query->latest();
                break;
        }

        $restaurants = $query->paginate(12);

        return RestaurantResource::collection($restaurants);
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
