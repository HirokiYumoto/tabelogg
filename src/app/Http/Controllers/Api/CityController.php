<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use Illuminate\Http\Request;

class CityController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'prefecture_id' => 'required|exists:prefectures,id',
        ]);

        $cities = City::where('prefecture_id', $request->prefecture_id)
            ->orderBy('name')
            ->get(['id', 'name', 'prefecture_id']);

        return response()->json(['data' => $cities]);
    }

    public function resolve(Request $request)
    {
        $request->validate([
            'prefecture_id' => 'required|exists:prefectures,id',
            'name' => 'required|string|max:255',
        ]);

        $city = City::firstOrCreate(
            [
                'prefecture_id' => $request->prefecture_id,
                'name' => $request->name,
            ]
        );

        return response()->json([
            'id' => $city->id,
            'name' => $city->name,
            'prefecture_id' => $city->prefecture_id,
        ]);
    }
}
