<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChatMessageResource;
use App\Http\Resources\ChatRoomResource;
use App\Models\ChatMessage;
use App\Models\ChatMessageDeletion;
use App\Models\ChatMessageImage;
use App\Models\ChatRoom;
use App\Models\ChatRoomDeletion;
use App\Models\Restaurant;
use App\Models\UserBlock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class ChatController extends Controller
{
    /**
     * 未読メッセージ数（軽量エンドポイント）
     */
    public function unreadCount()
    {
        $userId = Auth::id();

        $roomIds = ChatRoom::where('user_id', $userId)
            ->orWhereHas('restaurant', fn ($q) => $q->where('user_id', $userId))
            ->pluck('id');

        $count = ChatMessage::whereIn('chat_room_id', $roomIds)
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * チャットルーム一覧（未読数・最新メッセージ付き）
     * 削除済みルームは除外、削除後に新着があれば再表示
     */
    public function rooms(Request $request)
    {
        $userId = Auth::id();

        // ブロックしている/されているユーザーID
        $blockedUserIds = UserBlock::where('blocker_id', $userId)
            ->orWhere('blocked_id', $userId)
            ->get()
            ->flatMap(fn ($b) => [$b->blocker_id, $b->blocked_id])
            ->reject(fn ($id) => $id === $userId)
            ->unique()
            ->values();

        $rooms = ChatRoom::with(['restaurant.images', 'user', 'latestMessage'])
            ->withCount(['messages as unread_count' => function ($query) use ($userId) {
                $query->where('is_read', false)->where('sender_id', '!=', $userId);
            }])
            ->where(function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->orWhereHas('restaurant', fn ($q) => $q->where('user_id', $userId));
            })
            // ブロック関係のユーザーとのルームを除外
            ->when($blockedUserIds->isNotEmpty(), function ($query) use ($blockedUserIds) {
                $query->whereNotIn('user_id', $blockedUserIds)
                    ->whereDoesntHave('restaurant', fn ($q) => $q->whereIn('user_id', $blockedUserIds));
            })
            ->orderByDesc(
                ChatMessage::select('created_at')
                    ->whereColumn('chat_room_id', 'chat_rooms.id')
                    ->latest()
                    ->limit(1)
            )
            ->get();

        // ルーム削除フィルター: deleted_at 以降に新着メッセージがなければ除外
        $roomDeletions = ChatRoomDeletion::where('user_id', $userId)
            ->whereIn('chat_room_id', $rooms->pluck('id'))
            ->get()
            ->keyBy('chat_room_id');

        $rooms = $rooms->filter(function ($room) use ($roomDeletions) {
            $deletion = $roomDeletions->get($room->id);
            if (!$deletion) return true;
            // 削除後に新着メッセージがあれば再表示
            $latestAt = $room->latestMessage?->created_at;
            return $latestAt && $latestAt->gt($deletion->deleted_at);
        })->values();

        return ChatRoomResource::collection($rooms);
    }

    /**
     * メッセージ取得（カーソルページネーション）
     * 削除済みメッセージは除外
     */
    public function messages(Request $request, int $roomId)
    {
        $room = ChatRoom::findOrFail($roomId);
        $this->authorizeRoom($room);

        $userId = Auth::id();

        $query = ChatMessage::with(['sender', 'images'])
            ->where('chat_room_id', $roomId)
            // このユーザーが削除したメッセージを除外
            ->whereDoesntHave('deletions', fn ($q) => $q->where('user_id', $userId))
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
     * テキスト or 画像メッセージに対応
     */
    public function sendMessage(Request $request, int $restaurantId)
    {
        $hasImages = $request->hasFile('images');

        $request->validate([
            'body' => $hasImages ? 'nullable|string|max:2000' : 'required|string|max:2000',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|max:10240', // 10MB per image (before compression)
        ]);

        $restaurant = Restaurant::findOrFail($restaurantId);
        $userId = Auth::id();

        // ブロックチェック
        $isBlocked = UserBlock::where(function ($q) use ($userId, $restaurant) {
            $q->where('blocker_id', $userId)->where('blocked_id', $restaurant->user_id);
        })->orWhere(function ($q) use ($userId, $restaurant) {
            $q->where('blocker_id', $restaurant->user_id)->where('blocked_id', $userId);
        })->exists();

        if ($isBlocked) {
            abort(403, 'ブロック中のためメッセージを送信できません。');
        }

        // ルーム取得/作成
        if ($restaurant->user_id === $userId) {
            $request->validate(['room_id' => 'required|integer']);
            $room = ChatRoom::where('id', $request->integer('room_id'))
                ->where('restaurant_id', $restaurantId)
                ->firstOrFail();
        } else {
            $room = ChatRoom::firstOrCreate(
                ['restaurant_id' => $restaurantId, 'user_id' => $userId]
            );
        }

        $this->authorizeRoom($room);

        $type = $hasImages ? 'image' : 'text';

        $message = ChatMessage::create([
            'chat_room_id' => $room->id,
            'sender_id' => $userId,
            'type' => $type,
            'body' => $request->input('body'),
        ]);

        // 画像保存（圧縮: JPEG quality 60, 長辺1200px）
        if ($hasImages) {
            foreach ($request->file('images') as $file) {
                $img = Image::read($file);
                $img->scaleDown(width: 1200, height: 1200);
                $encoded = $img->toJpeg(60);

                $filename = uniqid('chat_') . '.jpg';
                $path = 'chat_images/' . $filename;
                Storage::disk('public')->put($path, (string) $encoded);

                ChatMessageImage::create([
                    'chat_message_id' => $message->id,
                    'image_path' => $path,
                ]);
            }
        }

        $message->load(['sender', 'images']);

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

        $updated = ChatMessage::where('chat_room_id', $roomId)
            ->where('sender_id', '!=', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        if ($updated > 0) {
            broadcast(new MessageRead($roomId, Auth::id()))->toOthers();
        }

        return response()->json(['message' => 'ok']);
    }

    /**
     * メッセージ非表示（自分の端末上のみ）
     */
    public function hideMessage(int $messageId)
    {
        $message = ChatMessage::findOrFail($messageId);
        $room = ChatRoom::findOrFail($message->chat_room_id);
        $this->authorizeRoom($room);

        ChatMessageDeletion::firstOrCreate([
            'chat_message_id' => $messageId,
            'user_id' => Auth::id(),
        ]);

        return response()->json(['message' => 'ok']);
    }

    /**
     * ルーム非表示（自分の端末上のみ）
     */
    public function hideRoom(int $roomId)
    {
        $room = ChatRoom::findOrFail($roomId);
        $this->authorizeRoom($room);

        ChatRoomDeletion::updateOrCreate(
            ['chat_room_id' => $roomId, 'user_id' => Auth::id()],
            ['deleted_at' => now()]
        );

        return response()->json(['message' => 'ok']);
    }

    private function authorizeRoom(ChatRoom $room): void
    {
        $this->authorize('view', $room);
    }
}
