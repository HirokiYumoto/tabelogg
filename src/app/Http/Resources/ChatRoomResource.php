<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatRoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'restaurant' => [
                'id' => $this->restaurant->id,
                'name' => $this->restaurant->name,
                'image' => $this->restaurant->images->first()?->image_path,
                'user_id' => $this->restaurant->user_id,
            ],
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'latest_message' => $this->whenLoaded('latestMessage', fn () => [
                'id' => $this->latestMessage->id,
                'type' => $this->latestMessage->type ?? 'text',
                'body' => $this->latestMessage->body,
                'sender_id' => $this->latestMessage->sender_id,
                'created_at' => $this->latestMessage->created_at?->toISOString(),
            ]),
            'unread_count' => $this->unread_count ?? 0,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
