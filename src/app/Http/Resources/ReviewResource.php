<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
            'rating' => $this->rating,
            'comment' => $this->comment,
            'images' => $this->whenLoaded('images', fn() =>
                $this->images->map(fn($img) => [
                    'id' => $img->id,
                    'image_path' => $img->image_path,
                ])
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
