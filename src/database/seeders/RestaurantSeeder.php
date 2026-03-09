<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Restaurant;
use App\Models\City;
use App\Models\User;
use App\Models\RestaurantSeatType; // ★追加
use App\Models\RestaurantTimeSetting; // ★追加
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;

class RestaurantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 本番環境では脆弱なテストデータの作成を禁止
        if (\Illuminate\Support\Facades\App::isProduction()) {
            $this->command?->warn('RestaurantSeeder: 本番環境ではスキップされました');
            return;
        }

        Schema::disableForeignKeyConstraints();
        // 親テーブルを消す前に子テーブルもクリーンにする（外部キー制約回避のため）
        RestaurantTimeSetting::truncate();
        RestaurantSeatType::truncate();
        Restaurant::truncate();
        Schema::enableForeignKeyConstraints();

        if (City::count() === 0) {
            $this->call(CitySeeder::class);
        }

        // 管理者ユーザーを作成
        $user = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => '管理者太郎',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // サンプル店舗データ
        $restaurants = [
            [
                'name' => '麺屋 太郎',
                'description' => '濃厚な豚骨スープと自家製麺が自慢の一杯。ランチタイムは行列必至です。',
                'genre' => '豚骨', 
            ],
            [
                'name' => '中華そば 青葉',
                'description' => '昔ながらの醤油ラーメン。鶏ガラベースの透き通ったスープに心が安らぎます。',
                'genre' => '醤油',
            ],
            [
                'name' => '味噌乃家',
                'description' => '北海道産の味噌をふんだんに使用した、コクのある味噌ラーメン専門店。',
                'genre' => '味噌',
            ],
            [
                'name' => '海鮮ラーメン 潮騒',
                'description' => '新鮮な魚介をたっぷりトッピング。スープまで飲み干せる塩ラーメンです。',
                'genre' => '塩',
            ],
            [
                'name' => '激辛タンメン ファイヤー',
                'description' => '辛いもの好きにはたまらない！特製ラー油と唐辛子が効いた刺激的な一杯。',
                'genre' => '激辛',
            ],
            [
                'name' => 'つけ麺 大王',
                'description' => '極太麺を濃厚な魚介豚骨スープにくぐらせて。並盛・中盛・大盛が同料金！',
                'genre' => 'つけ麺',
            ],
            [
                'name' => '鶏白湯 ほっこり',
                'description' => '鶏の旨味を凝縮したクリーミーなスープ。女性にも大人気のヘルシーラーメン。',
                'genre' => '鶏白湯',
            ],
            [
                'name' => '油そば ぶぶか',
                'description' => 'スープのないラーメン「油そば」。特製タレと麺を豪快に混ぜてお召し上がりください。',
                'genre' => '油そば',
            ],
        ];

        foreach ($restaurants as $data) {
            $city = City::inRandomOrder()->first();

            // 1. 店舗を作成
            $restaurant = Restaurant::create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'city_id' => $city->id,
                'address_detail' => '駅前 1-2-3',
                'description' => $data['description'],
                'open_time' => '11:00',
                'close_time' => '22:00',
                'capacity' => 22, // ★追加: 総定員（カウンター10 + テーブル3卓(12) = 22名想定）
            ]);

            // 2. 席タイプを作成（★追加部分）
            // カウンター席: 10席
            RestaurantSeatType::create([
                'restaurant_id' => $restaurant->id,
                'name' => 'カウンター',
                'capacity' => 10,
            ]);

            // テーブル席: 3卓
            RestaurantSeatType::create([
                'restaurant_id' => $restaurant->id,
                'name' => 'テーブル（4名席）',
                'capacity' => 3,
            ]);

            // 3. 時間設定を作成（★追加部分）
            // 全曜日（0=日曜 〜 6=土曜）に対して同じ設定を入れる
            for ($day = 0; $day <= 6; $day++) {
                // ランチ: 11:00〜15:00 (滞在60分)
                RestaurantTimeSetting::create([
                    'restaurant_id' => $restaurant->id,
                    'day_of_week' => $day,
                    'start_time' => '11:00',
                    'end_time' => '15:00',
                    'stay_minutes' => 60,
                ]);

                // ディナー: 17:00〜22:00 (滞在90分)
                RestaurantTimeSetting::create([
                    'restaurant_id' => $restaurant->id,
                    'day_of_week' => $day,
                    'start_time' => '17:00',
                    'end_time' => '22:00',
                    'stay_minutes' => 90,
                ]);
            }
        }
    }
}