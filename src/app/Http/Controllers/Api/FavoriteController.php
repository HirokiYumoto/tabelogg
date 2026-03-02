<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class FavoriteController extends Controller
{
    public function store($restaurantId)
    {
        $user = Auth::user();

        if (!$user->favorites()->where('restaurant_id', $restaurantId)->exists()) {
            $user->favorites()->create(['restaurant_id' => $restaurantId]);
        }

        return response()->json(['message' => 'お気に入りに追加しました。']);
    }

    public function destroy($restaurantId)
    {
        $user = Auth::user();
        $user->favorites()->where('restaurant_id', $restaurantId)->delete();

        return response()->json(['message' => 'お気に入りを解除しました。']);
    }
}
