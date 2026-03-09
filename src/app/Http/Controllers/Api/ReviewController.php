<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Jobs\GenerateReviewSummaryJob;
use App\Models\Restaurant;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function store(Request $request, $restaurantId)
    {
        $exists = Review::where('restaurant_id', $restaurantId)
            ->where('user_id', Auth::id())
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'この店舗にはすでにレビューを投稿済みです。',
                'errors' => ['comment' => ['この店舗にはすでにレビューを投稿済みです。']],
            ], 422);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:500',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $review = Review::create([
            'restaurant_id' => $restaurantId,
            'user_id' => Auth::id(),
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('reviews', 'public');
                $review->images()->create(['image_path' => $path]);
            }
        }

        $restaurant = Restaurant::find($restaurantId);
        GenerateReviewSummaryJob::dispatch($restaurant);

        $review->load(['user', 'images']);

        return new ReviewResource($review);
    }

    public function destroy(Review $review)
    {
        $this->authorize('delete', $review);

        $restaurant = $review->restaurant;
        $review->delete();

        GenerateReviewSummaryJob::dispatch($restaurant);

        return response()->json(['message' => 'レビューを削除しました。']);
    }
}
