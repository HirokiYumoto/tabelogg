<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Restaurant;
use App\Models\RestaurantImage;
use App\Models\Prefecture;
use App\Models\City;
use App\Models\Genre;
use App\Models\RestaurantSeatType;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\RestaurantTimeSetting;
use Illuminate\Support\Facades\Http;

class RestaurantController extends Controller
{
    /**
     * 店舗一覧表示（検索機能・並び替え機能付き）
     */
    public function index(Request $request)
    {
        // ベースのクエリ
        // 並び替えに必要なデータ（評価平均、レビュー数、お気に入り数）を事前に計算
        $query = Restaurant::query()
            ->select(['id', 'name', 'description', 'city_id', 'latitude', 'longitude', 'created_at'])
            ->with(['city.prefecture', 'images:id,restaurant_id,image_path'])
            ->withAvg('reviews', 'rating')  // reviews_avg_rating
            ->withCount('reviews')          // reviews_count
            ->withCount('favorites');       // favorites_count

     // 1. キーワード検索（Meilisearch利用）
        if ($request->filled('keyword')) {
            // キーワードを " " で囲んでフレーズ検索（完全一致）にします
            // これにより「高鼻」で「高島」がヒットするような誤検知を防ぎます
            $keyword = '"' . $request->keyword . '"';

            // Meilisearchで検索し、ヒットしたIDを取得
            $searchResultIds = Restaurant::search($keyword)->keys();
            
            // ヒットしたIDの店舗だけに絞り込む
            $query->whereIn('id', $searchResultIds);
        }

        // 2. エリア選択（プルダウン）による絞り込み
        if ($request->filled('prefecture_id')) {
            $query->whereIn('city_id', City::where('prefecture_id', $request->prefecture_id)->select('id'));
        }

        // 3. 並び替えロジック
        $sort = $request->input('sort');
        $lat = $request->input('lat');
        $lng = $request->input('lng');

        switch ($sort) {
            case 'nearest':
                // 現在地から近い順（位置情報がある場合のみ）
                if ($lat && $lng) {
                    // 球面三角法で距離を計算し、distanceという名前で取得して並び替え
                    $query->selectRaw(
                            '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance',
                            [$lat, $lng, $lat]
                        )
                        ->orderBy('distance');
                }
                break;

            case 'rating':
                // 評価が高い順
                $query->orderByDesc('reviews_avg_rating');
                break;

            case 'favorites':
                // お気に入り数が多い順
                $query->orderByDesc('favorites_count');
                break;

            case 'reviews':
                // 口コミ数が多い順
                $query->orderByDesc('reviews_count');
                break;

            default:
                // デフォルトは新着順
                $query->latest();
                break;
        }

        // ページネーション（検索条件を維持するためのappendsを追加）
        $restaurants = $query->paginate(12)->appends($request->all());
        
        $prefectures = cache()->store('array')->remember('headerPrefectures', 60, function () {
            return Prefecture::all();
        });

        return view('restaurants.index', compact('restaurants', 'prefectures'));
    }

    /**
     * 店舗詳細表示
     */
    public function show($id)
    {
        $restaurant = Restaurant::with([
                'city.prefecture',
                'reviews.user',
                'reviews.images',
                'images',
                'seatTypes',
                'timeSettings',
            ])
            ->withCount('favorites')
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->findOrFail($id);

        $isFavorited = Auth::check()
            ? $restaurant->favorites()->where('user_id', Auth::id())->exists()
            : false;

        return view('restaurants.show', compact('restaurant', 'isFavorited'));
    }

    /**
     * 店舗作成画面
     */
    public function create()
    {
        $prefectures = Prefecture::with('cities')->get();
        $genres = Genre::all();
        return view('restaurants.create', compact('prefectures', 'genres'));
    }

