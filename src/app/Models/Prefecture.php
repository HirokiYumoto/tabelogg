<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prefecture extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'reading'];

    // ★★★ これが足りていなかったためエラーになっていました ★★★
    // 都道府県は複数の市区町村を持つ
    public function cities()
    {
        return $this->hasMany(City::class);
    }
}