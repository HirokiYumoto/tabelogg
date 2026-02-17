<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Http\Resources\ReviewResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function userReviews(Request $request)
    {
        $user = Auth::user();

        $reviews = $user->reviews()
            ->with('restaurant')
            ->orderByDesc('created_at')
            ->paginate(10);

        $reviews->getCollection()->transform(fn($r) => [
            'id' => $r->id,
            'restaurant' => $r->restaurant ? [
                'id' => $r->restaurant->id,
                'name' => $r->restaurant->name,
            ] : null,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'created_at' => $r->created_at->toISOString(),
        ]);

        return response()->json($reviews);
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        // Upcoming reservations
        $upcoming = $user->reservations()
            ->with(['restaurant', 'seatType'])
            ->where('reserved_at', '>=', now())
            ->orderBy('reserved_at')
            ->get()
            ->map(fn($r) => [
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

        // Past reservations (latest 3)
        $past = $user->reservations()
            ->with(['restaurant', 'seatType'])
            ->where('reserved_at', '<', now())
            ->orderByDesc('reserved_at')
            ->limit(3)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'restaurant' => $r->restaurant ? [
                    'id' => $r->restaurant->id,
                    'name' => $r->restaurant->name,
                ] : null,
                'seat_type' => $r->seatType ? [
                    'id' => $r->seatType->id,
                    'name' => $r->seatType->name,
                ] : null,
                'reserved_at' => $r->reserved_at->toISOString(),
                'end_at' => $r->end_at->toISOString(),
                'number_of_people' => $r->number_of_people,
            ]);

        $pastTotal = $user->reservations()
            ->where('reserved_at', '<', now())
            ->count();

        // Favorites
        $favorites = $user->favorites()
            ->with(['restaurant.city.prefecture', 'restaurant.images'])
            ->get()
            ->filter(fn($f) => $f->restaurant !== null)
            ->values()
            ->map(fn($f) => [
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

        // Reviews
        $reviews = $user->reviews()
            ->with(['restaurant', 'images'])
            ->orderByDesc('created_at')
            ->get()
            ->filter(fn($r) => $r->restaurant !== null)
            ->values()
            ->map(fn($r) => [
                'id' => $r->id,
                'restaurant' => [
                    'id' => $r->restaurant->id,
                    'name' => $r->restaurant->name,
                ],
                'rating' => $r->rating,
                'comment' => $r->comment,
                'created_at' => $r->created_at->toISOString(),
            ]);

        $result = [
            'upcoming_reservations' => $upcoming,
            'past_reservations' => $past,
            'past_reservations_total' => $pastTotal,
            'favorites' => $favorites,
            'reviews' => $reviews,
        ];

        // Owner: owned restaurants
        if ($user->isStoreOwner()) {
            $result['owned_restaurants'] = $user->restaurants()
                ->with(['images', 'city.prefecture'])
                ->get()
                ->map(fn($r) => [
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

        return response()->json($result);
    }
}
