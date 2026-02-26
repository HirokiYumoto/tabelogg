<?php

namespace App\Events;

use App\Http\Resources\ChatMessageResource;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChatMessage $message,
        public ChatRoom $room,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.room.' . $this->room->id),
        ];
    }

    public function broadcastWith(): array
    {
        $this->message->load('sender');

        return [
            'message' => (new ChatMessageResource($this->message))->resolve(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
