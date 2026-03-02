<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

class RestaurantDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'menu_info' => $this->menu_info,
            'city' => $this->whenLoaded('city', fn() => [
                'id' => $this->city->id,
                'name' => $this->city->name,
                'prefecture' => $this->city->prefecture ? [
                    'id' => $this->city->prefecture->id,
                    'name' => $this->city->prefecture->name,
                ] : null,
            ]),
            'address' => $this->address,
            'postal_code' => $this->postal_code,
            'nearest_station' => $this->nearest_station,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'max_party_size' => $this->max_party_size,
            'user_id' => $this->user_id,
            'images' => $this->whenLoaded('images', fn() =>
                $this->images->map(fn($img) => [
                    'id' => $img->id,
                    'image_path' => $img->image_path,
                ])
            ),
            'reviews' => ReviewResource::collection($this->whenLoaded('reviews')),
            'review_summary' => $this->review_summary,
            'reviews_avg_rating' => $this->when(
                isset($this->reviews_avg_rating),
                fn() => $this->reviews_avg_rating ? round((float) $this->reviews_avg_rating, 1) : null
            ),
            'reviews_count' => $this->when(isset($this->reviews_count), $this->reviews_count),
            'favorites_count' => $this->when(isset($this->favorites_count), $this->favorites_count),
            'seat_types' => $this->whenLoaded('seatTypes', fn() =>
                $this->seatTypes->map(fn($st) => [
                    'id' => $st->id,
                    'name' => $st->name,
                    'type' => $st->type,
                    'seats_per_unit' => $st->seats_per_unit,
                    'capacity' => $st->capacity,
                ])
            ),
            'time_settings' => $this->whenLoaded('timeSettings', fn() =>
                $this->timeSettings->map(fn($ts) => [
                    'id' => $ts->id,
                    'day_of_week' => $ts->day_of_week,
                    'start_time' => $ts->start_time,
                    'end_time' => $ts->end_time,
                    'stay_minutes' => $ts->stay_minutes,
                ])
            ),
            'is_favorited' => $this->when(
                Auth::check(),
                fn() => $this->favorites()->where('user_id', Auth::id())->exists(),
                false
            ),
            'has_reviewed' => $this->when(
                Auth::check(),
                fn() => $this->reviews()->where('user_id', Auth::id())->exists(),
                false
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
