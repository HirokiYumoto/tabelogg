<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RestaurantSeatType extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'name',
        'type',
        'seats_per_unit',
        'capacity',
    ];

    // リレーション：この席タイプは、ある店舗に属している
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    // リレーション：この席タイプには、複数の予約が入る
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // 表示名を自動生成
    public static function generateName(string $type, int $seatsPerUnit, int $capacity): string
    {
        if ($type === 'counter') {
            return "カウンター（{$capacity}席）";
        }
        return "{$seatsPerUnit}名テーブル（{$capacity}卓）";
    }
}
