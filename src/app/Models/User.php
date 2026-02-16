<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // ユーザーがお気に入り登録したデータ
    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    // ユーザーが投稿したレビューデータ
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    // ユーザーの予約データ
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // ユーザー自身が所有（作成）した店舗データ
    public function restaurants()
    {
        return $this->hasMany(Restaurant::class);
    }

    // 店舗オーナーかどうか判定
    public function isStoreOwner()
    {
        return $this->role_id === 2;
    }
}