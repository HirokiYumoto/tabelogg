<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Restaurant;
use App\Models\Reservation;
use App\Models\RestaurantSeatType;
use App\Models\RestaurantTimeSetting;
use Carbon\Carbon;

class ReservationController extends Controller
{
    /**
     * マイ予約一覧
     */
    public function index()
    {
        $reservations = Auth::user()->reservations()
            ->with(['restaurant', 'seatType'])
            ->orderBy('reserved_at', 'desc')
            ->get();

        $upcoming = $reservations->where('reserved_at', '>=', now());
        $past = $reservations->where('reserved_at', '<', now());

        return view('reservations.index', compact('upcoming', 'past'));
    }

    /**
     * 予約フォーム表示
     */
    public function create(Restaurant $restaurant)
    {
        $seatTypes = $restaurant->seatTypes;
        return view('reservations.create', compact('restaurant', 'seatTypes'));
    }

    /**
     * 予約実行ロジック（ベストフィット自動割当）
     */
    public function store(Request $request, Restaurant $restaurant)
    {
        // 全角数字を半角に変換
        if ($request->has('number_of_people')) {
            $request->merge(['number_of_people' => mb_convert_kana($request->number_of_people, 'n')]);
        }

        // 1. 入力値のバリデーション
        $request->validate([
            'seat_category' => 'required|in:counter,table',
            'reservation_date' => 'required|date',
            'reservation_time' => 'required|date_format:H:i',
            'number_of_people' => 'required|integer|min:1',
        ]);

        $requestedPeople = (int) $request->number_of_people;

        // 1.5 一予約あたりの最大人数チェック
        if ($restaurant->max_party_size && $requestedPeople > $restaurant->max_party_size) {
            return back()->withErrors(['error' => "一度の予約で最大{$restaurant->max_party_size}名までです。"])->withInput();
        }

        // 予約開始日時をCarbonインスタンス化
        $startDateTime = Carbon::parse($request->reservation_date . ' ' . $request->reservation_time);
        $dayOfWeek = $startDateTime->dayOfWeek;

        // 2. その時間の「滞在時間ルール」を取得
        $timeSetting = RestaurantTimeSetting::where('restaurant_id', $restaurant->id)
            ->where('day_of_week', $dayOfWeek)
            ->where('start_time', '<=', $request->reservation_time)
            ->where('end_time', '>=', $request->reservation_time)
            ->first();

        if (!$timeSetting) {
            return back()->withErrors(['time' => '指定された時間は予約を受け付けていません。'])->withInput();
        }

        // 3. 終了時間を計算
        $endDateTime = $startDateTime->copy()->addMinutes($timeSetting->stay_minutes);

        // 4. 席の自動割当（ベストフィット）
        $seatType = null;

        if ($request->seat_category === 'counter') {
            // カウンター: 人数の合計で判定
            $seatType = $restaurant->seatTypes()->where('type', 'counter')->first();
            if (!$seatType) {
                return back()->withErrors(['error' => 'カウンター席が登録されていません。'])->withInput();
            }

            $occupiedSeats = Reservation::where('restaurant_id', $restaurant->id)
                ->where('restaurant_seat_type_id', $seatType->id)
                ->where(function ($query) use ($startDateTime, $endDateTime) {
                    $query->where('reserved_at', '<', $endDateTime)
                          ->where('end_at', '>', $startDateTime);
                })->sum('number_of_people');

            if (($occupiedSeats + $requestedPeople) > $seatType->capacity) {
                return back()->withErrors(['error' => '申し訳ありません。カウンター席の空きが足りません。'])->withInput();
            }
        } else {
            // テーブル: ベストフィット（seats_per_unit昇順で最小の空きテーブルを探す）
            $candidates = $restaurant->seatTypes()
                ->where('type', 'table')
                ->where('seats_per_unit', '>=', $requestedPeople)
                ->orderBy('seats_per_unit', 'asc')
                ->get();

            if ($candidates->isEmpty()) {
                return back()->withErrors(['error' => "{$requestedPeople}名が着席できるテーブルがありません。"])->withInput();
            }

            $occupiedCounts = Reservation::where('restaurant_id', $restaurant->id)
                ->whereIn('restaurant_seat_type_id', $candidates->pluck('id'))
                ->where(function ($query) use ($startDateTime, $endDateTime) {
                    $query->where('reserved_at', '<', $endDateTime)
                          ->where('end_at', '>', $startDateTime);
                })
                ->selectRaw('restaurant_seat_type_id, COUNT(*) as occupied_count')
                ->groupBy('restaurant_seat_type_id')
                ->pluck('occupied_count', 'restaurant_seat_type_id');

            foreach ($candidates as $candidate) {
                if ($occupiedCounts->get($candidate->id, 0) < $candidate->capacity) {
                    $seatType = $candidate;
                    break;
                }
            }

            if (!$seatType) {
                return back()->withErrors(['error' => '申し訳ありません。空きテーブルがありません。'])->withInput();
            }
        }

        Reservation::create([
            'user_id' => Auth::id(),
            'restaurant_id' => $restaurant->id,
            'restaurant_seat_type_id' => $seatType->id,
            'reserved_at' => $startDateTime,
            'end_at' => $endDateTime,
            'number_of_people' => $requestedPeople,
        ]);

        return redirect()->route('restaurants.show', $restaurant->id)
            ->with('success', '予約が完了しました！');
    }

    /**
     * 予約キャンセル（本人のみ）
     */
    public function destroy(Reservation $reservation)
    {
        if ($reservation->user_id !== Auth::id()) {
            abort(403, '権限がありません。');
        }

        $reservation->delete();

        return redirect()->route('reservations.index')
            ->with('success', '予約をキャンセルしました。');
    }
}
