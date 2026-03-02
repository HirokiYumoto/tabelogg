<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PrefectureResource;
use App\Models\Prefecture;

class PrefectureController extends Controller
{
    public function index()
    {
        $prefectures = Prefecture::with('cities')->get();

        return PrefectureResource::collection($prefectures);
    }
}
