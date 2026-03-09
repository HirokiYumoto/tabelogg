<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Http\Resources\RestaurantDetailResource;
use App\Models\Restaurant;
use App\Services\RestaurantSearchService;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    private RestaurantSearchService $searchService;

    public function __construct(RestaurantSearchService $searchService)
    {
        parent::__construct();
        $this->searchService = $searchService;
    }

    public function index(Request $request)
    {
        $result = $this->searchService->search($request);

        return RestaurantResource::collection($result['items'])->additional([
            'next_cursor' => $result['next_cursor'],
        ]);
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
