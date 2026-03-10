<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\RestaurantBlock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BlockController extends Controller
{
    /**
     * ブロック状態確認
     */
    public function status(Request $request, int $restaurantId)
    {
        $myId = Auth::id();
        $restaurant = Restaurant::findOrFail($restaurantId);

        // オーナーの場合: クエリパラメータで対象ユーザーを指定
        // 一般ユーザーの場合: 自分自身が user_id
        $isOwner = (int) $restaurant->user_id === $myId;
        $userId = $isOwner
            ? (int) $request->query('user_id')
            : $myId;

        if (!$userId) {
            abort(422, 'user_id は必須です。');
        }

        // 自分がブロックした（blocker_id = $myId）
        $blocking = RestaurantBlock::where('restaurant_id', $restaurantId)
            ->where('user_id', $userId)
            ->where('blocker_id', $myId)
            ->exists();

        // 相手にブロックされた（blocker_id ≠ $myId）
        $blockerIdForOther = $isOwner ? $userId : $restaurant->user_id;
        $blockedBy = RestaurantBlock::where('restaurant_id', $restaurantId)
            ->where('user_id', $userId)
            ->where('blocker_id', $blockerIdForOther)
            ->exists();

        return response()->json([
            'blocking' => $blocking,
            'blocked_by' => $blockedBy,
        ]);
    }

    /**
     * ブロック実行
     */
    public function store(Request $request, int $restaurantId)
    {
        $myId = Auth::id();
        $restaurant = Restaurant::findOrFail($restaurantId);

        $isOwner = (int) $restaurant->user_id === $myId;
        $userId = $isOwner
            ? (int) $request->input('user_id')
            : $myId;

        if (!$userId) {
            abort(422, 'user_id は必須です。');
        }

        if ($isOwner && $userId === $myId) {
            abort(422, '自分自身をブロックすることはできません。');
        }

        RestaurantBlock::firstOrCreate([
            'restaurant_id' => $restaurantId,
            'user_id' => $userId,
            'blocker_id' => $myId,
        ]);

        return response()->json(['message' => 'ok']);
    }

    /**
     * ブロック解除
     */
    public function destroy(Request $request, int $restaurantId)
    {
        $myId = Auth::id();
        $restaurant = Restaurant::findOrFail($restaurantId);

        $isOwner = (int) $restaurant->user_id === $myId;
        $userId = $isOwner
            ? (int) $request->input('user_id')
            : $myId;

        if (!$userId) {
            abort(422, 'user_id は必須です。');
        }

        RestaurantBlock::where('restaurant_id', $restaurantId)
            ->where('user_id', $userId)
            ->where('blocker_id', $myId)
            ->delete();

        return response()->json(['message' => 'ok']);
    }
}
