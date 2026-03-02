<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostalCode extends Model
{
    public $timestamps = false;

    protected $fillable = ['postal_code', 'prefecture_id', 'city_id', 'town'];

    public function prefecture()
    {
        return $this->belongsTo(Prefecture::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }
}
