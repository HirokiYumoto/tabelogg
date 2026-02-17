<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Resources\RestaurantResource;
use App\Http\Resources\ReviewResource;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function index()
    {
        $users = User::latest()->paginate(30, ['*'], 'users_page');
        $restaurants = Restaurant::with(['user', 'city.prefecture', 'images'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->withCount('favorites')
            ->latest()
            ->paginate(30, ['*'], 'restaurants_page');
        $reviews = Review::with(['user', 'restaurant', 'images'])->latest()->paginate(30, ['*'], 'reviews_page');

        return response()->json([
            'users' => UserResource::collection($users)->response()->getData(true),
            'restaurants' => RestaurantResource::collection($restaurants)->response()->getData(true),
            'reviews' => ReviewResource::collection($reviews)->response()->getData(true),
        ]);
    }

    public function destroyUser($id)
    {
        if ($id == Auth::id()) {
            return response()->json(['message' => '自分自身は削除できません。'], 422);
        }

        User::destroy($id);

        return response()->json(['message' => 'ユーザーを削除しました。']);
    }

    public function destroyRestaurant($id)
    {
        Restaurant::destroy($id);

        return response()->json(['message' => '店舗を削除しました。']);
    }

    public function destroyReview($id)
    {
        Review::destroy($id);

        return response()->json(['message' => 'レビューを削除しました。']);
    }
}
