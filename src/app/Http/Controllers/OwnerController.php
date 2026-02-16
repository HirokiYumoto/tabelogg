<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Restaurant;
use App\Models\Reservation;
use Carbon\Carbon;

class OwnerController extends Controller
{
    public function dashboard(Restaurant $restaurant)
    {
        if ($restaurant->user_id !== auth()->id()) {
            abort(403, 'この店舗の管理権限がありません。');
        }

        $today = Carbon::today();

        // 未来の予約を取得（過去のものは今回は表示しない）
        // with()を使うことで、user情報とseatType情報を一度に取ってくる（高速化）
        $reservations = Reservation::with(['user', 'seatType'])
            ->where('restaurant_id', $restaurant->id)
            ->where('reserved_at', '>=', $today)
            ->orderBy('reserved_at', 'asc')
            ->paginate(30);

        return view('owner.dashboard', compact('restaurant', 'reservations'));
    }
}