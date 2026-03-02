<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'restaurant' => $this->whenLoaded('restaurant', fn() => [
                'id' => $this->restaurant->id,
                'name' => $this->restaurant->name,
            ]),
            'seat_type' => $this->whenLoaded('seatType', fn() => [
                'id' => $this->seatType->id,
                'name' => $this->seatType->name,
                'type' => $this->seatType->type,
            ]),
            'reserved_at' => $this->reserved_at?->toISOString(),
            'end_at' => $this->end_at?->toISOString(),
            'number_of_people' => $this->number_of_people,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
        ];
    }
}
