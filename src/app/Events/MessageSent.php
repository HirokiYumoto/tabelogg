<?php

namespace App\Events;

use App\Http\Resources\ChatMessageResource;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChatMessage $message,
        public ChatRoom $room,
    ) {}

    public function broadcastOn(): array
    {
        $this->room->loadMissing('restaurant');

        // 受信者を特定: 送信者がユーザーならオーナー、オーナーならユーザー
        $senderId = $this->message->sender_id;
        $recipientId = ($senderId === $this->room->user_id)
            ? $this->room->restaurant->user_id
            : $this->room->user_id;

        return [
            new PrivateChannel('chat.room.' . $this->room->id),
            new PrivateChannel('user.' . $recipientId),
        ];
    }

    public function broadcastWith(): array
    {
        $this->message->load(['sender', 'images']);

        return [
            'message' => (new ChatMessageResource($this->message))->resolve(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
