<?php

use App\Models\ChatRoom;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.room.{roomId}', function ($user, int $roomId) {
    $room = ChatRoom::with('restaurant')->find($roomId);

    if (!$room) {
        return false;
    }

    // ルームの参加ユーザー or 店舗オーナーのみ許可
    return $room->user_id === $user->id
        || ($room->restaurant && $room->restaurant->user_id === $user->id);
});

// ユーザー個人チャンネル（どの画面でもリアルタイム通知を受け取る）
Broadcast::channel('user.{userId}', function ($user, int $userId) {
    return $user->id === $userId;
});
