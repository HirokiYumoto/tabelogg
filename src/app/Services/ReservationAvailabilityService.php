<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\Reservation;
use App\Models\RestaurantTimeSetting;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ReservationAvailabilityService
{
    /**
     * 指定月内で予約可能な日付一覧を返す
     */
    public function getAvailableDates(Restaurant $restaurant, int $people, int $year, int $month): array
    {
        $timeSettings = $restaurant->timeSettings->groupBy('day_of_week');
        if ($timeSettings->isEmpty()) {
            return [];
        }

        // 人数に対応可能な座席タイプを抽出
        $counterType = $restaurant->seatTypes->firstWhere('type', 'counter');
        $canUseCounter = $counterType && $counterType->capacity >= $people;

        $tableCandidates = $restaurant->seatTypes
            ->where('type', 'table')
            ->where('seats_per_unit', '>=', $people)
            ->sortBy('seats_per_unit');
        $canUseTable = $tableCandidates->isNotEmpty();

        if (!$canUseCounter && !$canUseTable) {
            return [];
        }

        // 月の範囲を決定（過去日はスキップ）
        $monthStart = Carbon::create($year, $month, 1)->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $today = Carbon::today();

        if ($monthStart->lt($today)) {
            $monthStart = $today->copy();
        }
        if ($monthStart->gt($monthEnd)) {
            return [];
        }

        // 月内の全予約を1クエリで一括取得
        $maxStay = $restaurant->timeSettings->max('stay_minutes') ?? 120;
        $reservations = Reservation::where('restaurant_id', $restaurant->id)
            ->where('reserved_at', '<', $monthEnd->copy()->endOfDay()->addMinutes($maxStay))
            ->where('end_at', '>', $monthStart->copy()->startOfDay())
            ->get(['restaurant_seat_type_id', 'reserved_at', 'end_at', 'number_of_people']);

        $now = Carbon::now();
        $availableDates = [];

        for ($date = $monthStart->copy(); $date->lte($monthEnd); $date->addDay()) {
            $dayOfWeek = $date->dayOfWeek;
            $daySettings = $timeSettings->get($dayOfWeek);

            if (!$daySettings) {
                continue;
            }

            $dateAvailable = false;

            foreach ($daySettings as $setting) {
                $slots = $this->generateTimeSlots($setting);

                foreach ($slots as $slotTime) {
                    $startDT = Carbon::parse($date->format('Y-m-d') . ' ' . $slotTime);
                    $endDT = $startDT->copy()->addMinutes($setting->stay_minutes);

                    // 過去の時間帯はスキップ
                    if ($startDT->lte($now)) {
                        continue;
                    }

                    $overlapping = $reservations->filter(function ($r) use ($startDT, $endDT) {
                        return $r->reserved_at < $endDT && $r->end_at > $startDT;
                    });

                    // カウンター空き判定
                    if ($canUseCounter) {
                        $occupied = $overlapping
                            ->where('restaurant_seat_type_id', $counterType->id)
                            ->sum('number_of_people');
                        if (($occupied + $people) <= $counterType->capacity) {
                            $dateAvailable = true;
                            break 2;
                        }
                    }

                    // テーブル空き判定
                    if ($canUseTable) {
                        foreach ($tableCandidates as $candidate) {
                            $count = $overlapping
                                ->where('restaurant_seat_type_id', $candidate->id)
                                ->count();
                            if ($count < $candidate->capacity) {
                                $dateAvailable = true;
                                break 3;
                            }
                        }
                    }
                }
            }

            if ($dateAvailable) {
                $availableDates[] = $date->format('Y-m-d');
            }
        }

        return $availableDates;
    }

    /**
     * 指定日の全時間スロットを可否フラグ付きで返す
     *
     * @return array<array{time: string, available: bool}>
     */
    public function getAvailableTimes(Restaurant $restaurant, int $people, string $date): array
    {
        $dateObj = Carbon::parse($date);
        $dayOfWeek = $dateObj->dayOfWeek;

        $settings = $restaurant->timeSettings->where('day_of_week', $dayOfWeek);
        if ($settings->isEmpty()) {
            return [];
        }

        $counterType = $restaurant->seatTypes->firstWhere('type', 'counter');
        $canUseCounter = $counterType && $counterType->capacity >= $people;

        $tableCandidates = $restaurant->seatTypes
            ->where('type', 'table')
            ->where('seats_per_unit', '>=', $people)
            ->sortBy('seats_per_unit');
        $canUseTable = $tableCandidates->isNotEmpty();

        $noSeatAvailable = !$canUseCounter && !$canUseTable;

        // 当日の予約を1クエリで取得
        $maxStay = $settings->max('stay_minutes');
        $dayStart = $dateObj->copy()->startOfDay();
        $dayEnd = $dateObj->copy()->endOfDay()->addMinutes($maxStay);

        $reservations = $noSeatAvailable ? collect() : Reservation::where('restaurant_id', $restaurant->id)
            ->where('reserved_at', '<', $dayEnd)
            ->where('end_at', '>', $dayStart)
            ->get(['restaurant_seat_type_id', 'reserved_at', 'end_at', 'number_of_people']);

        $now = Carbon::now();
        $result = [];
        $seen = [];

        foreach ($settings as $setting) {
            $slots = $this->generateTimeSlots($setting);

            foreach ($slots as $slotTime) {
                if (isset($seen[$slotTime])) {
                    continue;
                }
                $seen[$slotTime] = true;

                $startDT = Carbon::parse($date . ' ' . $slotTime);

                // 過去の時刻 or 席タイプなし → unavailable
                if ($startDT->lte($now) || $noSeatAvailable) {
                    $result[] = ['time' => $slotTime, 'available' => false];
                    continue;
                }

                // getAvailableSeatsと同じ方法でsettingを特定（時間フォーマット正規化）
                $matchedSetting = $settings
                    ->filter(function ($s) use ($slotTime) {
                        $start = substr($s->start_time, 0, 5);
                        $end   = substr($s->end_time, 0, 5);
                        return $start <= $slotTime && $end >= $slotTime;
                    })
                    ->first();

                if (!$matchedSetting) {
                    $result[] = ['time' => $slotTime, 'available' => false];
                    continue;
                }

                $endDT = $startDT->copy()->addMinutes($matchedSetting->stay_minutes);

                $overlapping = $reservations->filter(function ($r) use ($startDT, $endDT) {
                    return $r->reserved_at < $endDT && $r->end_at > $startDT;
                });

                $available = false;

                if ($canUseCounter) {
                    $occupied = $overlapping
                        ->where('restaurant_seat_type_id', $counterType->id)
                        ->sum('number_of_people');
                    if (($occupied + $people) <= $counterType->capacity) {
                        $available = true;
                    }
                }

                if (!$available && $canUseTable) {
                    foreach ($tableCandidates as $candidate) {
                        $count = $overlapping
                            ->where('restaurant_seat_type_id', $candidate->id)
                            ->count();
                        if ($count < $candidate->capacity) {
                            $available = true;
                            break;
                        }
                    }
                }

                $result[] = ['time' => $slotTime, 'available' => $available];
            }
        }

        usort($result, fn($a, $b) => strcmp($a['time'], $b['time']));

        return $result;
    }

    /**
     * 指定日時の予約可能な席カテゴリ一覧を返す
     */
    public function getAvailableSeats(Restaurant $restaurant, int $people, string $date, string $time): array
    {
        $dateObj = Carbon::parse($date);
        $dayOfWeek = $dateObj->dayOfWeek;

        $setting = $restaurant->timeSettings
            ->where('day_of_week', $dayOfWeek)
            ->filter(function ($s) use ($time) {
                $start = substr($s->start_time, 0, 5);
                $end   = substr($s->end_time, 0, 5);
                return $start <= $time && $end >= $time;
            })
            ->first();

        if (!$setting) {
            return [];
        }

        $startDT = Carbon::parse($date . ' ' . $time);
        $endDT = $startDT->copy()->addMinutes($setting->stay_minutes);

        $reservations = Reservation::where('restaurant_id', $restaurant->id)
            ->where('reserved_at', '<', $endDT)
            ->where('end_at', '>', $startDT)
            ->get(['restaurant_seat_type_id', 'number_of_people']);

        $result = [];

        // カウンター判定
        $counterType = $restaurant->seatTypes->firstWhere('type', 'counter');
        if ($counterType && $counterType->capacity >= $people) {
            $occupied = $reservations
                ->where('restaurant_seat_type_id', $counterType->id)
                ->sum('number_of_people');
            $remaining = $counterType->capacity - $occupied;
            if ($remaining >= $people) {
                $result[] = [
                    'value' => 'counter',
                    'label' => 'カウンター',
                    'hint' => '残り' . ($remaining - $people) . '席',
                ];
            }
        }

        // テーブル判定（ベストフィット）
        $tableCandidates = $restaurant->seatTypes
            ->where('type', 'table')
            ->where('seats_per_unit', '>=', $people)
            ->sortBy('seats_per_unit');

        foreach ($tableCandidates as $candidate) {
            $count = $reservations
                ->where('restaurant_seat_type_id', $candidate->id)
                ->count();
            $remaining = $candidate->capacity - $count;
            if ($remaining > 0) {
                $result[] = [
                    'value' => 'table',
                    'label' => 'テーブル（' . $candidate->seats_per_unit . '名席）',
                    'hint' => '残り' . $remaining . '卓',
                ];
                break; // ベストフィット: 最小の空きテーブルを1つだけ返す
            }
        }

        return $result;
    }

    /**
     * 営業時間設定から30分間隔のスロットを生成
     */
    private function generateTimeSlots(RestaurantTimeSetting $setting): array
    {
        $slots = [];
        $current = Carbon::parse($setting->start_time);
        $end = Carbon::parse($setting->end_time);

        while ($current->lte($end)) {
            $slots[] = $current->format('H:i');
            $current->addMinutes(30);
        }

        return $slots;
    }
}
