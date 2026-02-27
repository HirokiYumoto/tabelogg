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
            'type' => $this->type ?? 'text',
            'body' => $this->body,
            'images' => $this->whenLoaded('images', fn () =>
                $this->images->map(fn ($img) => [
                    'id' => $img->id,
                    'url' => '/storage/' . $img->image_path,
                ])
            ),
            'is_read' => $this->is_read,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
