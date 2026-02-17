<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'city' => $this->whenLoaded('city', fn() => [
                'id' => $this->city->id,
                'name' => $this->city->name,
                'prefecture' => $this->city->prefecture ? [
                    'id' => $this->city->prefecture->id,
                    'name' => $this->city->prefecture->name,
                ] : null,
            ]),
            'address' => $this->address,
            'nearest_station' => $this->nearest_station,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'max_party_size' => $this->max_party_size,
            'images' => $this->whenLoaded('images', fn() =>
                $this->images->map(fn($img) => [
                    'id' => $img->id,
                    'image_path' => $img->image_path,
                ])
            ),
            'reviews_avg_rating' => $this->when(
                isset($this->reviews_avg_rating),
                fn() => $this->reviews_avg_rating ? round((float) $this->reviews_avg_rating, 1) : null
            ),
            'reviews_count' => $this->when(isset($this->reviews_count), $this->reviews_count),
            'favorites_count' => $this->when(isset($this->favorites_count), $this->favorites_count),
            'distance' => $this->when(isset($this->distance), fn() => round((float) $this->distance, 2)),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
