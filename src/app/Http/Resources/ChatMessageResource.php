<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chat_room_id' => $this->chat_room_id,
            'sender_id' => $this->sender_id,
            'sender_name' => $this->whenLoaded('sender', fn () => $this->sender->name),
            'body' => $this->body,
            'is_read' => $this->is_read,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
