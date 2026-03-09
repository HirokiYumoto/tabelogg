<?php

namespace App\Services;

use App\Models\User;

class DashboardService
{
    /**
     * マイページに必要な全データを一括取得する。
     *
     * @return array<string, mixed>
     */
    public function getDashboardData(User $user): array
    {
        $result = [
            'upcoming_reservations' => $this->getUpcomingReservations($user),
            'past_reservations' => $this->getPastReservations($user),
            'past_reservations_total' => $user->reservations()->where('reserved_at', '<', now())->count(),
            'favorites' => $this->getFavorites($user),
            'reviews' => $this->getReviews($user),
        ];

        if ($user->isStoreOwner()) {
            $result['owned_restaurants'] = $this->getOwnedRestaurants($user);
            $result['owned_restaurants_total'] = $user->restaurants()->count();
        }

        return $result;
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function getUpcomingReservations(User $user)
    {
        return $user->reservations()
            ->with(['restaurant', 'seatType'])
            ->where('reserved_at', '>=', now())
            ->orderBy('reserved_at')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'restaurant' => $r->restaurant ? [
                    'id' => $r->restaurant->id,
                    'name' => $r->restaurant->name,
                ] : null,
                'seat_type' => $r->seatType ? [
                    'id' => $r->seatType->id,
                    'name' => $r->seatType->name,
                    'type' => $r->seatType->type,
                ] : null,
                'reserved_at' => $r->reserved_at->toISOString(),
                'end_at' => $r->end_at->toISOString(),
                'number_of_people' => $r->number_of_people,
            ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function getPastReservations(User $user)
    {
        return $user->reservations()
            ->with(['restaurant', 'seatType'])
            ->where('reserved_at', '<', now())
            ->orderByDesc('reserved_at')
            ->limit(3)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'restaurant' => $r->restaurant ? [
                    'id' => $r->restaurant->id,
                    'name' => $r->restaurant->name,
                ] : null,
                'seat_type' => $r->seatType ? [
                    'id' => $r->seatType->id,
                    'name' => $r->seatType->name,
                    'type' => $r->seatType->type,
                ] : null,
                'reserved_at' => $r->reserved_at->toISOString(),
                'end_at' => $r->end_at->toISOString(),
                'number_of_people' => $r->number_of_people,
            ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function getFavorites(User $user)
    {
        return $user->favorites()
            ->with(['restaurant.city.prefecture', 'restaurant.images'])
            ->get()
            ->filter(fn ($f) => $f->restaurant !== null)
            ->values()
            ->map(fn ($f) => [
                'id' => $f->id,
                'restaurant' => [
                    'id' => $f->restaurant->id,
                    'name' => $f->restaurant->name,
                    'city' => $f->restaurant->city ? [
                        'name' => $f->restaurant->city->name,
                        'prefecture' => $f->restaurant->city->prefecture ? [
                            'name' => $f->restaurant->city->prefecture->name,
                        ] : null,
                    ] : null,
                ],
            ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function getReviews(User $user)
    {
        return $user->reviews()
            ->with(['restaurant', 'images'])
            ->orderByDesc('created_at')
            ->get()
            ->filter(fn ($r) => $r->restaurant !== null)
            ->values()
            ->map(fn ($r) => [
                'id' => $r->id,
                'restaurant' => [
                    'id' => $r->restaurant->id,
                    'name' => $r->restaurant->name,
                ],
                'rating' => $r->rating,
                'comment' => $r->comment,
                'created_at' => $r->created_at->toISOString(),
            ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function getOwnedRestaurants(User $user)
    {
        return $user->restaurants()
            ->with(['images', 'city.prefecture'])
            ->latest()
            ->limit(4)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'image' => $r->images->first() ? '/storage/' . $r->images->first()->image_path : null,
                'city' => $r->city ? [
                    'name' => $r->city->name,
                    'prefecture' => $r->city->prefecture ? [
                        'name' => $r->city->prefecture->name,
                    ] : null,
                ] : null,
            ]);
    }
}
