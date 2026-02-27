<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $roomId,
        public int $readBy,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.room.' . $this->roomId),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'room_id' => $this->roomId,
            'read_by' => $this->readBy,
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.read';
    }
}
