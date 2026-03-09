<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\RestaurantTimeSetting;
use App\Services\ReservationAvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    private ReservationAvailabilityService $availability;

    public function __construct(ReservationAvailabilityService $availability)
    {
        parent::__construct();
        $this->availability = $availability;
    }

    public function index()
    {
        $upcoming = Auth::user()->reservations()
            ->with(['restaurant', 'seatType'])
            ->where('reserved_at', '>=', now())
            ->orderBy('reserved_at', 'asc')
            ->paginate(20, ['*'], 'upcoming_page');

        $past = Auth::user()->reservations()
            ->with(['restaurant', 'seatType'])
            ->where('reserved_at', '<', now())
            ->orderBy('reserved_at', 'desc')
            ->paginate(20, ['*'], 'past_page');

        return response()->json([
            'upcoming' => ReservationResource::collection($upcoming)->response()->getData(true),
            'past' => ReservationResource::collection($past)->response()->getData(true),
        ]);
    }

    public function store(Request $request, Restaurant $restaurant)
    {
        if ($request->has('number_of_people')) {
            $request->merge(['number_of_people' => mb_convert_kana($request->number_of_people, 'n')]);
        }

        $request->validate([
            'seat_category' => 'required|in:counter,table',
            'reservation_date' => 'required|date|after_or_equal:today',
            'reservation_time' => 'required|date_format:H:i',
            'number_of_people' => 'required|integer|min:1',
        ]);

        $requestedPeople = (int) $request->number_of_people;

        if ($restaurant->max_party_size && $requestedPeople > $restaurant->max_party_size) {
            return response()->json([
                'message' => "一度の予約で最大{$restaurant->max_party_size}名までです。",
                'errors' => ['error' => ["一度の予約で最大{$restaurant->max_party_size}名までです。"]],
            ], 422);
        }

        $startDateTime = Carbon::parse($request->reservation_date . ' ' . $request->reservation_time);
        $dayOfWeek = $startDateTime->dayOfWeek;

        $timeSetting = RestaurantTimeSetting::where('restaurant_id', $restaurant->id)
            ->where(function ($q) use ($dayOfWeek) {
                $q->where('day_of_week', $dayOfWeek)->orWhere('day_of_week', 7);
            })
            ->where('start_time', '<=', $request->reservation_time)
            ->where('end_time', '>=', $request->reservation_time)
            ->first();

        if (!$timeSetting) {
            return response()->json([
                'message' => '指定された時間は予約を受け付けていません。',
                'errors' => ['time' => ['指定された時間は予約を受け付けていません。']],
            ], 422);
        }

        $endDateTime = $startDateTime->copy()->addMinutes($timeSetting->stay_minutes);

        return DB::transaction(function () use ($request, $restaurant, $requestedPeople, $startDateTime, $endDateTime) {
            $seatType = null;

            if ($request->seat_category === 'counter') {
                $seatType = $restaurant->seatTypes()->where('type', 'counter')->lockForUpdate()->first();
                if (!$seatType) {
                    return response()->json([
                        'message' => 'カウンター席が登録されていません。',
                        'errors' => ['error' => ['カウンター席が登録されていません。']],
                    ], 422);
                }

                $occupiedSeats = Reservation::where('restaurant_id', $restaurant->id)
                    ->where('restaurant_seat_type_id', $seatType->id)
                    ->where(function ($query) use ($startDateTime, $endDateTime) {
                        $query->where('reserved_at', '<', $endDateTime)
                              ->where('end_at', '>', $startDateTime);
                    })
                    ->lockForUpdate()
                    ->sum('number_of_people');

                if (($occupiedSeats + $requestedPeople) > $seatType->capacity) {
                    return response()->json([
                        'message' => 'カウンター席の空きが足りません。',
                        'errors' => ['error' => ['カウンター席の空きが足りません。']],
                    ], 422);
                }
            } else {
                $candidates = $restaurant->seatTypes()
                    ->where('type', 'table')
                    ->where('seats_per_unit', '>=', $requestedPeople)
                    ->orderBy('seats_per_unit', 'asc')
                    ->lockForUpdate()
                    ->get();

                if ($candidates->isEmpty()) {
                    return response()->json([
                        'message' => "{$requestedPeople}名が着席できるテーブルがありません。",
                        'errors' => ['error' => ["{$requestedPeople}名が着席できるテーブルがありません。"]],
                    ], 422);
                }

                $occupiedCounts = Reservation::where('restaurant_id', $restaurant->id)
                    ->whereIn('restaurant_seat_type_id', $candidates->pluck('id'))
                    ->where(function ($query) use ($startDateTime, $endDateTime) {
                        $query->where('reserved_at', '<', $endDateTime)
                              ->where('end_at', '>', $startDateTime);
                    })
                    ->lockForUpdate()
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
                    return response()->json([
                        'message' => '空きテーブルがありません。',
                        'errors' => ['error' => ['空きテーブルがありません。']],
                    ], 422);
                }
            }

            $reservation = Reservation::create([
                'user_id' => Auth::id(),
                'restaurant_id' => $restaurant->id,
                'restaurant_seat_type_id' => $seatType->id,
                'reserved_at' => $startDateTime,
                'end_at' => $endDateTime,
                'number_of_people' => $requestedPeople,
            ]);

            $reservation->load(['restaurant', 'seatType']);

            return new ReservationResource($reservation);
        });
    }

    public function destroy(Reservation $reservation)
    {
        $this->authorize('delete', $reservation);

        $reservation->delete();

        return response()->json(['message' => '予約をキャンセルしました。']);
    }

    public function availableDates(Request $request, Restaurant $restaurant)
    {
        $request->validate([
            'people' => 'required|integer|min:1',
            'year'   => 'required|integer',
            'month'  => 'required|integer|between:1,12',
        ]);

        $people = (int) $request->people;

        if ($restaurant->max_party_size && $people > $restaurant->max_party_size) {
            return response()->json([
                'dates' => [],
                'error' => "一度の予約で最大{$restaurant->max_party_size}名までです。",
            ]);
        }

        $restaurant->load(['seatTypes', 'timeSettings']);

        $dates = $this->availability->getAvailableDates(
            $restaurant, $people, (int) $request->year, (int) $request->month
        );

        return response()->json(['dates' => $dates]);
    }

    public function availableTimes(Request $request, Restaurant $restaurant)
    {
        $request->validate([
            'people' => 'required|integer|min:1',
            'date'   => 'required|date',
        ]);

        $restaurant->load(['seatTypes', 'timeSettings']);

        $times = $this->availability->getAvailableTimes(
            $restaurant, (int) $request->people, $request->date
        );

        return response()->json(['times' => $times]);
    }

    public function availableSeats(Request $request, Restaurant $restaurant)
    {
        $request->validate([
            'people' => 'required|integer|min:1',
            'date'   => 'required|date',
            'time'   => 'required|date_format:H:i',
        ]);

        $restaurant->load(['seatTypes', 'timeSettings']);

        $result = $this->availability->getAvailableSeats(
            $restaurant, (int) $request->people, $request->date, $request->time
        );

        return response()->json($result);
    }
}
