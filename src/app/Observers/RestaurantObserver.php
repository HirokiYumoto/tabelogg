<?php

namespace App\Observers;

use App\Models\Restaurant;
use App\Services\MeCabService;

class RestaurantObserver
{
    public function __construct(
        private MeCabService $mecab,
    ) {}

    public function saving(Restaurant $restaurant): void
    {
        $fields = [
            'name' => 'name_reading',
            'description' => 'description_reading',
            'menu_info' => 'menu_info_reading',
            'nearest_station' => 'nearest_station_reading',
        ];

        foreach ($fields as $source => $reading) {
            if ($restaurant->isDirty($source)) {
                try {
                    $restaurant->{$reading} = $restaurant->{$source}
                        ? $this->mecab->normalize($restaurant->{$source})
                        : null;
                } catch (\Exception $e) {
                    \Log::warning("MeCab reading generation failed for restaurant {$restaurant->id}: {$e->getMessage()}");
                }
            }
        }
    }
}
