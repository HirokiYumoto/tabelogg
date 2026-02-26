<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChatMessageResource;
use App\Http\Resources\ChatRoomResource;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    /**
     * チャットルーム一覧（未読数・最新メッセージ付き）
     */
    public function rooms(Request $request)
    {
        $userId = Auth::id();

        $rooms = ChatRoom::with(['restaurant.images', 'user', 'latestMessage'])
            ->withCount(['messages as unread_count' => function ($query) use ($userId) {
                $query->where('is_read', false)->where('sender_id', '!=', $userId);
            }])
            ->where(function ($query) use ($userId) {
                // ユーザー自身が参加しているルーム
                $query->where('user_id', $userId)
                    // またはオーナーとして（自分の店舗の）ルーム
                    ->orWhereHas('restaurant', fn ($q) => $q->where('user_id', $userId));
            })
            ->orderByDesc(
                ChatMessage::select('created_at')
                    ->whereColumn('chat_room_id', 'chat_rooms.id')
                    ->latest()
                    ->limit(1)
            )
            ->get();

        return ChatRoomResource::collection($rooms);
    }

    /**
     * メッセージ取得（カーソルページネーション）
     */
    public function messages(Request $request, int $roomId)
    {
        $room = ChatRoom::findOrFail($roomId);
        $this->authorizeRoom($room);

        $query = ChatMessage::with('sender')
            ->where('chat_room_id', $roomId)
            ->orderByDesc('id');

        if ($request->has('cursor')) {
            $query->where('id', '<', $request->integer('cursor'));
        }

        $messages = $query->limit(50)->get();

        return ChatMessageResource::collection($messages)->additional([
            'next_cursor' => $messages->count() === 50 ? $messages->last()->id : null,
        ]);
    }

    /**
     * メッセージ送信（ルーム未作成なら自動作成）
     */
    public function sendMessage(Request $request, int $restaurantId)
    {
        $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $restaurant = Restaurant::findOrFail($restaurantId);
        $userId = Auth::id();

        // オーナー自身が送信する場合はルームのユーザーIDを特定する必要がある
        if ($restaurant->user_id === $userId) {
            // オーナーが送信 → room_id が必要
            $request->validate(['room_id' => 'required|integer']);
            $room = ChatRoom::where('id', $request->integer('room_id'))
                ->where('restaurant_id', $restaurantId)
                ->firstOrFail();
        } else {
            // 一般ユーザーが送信 → ルーム自動作成
            $room = ChatRoom::firstOrCreate(
                ['restaurant_id' => $restaurantId, 'user_id' => $userId]
            );
        }

        $this->authorizeRoom($room);

        $message = ChatMessage::create([
            'chat_room_id' => $room->id,
            'sender_id' => $userId,
            'body' => $request->input('body'),
        ]);

        $message->load('sender');

        broadcast(new MessageSent($message, $room))->toOthers();

        return new ChatMessageResource($message);
    }

    /**
     * 既読処理
     */
    public function markRead(Request $request, int $roomId)
    {
        $room = ChatRoom::findOrFail($roomId);
        $this->authorizeRoom($room);

        ChatMessage::where('chat_room_id', $roomId)
            ->where('sender_id', '!=', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'ok']);
    }

    /**
     * ルームへのアクセス権を確認
     */
    private function authorizeRoom(ChatRoom $room): void
    {
        $userId = Auth::id();
        $isParticipant = $room->user_id === $userId;
        $isOwner = $room->restaurant && $room->restaurant->user_id === $userId;

        if (!$isParticipant && !$isOwner) {
            abort(403, 'このチャットルームへのアクセス権がありません。');
        }
    }
}
