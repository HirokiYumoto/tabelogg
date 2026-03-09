<?php

namespace App\Services;

use App\Models\City;
use App\Models\Restaurant;
use Illuminate\Http\Request;

class RestaurantSearchService
{
    private MeCabService $mecab;

    public function __construct(MeCabService $mecab)
    {
        $this->mecab = $mecab;
    }

    /**
     * 検索・フィルタ・ソート・カーソルページネーションを適用した
     * レストランクエリの結果を返す。
     *
     * @return array{items: \Illuminate\Database\Eloquent\Collection, next_cursor: string|null}
     */
    public function search(Request $request, int $perPage = 12): array
    {
        $query = Restaurant::query()
            ->select(['id', 'name', 'description', 'city_id', 'latitude', 'longitude', 'created_at'])
            ->with(['city.prefecture', 'images:id,restaurant_id,image_path'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->withCount('favorites');

        $this->applyKeywordFilter($query, $request);
        $this->applyLocationFilter($query, $request);

        $sort = $request->input('sort');
        $lat = $request->input('lat');
        $lng = $request->input('lng');
        $useDistance = $sort === 'distance' && $lat && $lng;

        $this->applySort($query, $sort, $useDistance, $lat, $lng);
        $this->applyCursor($query, $request, $sort, $useDistance);

        $results = $query->limit($perPage + 1)->get();
        $hasMore = $results->count() > $perPage;
        $items = $hasMore ? $results->take($perPage) : $results;

        $nextCursor = null;
        if ($hasMore && $items->isNotEmpty()) {
            $nextCursor = $this->buildNextCursor($items->last(), $sort, $useDistance);
        }

        return ['items' => $items, 'next_cursor' => $nextCursor];
    }

    private function applyKeywordFilter($query, Request $request): void
    {
        if (!$request->filled('keyword')) return;

        $keyword = $request->keyword;
        try {
            $normalized = $this->mecab->normalize($keyword);
            $searchTerm = $normalized !== $keyword ? "{$keyword} {$normalized}" : $keyword;
            $ids = Restaurant::search($searchTerm)->take(10000)->keys()->toArray();
            if (!empty($ids)) {
                $query->whereIn('restaurants.id', $ids);
            } else {
                $this->applyLikeSearch($query, $keyword);
            }
        } catch (\Exception $e) {
            $this->applyLikeSearch($query, $keyword);
        }
    }

    private function applyLocationFilter($query, Request $request): void
    {
        if ($request->filled('prefecture_id')) {
            $query->whereIn('city_id', City::where('prefecture_id', $request->prefecture_id)->select('id'));
        }

        if ($request->filled('city_id')) {
            $selectedCity = City::find($request->input('city_id'));
            if ($selectedCity) {
                $query->whereIn('city_id',
                    City::where('prefecture_id', $selectedCity->prefecture_id)
                        ->where('name', 'like', $selectedCity->name . '%')
                        ->select('id')
                );
            }
        }
    }

    private function applySort($query, ?string $sort, bool $useDistance, $lat, $lng): void
    {
        switch ($sort) {
            case 'distance':
                if ($useDistance) {
                    $query->selectRaw(
                        '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance',
                        [$lat, $lng, $lat]
                    )->orderBy('distance')->orderBy('restaurants.id');
                } else {
                    $query->latest('restaurants.created_at')->orderByDesc('restaurants.id');
                }
                break;
            case 'rating':
                $query->orderByRaw('COALESCE(reviews_avg_rating, 0) DESC')->orderByDesc('restaurants.id');
                break;
            case 'favorites':
                $query->orderByDesc('favorites_count')->orderByDesc('restaurants.id');
                break;
            case 'reviews':
                $query->orderByDesc('reviews_count')->orderByDesc('restaurants.id');
                break;
            default:
                $query->latest('restaurants.created_at')->orderByDesc('restaurants.id');
                break;
        }
    }

    private function applyCursor($query, Request $request, ?string $sort, bool $useDistance): void
    {
        $cursor = $request->input('cursor');
        if (!$cursor) return;

        $decoded = json_decode(base64_decode($cursor), true);
        if (!$decoded || !isset($decoded['id'])) return;

        $cursorValue = $decoded['v'];
        $cursorId = $decoded['id'];

        switch ($sort) {
            case 'distance':
                if ($useDistance) {
                    $query->havingRaw(
                        '(distance > ? OR (distance = ? AND restaurants.id > ?))',
                        [$cursorValue, $cursorValue, $cursorId]
                    );
                } else {
                    $query->whereRaw(
                        '(restaurants.created_at < ? OR (restaurants.created_at = ? AND restaurants.id < ?))',
                        [$cursorValue, $cursorValue, $cursorId]
                    );
                }
                break;
            case 'rating':
                $query->havingRaw(
                    '(COALESCE(reviews_avg_rating, 0) < ? OR (COALESCE(reviews_avg_rating, 0) = ? AND restaurants.id < ?))',
                    [$cursorValue, $cursorValue, $cursorId]
                );
                break;
            case 'favorites':
                $query->havingRaw(
                    '(favorites_count < ? OR (favorites_count = ? AND restaurants.id < ?))',
                    [$cursorValue, $cursorValue, $cursorId]
                );
                break;
            case 'reviews':
                $query->havingRaw(
                    '(reviews_count < ? OR (reviews_count = ? AND restaurants.id < ?))',
                    [$cursorValue, $cursorValue, $cursorId]
                );
                break;
            default:
                $query->whereRaw(
                    '(restaurants.created_at < ? OR (restaurants.created_at = ? AND restaurants.id < ?))',
                    [$cursorValue, $cursorValue, $cursorId]
                );
                break;
        }
    }

    private function buildNextCursor($last, ?string $sort, bool $useDistance): string
    {
        $sortValue = match (true) {
            $sort === 'distance' && $useDistance => $last->distance,
            $sort === 'rating' => round((float) ($last->reviews_avg_rating ?? 0), 10),
            $sort === 'favorites' => (int) ($last->favorites_count ?? 0),
            $sort === 'reviews' => (int) ($last->reviews_count ?? 0),
            default => $last->created_at?->toISOString(),
        };
        return base64_encode(json_encode(['v' => $sortValue, 'id' => $last->id]));
    }

    private function applyLikeSearch($query, string $keyword): void
    {
        $query->where(function ($q) use ($keyword) {
            $q->where('name', 'like', "%{$keyword}%")
              ->orWhere('description', 'like', "%{$keyword}%")
              ->orWhere('menu_info', 'like', "%{$keyword}%")
              ->orWhere('nearest_station', 'like', "%{$keyword}%")
              ->orWhere('address', 'like', "%{$keyword}%")
              ->orWhereHas('city', function ($cq) use ($keyword) {
                  $cq->where('name', 'like', "%{$keyword}%")
                     ->orWhereHas('prefecture', function ($pq) use ($keyword) {
                         $pq->where('name', 'like', "%{$keyword}%");
                     });
              });
        });
    }
}
