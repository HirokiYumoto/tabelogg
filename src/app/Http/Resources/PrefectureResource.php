<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrefectureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'cities' => $this->whenLoaded('cities', fn() =>
                $this->cities->map(fn($city) => [
                    'id' => $city->id,
                    'name' => $city->name,
                ])
            ),
        ];
    }
}
