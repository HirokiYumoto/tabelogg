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
        'description',
        'menu_info',
        'nearest_station',
        'city_id',
        'address',
        'user_id',
        'latitude',  // ★追加
        'longitude', // ★追加
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
        // 基本のデータ（id, name, descriptionなど）を取得
        $array = $this->toArray();

        // ★ここで住所やエリア名を追加します
        // これにより、Meilisearchが「新宿」や「東京都」でもヒットさせるようになります
        $array['city_name'] = $this->city->name ?? '';
        $array['prefecture_name'] = $this->city->prefecture->name ?? '';
        
        // address（番地）は元々 $this->toArray() に含まれていますが、
        // 念のため検索対象として意識しておきます。

        return $array;
    }
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
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