    /**
     * 店舗保存処理（OpenStreetMapによる自動座標取得付き）
     */
    public function store(Request $request)
    {
        // 1. 入力チェック
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'city_id' => 'required|exists:cities,id',
            'address' => 'required|string|max:255',
            'nearest_station' => 'nullable|string|max:255',
            'menu_info' => 'nullable|string',
            'max_party_size' => 'nullable|integer|min:1',
            'images.*' => 'nullable|image|max:2048',
            'seat_types' => 'nullable|array',
            'seat_types.*.type' => 'required_with:seat_types|in:counter,table',
            'seat_types.*.capacity' => 'required_with:seat_types|integer|min:1',
            'seat_types.*.seats_per_unit' => 'required_with:seat_types|integer|min:1',
            'time_settings' => 'nullable|array',
            'time_settings.*.day_of_week' => 'required|integer|between:0,7',
            'time_settings.*.start_time' => 'required|date_format:H:i',
            'time_settings.*.end_time' => ['required', 'regex:/^([01]\d|2[0-4]):[0-5]\d$/'],
            'time_settings.*.stay_minutes' => 'required|integer|in:30,60,90,120',
        ]);

        // 2. OpenStreetMapから座標を取得
        $latitude = null;
        $longitude = null;

        try {
            // 住所の組み立て
            $city = City::with('prefecture')->find($request->city_id);
            $fullAddress = $city->prefecture->name . $city->name . $request->address;

            // APIリクエスト
            $response = Http::withHeaders([
                'User-Agent' => 'LaravelApp/1.0 (test-user)' 
            ])->get('https://nominatim.openstreetmap.org/search', [
                'q' => $fullAddress,
                'format' => 'json',
                'limit' => 1,
            ]);

            // データがあれば座標を取り出す
            if ($response->successful() && !empty($response->json())) {
                $data = $response->json()[0];
                $latitude = $data['lat'];
                $longitude = $data['lon'];
            }

        } catch (\Exception $e) {
            \Log::error('Geocoding Error: ' . $e->getMessage());
        }

        // 3. データベースへ保存
        $restaurant = Restaurant::create([
            'name' => $request->name,
            'description' => $request->description,
            'city_id' => $request->city_id,
            'address' => $request->address,
            'nearest_station' => $request->nearest_station,
            'menu_info' => $request->menu_info,
            'max_party_size' => $request->max_party_size,
            'user_id' => auth()->id(),
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        // 4. 画像の保存
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('restaurant_images', 'public');
                RestaurantImage::create([
                    'restaurant_id' => $restaurant->id,
                    'image_path' => $path,
                ]);
            }
        }

        // 5. 座席タイプの一括保存
        if ($request->has('seat_types')) {
            $now = now();
            $seatRows = collect($request->seat_types)->map(function ($st) use ($restaurant, $now) {
                $type = $st['type'];
                $capacity = (int) $st['capacity'];
                $seatsPerUnit = (int) $st['seats_per_unit'];
                return [
                    'restaurant_id' => $restaurant->id,
                    'name' => RestaurantSeatType::generateName($type, $seatsPerUnit, $capacity),
                    'type' => $type,
                    'seats_per_unit' => $seatsPerUnit,
                    'capacity' => $capacity,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();
            RestaurantSeatType::insert($seatRows);
        }

        // 6. 営業時間の一括保存
        if ($request->has('time_settings')) {
            $now = now();
            $timeRows = collect($request->time_settings)->map(function ($ts) use ($restaurant, $now) {
                return [
                    'restaurant_id' => $restaurant->id,
                    'day_of_week' => (int) $ts['day_of_week'],
                    'start_time' => $ts['start_time'],
                    'end_time' => $ts['end_time'],
                    'stay_minutes' => (int) $ts['stay_minutes'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();
            RestaurantTimeSetting::insert($timeRows);
        }

        return redirect()->route('dashboard')->with('success', '店舗を登録しました！');
    }

    /**
     * 店舗編集画面
     */
    public function edit($id)
    {
        $restaurant = Restaurant::with(['seatTypes', 'timeSettings', 'images'])->findOrFail($id);
        if ($restaurant->user_id !== auth()->id()) {
            abort(403, '権限がありません。');
        }

        $prefectures = Prefecture::with('cities')->get();
        $genres = Genre::all();
        return view('restaurants.edit', compact('restaurant', 'prefectures', 'genres'));
    }

    /**
     * 店舗更新処理
     */
    public function update(Request $request, $id)
    {
        $restaurant = Restaurant::findOrFail($id);
        if ($restaurant->user_id !== auth()->id()) {
            abort(403, '権限がありません。');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'city_id' => 'required|exists:cities,id',
            'address' => 'required|string|max:255',
            'nearest_station' => 'nullable|string|max:255',
            'menu_info' => 'nullable|string',
            'max_party_size' => 'nullable|integer|min:1',
            'images.*' => 'nullable|image|max:2048',
            'seat_types' => 'nullable|array',
            'seat_types.*.type' => 'required_with:seat_types|in:counter,table',
            'seat_types.*.capacity' => 'required_with:seat_types|integer|min:1',
            'seat_types.*.seats_per_unit' => 'required_with:seat_types|integer|min:1',
            'time_settings' => 'nullable|array',
            'time_settings.*.day_of_week' => 'required|integer|between:0,7',
            'time_settings.*.start_time' => 'required|date_format:H:i',
            'time_settings.*.end_time' => ['required', 'regex:/^([01]\d|2[0-4]):[0-5]\d$/'],
            'time_settings.*.stay_minutes' => 'required|integer|in:30,60,90,120',
        ]);

        // 住所変更時は座標を再取得
        $latitude = $restaurant->latitude;
        $longitude = $restaurant->longitude;
        $oldAddress = $restaurant->address;
        $oldCityId = $restaurant->city_id;

        if ($request->address !== $oldAddress || (int) $request->city_id !== $oldCityId) {
            try {
                $city = City::with('prefecture')->find($request->city_id);
                $fullAddress = $city->prefecture->name . $city->name . $request->address;
                $response = Http::withHeaders([
                    'User-Agent' => 'LaravelApp/1.0 (test-user)'
                ])->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $fullAddress,
                    'format' => 'json',
                    'limit' => 1,
                ]);
                if ($response->successful() && !empty($response->json())) {
                    $data = $response->json()[0];
                    $latitude = $data['lat'];
                    $longitude = $data['lon'];
                }
            } catch (\Exception $e) {
                \Log::error('Geocoding Error: ' . $e->getMessage());
            }
        }

        $restaurant->update([
            'name' => $request->name,
            'description' => $request->description,
            'city_id' => $request->city_id,
            'address' => $request->address,
            'nearest_station' => $request->nearest_station,
            'menu_info' => $request->menu_info,
            'max_party_size' => $request->max_party_size,
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        // 画像追加
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('restaurant_images', 'public');
                RestaurantImage::create([
                    'restaurant_id' => $restaurant->id,
                    'image_path' => $path,
                ]);
            }
        }

        // 座席タイプ: 削除して一括再作成
        $restaurant->seatTypes()->delete();
        if ($request->has('seat_types')) {
            $now = now();
            $seatRows = collect($request->seat_types)->map(function ($st) use ($restaurant, $now) {
                $type = $st['type'];
                $capacity = (int) $st['capacity'];
                $seatsPerUnit = (int) $st['seats_per_unit'];
                return [
                    'restaurant_id' => $restaurant->id,
                    'name' => RestaurantSeatType::generateName($type, $seatsPerUnit, $capacity),
                    'type' => $type,
                    'seats_per_unit' => $seatsPerUnit,
                    'capacity' => $capacity,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();
            RestaurantSeatType::insert($seatRows);
        }

        // 営業時間: 削除して一括再作成
        $restaurant->timeSettings()->delete();
        if ($request->has('time_settings')) {
            $now = now();
            $timeRows = collect($request->time_settings)->map(function ($ts) use ($restaurant, $now) {
                return [
                    'restaurant_id' => $restaurant->id,
                    'day_of_week' => (int) $ts['day_of_week'],
                    'start_time' => $ts['start_time'],
                    'end_time' => $ts['end_time'],
                    'stay_minutes' => (int) $ts['stay_minutes'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();
            RestaurantTimeSetting::insert($timeRows);
        }

        return redirect()->route('restaurants.show', $restaurant->id)->with('success_update', '店舗情報を更新しました！');
    }

    /**
     * 店舗削除
     */
    public function destroy($id)
    {
        $restaurant = Restaurant::findOrFail($id);
        if ($restaurant->user_id !== auth()->id()) {
            abort(403, '権限がありません。');
        }
        $restaurant->delete();
        return to_route('dashboard')->with('success', '店舗を削除しました。');
    }
}