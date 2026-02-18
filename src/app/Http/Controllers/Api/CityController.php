<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\PostalCode;
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
            ->get(['id', 'name', 'reading', 'prefecture_id']);

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

    public function reversePostalCode(Request $request)
    {
        $request->validate([
            'prefecture_id' => 'required|exists:prefectures,id',
            'city_id' => 'required|exists:cities,id',
            'address' => 'nullable|string',
        ]);

        $base = PostalCode::where('prefecture_id', $request->prefecture_id)
            ->where('city_id', $request->city_id);

        // Try longest town-name match against the address
        if ($request->filled('address')) {
            $match = (clone $base)
                ->where('town', '!=', '')
                ->whereRaw('LOCATE(town, ?) = 1', [$request->address])
                ->orderByRaw('LENGTH(town) DESC')
                ->first();

            if ($match) {
                return response()->json(['postal_code' => $match->postal_code]);
            }
        }

        // Fallback: any postal code for this city
        $fallback = $base->first();
        if ($fallback) {
            return response()->json(['postal_code' => $fallback->postal_code]);
        }

        return response()->json(['postal_code' => null], 404);
    }
}
