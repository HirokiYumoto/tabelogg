<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserBlock;
use Illuminate\Support\Facades\Auth;

class BlockController extends Controller
{
    /**
     * ブロック状態確認
     */
    public function status(int $userId)
    {
        $myId = Auth::id();

        $blocking = UserBlock::where('blocker_id', $myId)
            ->where('blocked_id', $userId)
            ->exists();

        $blockedBy = UserBlock::where('blocker_id', $userId)
            ->where('blocked_id', $myId)
            ->exists();

        return response()->json([
            'blocking' => $blocking,
            'blocked_by' => $blockedBy,
        ]);
    }

    /**
     * ブロック実行
     */
    public function store(int $userId)
    {
        $myId = Auth::id();

        if ($myId === $userId) {
            abort(422, '自分自身をブロックすることはできません。');
        }

        UserBlock::firstOrCreate([
            'blocker_id' => $myId,
            'blocked_id' => $userId,
        ]);

        return response()->json(['message' => 'ok']);
    }

    /**
     * ブロック解除
     */
    public function destroy(int $userId)
    {
        UserBlock::where('blocker_id', Auth::id())
            ->where('blocked_id', $userId)
            ->delete();

        return response()->json(['message' => 'ok']);
    }
}
