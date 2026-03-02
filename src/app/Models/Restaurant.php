<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Restaurant extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        'name',
        'name_reading',
        'description',
        'description_reading',
        'menu_info',
        'menu_info_reading',
        'nearest_station',
        'nearest_station_reading',
        'city_id',
        'address',
        'user_id',
        'latitude',
        'longitude',
        'max_party_size',
        'postal_code',
        'review_summary',
    ];

    protected $casts = [
        'review_summary' => 'array',
    ];

    // 店舗の所有者（ユーザー）へのリレーション
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function images()
    {
        return $this->hasMany(RestaurantImage::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    /**
     * 検索エンジン（Meilisearch）に保存するデータ構造を定義
     */
   /**
     * Meilisearchのインデックス対象となるデータを定義
     */
  /**
     * Meilisearchの検索対象に含めるデータを定義
     */
    public function toSearchableArray()
    {
        $array = $this->toArray();

        $array['city_name'] = $this->city->name ?? '';
        $array['prefecture_name'] = $this->city->prefecture->name ?? '';

        // ひらがな読みフィールド（表記ゆれ吸収用）
        $array['name_reading'] = $this->name_reading ?? '';
        $array['description_reading'] = $this->description_reading ?? '';
        $array['menu_info_reading'] = $this->menu_info_reading ?? '';
        $array['nearest_station_reading'] = $this->nearest_station_reading ?? '';

        return $array;
    }
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // チャットルーム
    public function chatRooms()
    {
        return $this->hasMany(ChatRoom::class);
    }

    // ★追加: 店舗は複数の「席タイプ」を持つ
    public function seatTypes()
    {
        return $this->hasMany(RestaurantSeatType::class);
    }

    // ★追加: 店舗は複数の「時間設定」を持つ
    public function timeSettings()
    {
        return $this->hasMany(RestaurantTimeSetting::class);
    }

}