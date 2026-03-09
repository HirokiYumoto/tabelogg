<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    private DashboardService $dashboard;

    public function __construct(DashboardService $dashboard)
    {
        parent::__construct();
        $this->dashboard = $dashboard;
    }

    public function userReviews(Request $request)
    {
        $user = Auth::user();

        $reviews = $user->reviews()
            ->with('restaurant')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate(10);

        $reviews->getCollection()->transform(fn ($r) => [
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

    public function ownedRestaurants(Request $request)
    {
        $user = Auth::user();
        $perPage = 12;

        $query = $user->restaurants()
            ->with(['images', 'city.prefecture'])
            ->latest()
            ->orderByDesc('id');

        $cursor = $request->input('cursor');
        if ($cursor) {
            $decoded = json_decode(base64_decode($cursor), true);
            if ($decoded && isset($decoded['id'])) {
                $query->where(function ($q) use ($decoded) {
                    $q->where('created_at', '<', $decoded['v'])
                      ->orWhere(function ($q2) use ($decoded) {
                          $q2->where('created_at', '=', $decoded['v'])
                             ->where('id', '<', $decoded['id']);
                      });
                });
            }
        }

        $results = $query->limit($perPage + 1)->get();
        $hasMore = $results->count() > $perPage;
        $items = $hasMore ? $results->take($perPage) : $results;

        $nextCursor = null;
        if ($hasMore && $items->isNotEmpty()) {
            $last = $items->last();
            $nextCursor = base64_encode(json_encode([
                'v' => $last->created_at->toISOString(),
                'id' => $last->id,
            ]));
        }

        return response()->json([
            'data' => $items->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'image' => $r->images->first() ? '/storage/' . $r->images->first()->image_path : null,
                'city' => $r->city ? [
                    'name' => $r->city->name,
                    'prefecture' => $r->city->prefecture ? [
                        'name' => $r->city->prefecture->name,
                    ] : null,
                ] : null,
            ]),
            'next_cursor' => $nextCursor,
        ]);
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        return response()->json($this->dashboard->getDashboardData($user));
    }
}
