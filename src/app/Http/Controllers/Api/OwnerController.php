<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Restaurant;
use Carbon\Carbon;

class OwnerController extends Controller
{
    public function dashboard(Restaurant $restaurant)
    {
        if ($restaurant->user_id !== auth()->id()) {
            return response()->json(['message' => 'この店舗の管理権限がありません。'], 403);
        }

        $today = Carbon::today();

        $reservations = Reservation::with(['user', 'seatType'])
            ->where('restaurant_id', $restaurant->id)
            ->where('reserved_at', '>=', $today)
            ->orderBy('reserved_at', 'asc')
            ->paginate(30);

        return response()->json([
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
            ],
            'reservations' => ReservationResource::collection($reservations)->response()->getData(true),
        ]);
    }
}
