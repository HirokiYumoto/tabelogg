<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Restaurant;
use App\Models\City;
use App\Models\User;
use App\Models\RestaurantSeatType;
use App\Models\RestaurantTimeSetting;
use App\Models\RestaurantImage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;

class OwnerRestaurantSeeder extends Seeder
{
    public function run(): void
    {
        // CitySeeder が未実行なら先に実行
        if (City::count() === 0) {
            $this->call(CitySeeder::class);
        }

        // オーナーユーザー作成
        $user = User::firstOrCreate(
            ['email' => 'test10@aidma-hd.jp'],
            [
                'name' => 'テストオーナー10',
                'password' => Hash::make('11111111'),
                'role_id' => 2,
                'email_verified_at' => now(),
            ]
        );
        // 既存ユーザーの場合もオーナーに更新
        if ($user->role_id !== 2) {
            $user->update(['role_id' => 2]);
        }

        // 画像をstorageにコピー
        $destDir = storage_path('app/public/restaurant_images');
        if (!File::isDirectory($destDir)) {
            File::makeDirectory($destDir, 0755, true);
        }
        $srcImage = $destDir . '/ramen_source.jpg';

        // 20店舗分の画像を個別ファイルとしてコピー
        for ($i = 1; $i <= 20; $i++) {
            $destPath = $destDir . "/ramen_owner_{$i}.jpg";
            if (!File::exists($destPath)) {
                File::copy($srcImage, $destPath);
            }
        }

        // 店舗データ定義（20店舗）
        $restaurants = [
            [
                'name' => '麺匠 龍虎',
                'description' => '厳選した豚骨と鶏ガラを24時間煮込んだ濃厚Wスープが看板メニュー。自家製の極太ちぢれ麺との相性は抜群です。',
                'menu_info' => "特製Wスープらーめん 980円\nチャーシュー麺 1,100円\n味玉らーめん 1,030円\n餃子（6個） 450円\nライス 150円",
                'city_name' => '新宿区',
                'address' => '西新宿7-10-19',
                'station' => '新宿駅',
                'lat' => 35.694003, 'lng' => 139.700464,
                'seat_pattern' => 'counter_table',
            ],
            [
                'name' => '博多天神ラーメン',
                'description' => '本場博多から直送の極細ストレート麺と、白濁した豚骨スープが自慢。替え玉は何杯でも100円。',
                'menu_info' => "豚骨ラーメン 850円\n替え玉 100円\n明太子ごはん 350円\nチャーシュー丼 450円",
                'city_name' => '渋谷区',
                'address' => '道玄坂2-6-17',
                'station' => '渋谷駅',
                'lat' => 35.659517, 'lng' => 139.698384,
                'seat_pattern' => 'counter_only',
            ],
            [
                'name' => '味噌蔵 北の大地',
                'description' => '北海道産の赤味噌と白味噌をブレンドした秘伝のスープ。バターコーンをトッピングすれば北海道の味わいそのもの。',
                'menu_info' => "味噌ラーメン 900円\nバターコーン味噌 1,000円\n辛味噌ラーメン 950円\nジンギスカン丼 550円",
                'city_name' => '千代田区',
                'address' => '神田神保町1-10-1',
                'station' => '神保町駅',
                'lat' => 35.695963, 'lng' => 139.757507,
                'seat_pattern' => 'counter_table',
            ],
            [
                'name' => '塩そば 潮風',
                'description' => '瀬戸内海の天然塩と利尻昆布で仕上げた透き通るスープ。あっさりながらも深い旨味が広がります。',
                'menu_info' => "塩そば 880円\n特製塩そば 1,080円\n鶏塩つけ麺 950円\nワンタン 350円",
                'city_name' => '港区',
                'address' => '赤坂3-13-7',
                'station' => '赤坂駅',
                'lat' => 35.673590, 'lng' => 139.736694,
                'seat_pattern' => 'table_only',
            ],
            [
                'name' => '横浜家系 剛田家',
                'description' => '濃厚豚骨醤油スープに太めのストレート麺。お好みで「麺の硬さ・味の濃さ・脂の量」を選べます。',
                'menu_info' => "ラーメン 800円\nチャーシューメン 1,000円\nほうれん草増し 100円\nライス無料",
                'city_name' => '横浜市',
                'address' => '西区南幸2-17-1',
                'station' => '横浜駅',
                'lat' => 35.465786, 'lng' => 139.620480,
                'seat_pattern' => 'counter_table',
            ],
            [
                'name' => 'つけ麺 無限大',
                'description' => '魚介と豚骨のダブルスープに極太自家製麺。麺量は300gまで同一価格。食べ応え抜群の一杯。',
                'menu_info' => "つけ麺 900円\n特製つけ麺 1,150円\nあつもり 900円\n味玉 100円",
                'city_name' => '豊島区',
                'address' => '南池袋1-17-1',
                'station' => '池袋駅',
                'lat' => 35.728926, 'lng' => 139.711086,
                'seat_pattern' => 'counter_only',
            ],
            [
                'name' => '鶏白湯 こっこ',
                'description' => '朝引き地鶏を丸ごと使った濃厚クリーミーな鶏白湯スープ。女性やお子様にも人気の優しい味わい。',
                'menu_info' => "鶏白湯らーめん 920円\n鶏白湯つけ麺 970円\n親子丼セット 1,200円\n鶏餃子 400円",
                'city_name' => '目黒区',
                'address' => '上目黒2-13-2',
                'station' => '中目黒駅',
                'lat' => 35.644037, 'lng' => 139.699013,
                'seat_pattern' => 'table_only',
            ],
            [
                'name' => '担々麺 紅蓮',
                'description' => '花椒と自家製ラー油が効いた本格四川式担々麺。痺れと辛さのハーモニーがやみつきに。',
                'menu_info' => "担々麺 950円\n汁なし担々麺 900円\n麻婆豆腐麺 980円\n杏仁豆腐 300円",
                'city_name' => '中央区',
                'address' => '銀座6-4-6',
                'station' => '銀座駅',
                'lat' => 35.670168, 'lng' => 139.763906,
                'seat_pattern' => 'counter_table',
            ],
            [
                'name' => '二郎系 ガッツリ亭',
                'description' => 'ニンニク・ヤサイ・アブラ・カラメ全マシ可能！ボリューム満点のガッツリ系ラーメン。',
                'menu_info' => "ラーメン 850円\n大ラーメン 950円\nぶた入り 1,050円\nつけ麺 900円",
                'city_name' => '文京区',
                'address' => '本郷3-38-1',
                'station' => '本郷三丁目駅',
                'lat' => 35.707282, 'lng' => 139.760067,
                'seat_pattern' => 'counter_only',
            ],
            [
                'name' => '煮干しラーメン 蒼海',
                'description' => '青森県産の煮干しをふんだんに使用したセメント系煮干しスープ。煮干し好きにはたまらない一杯。',
                'menu_info' => "煮干しラーメン 900円\n濃厚煮干し 950円\n煮干しつけ麺 950円\n和え玉 200円",
                'city_name' => '台東区',
                'address' => '上野6-9-9',
                'station' => '上野駅',
                'lat' => 35.710067, 'lng' => 139.775321,
                'seat_pattern' => 'counter_table',
            ],
            [
                'name' => '札幌味噌 雪華',
                'description' => '札幌直伝のこってり味噌スープにもやしとひき肉の炒め。寒い日に身体の芯から温まる一杯。',
                'menu_info' => "味噌ラーメン 880円\nバター味噌 980円\n辛味噌 930円\nチャーハン 500円",
                'city_name' => '札幌市',
                'address' => '中央区南3条西3丁目',
                'station' => 'すすきの駅',
                'lat' => 43.055868, 'lng' => 141.353048,
                'seat_pattern' => 'counter_table',
            ],
            [
                'name' => '京都醤油 花鳥風月',
                'description' => '老舗醤油蔵の天然醸造醤油を使った上品な京風ラーメン。九条ねぎをたっぷり添えて。',
                'menu_info' => "醤油ラーメン 850円\n九条ねぎラーメン 950円\nチャーシュー丼 400円\n京漬物 200円",
                'city_name' => '京都市',
                'address' => '中京区河原町通三条下ル',
                'station' => '京都河原町駅',
                'lat' => 35.008568, 'lng' => 135.769554,
                'seat_pattern' => 'table_only',
            ],
            [
                'name' => '大阪ブラック 漆黒',
                'description' => '真っ黒なスープが特徴の大阪発・黒醤油ラーメン。見た目とは裏腹にまろやかな味わい。',
                'menu_info' => "ブラックラーメン 900円\nWブラック 1,050円\nたこ焼き（6個） 400円\nビール 500円",
                'city_name' => '大阪市',
                'address' => '北区角田町9-26',
                'station' => '梅田駅',
                'lat' => 34.703844, 'lng' => 135.501312,
                'seat_pattern' => 'counter_only',
            ],
            [
                'name' => '長浜屋台 博多っ子',
                'description' => '屋台の味をそのまま再現した本場長浜ラーメン。バリカタ指定でどうぞ。紅しょうがは入れ放題。',
                'menu_info' => "長浜ラーメン 780円\nチャーシュー麺 980円\n替え玉 100円\n明太高菜ごはん 300円",
                'city_name' => '福岡市',
                'address' => '博多区中洲4-7-14',
                'station' => '中洲川端駅',
                'lat' => 33.592522, 'lng' => 130.406037,
                'seat_pattern' => 'counter_table',
            ],
            [
                'name' => '名古屋台湾 辣王',
                'description' => '名古屋名物の台湾ラーメン。ピリ辛のひき肉とニラが食欲をそそる中毒性の高い一杯。',
                'menu_info' => "台湾ラーメン 850円\nアメリカン（辛さ控えめ） 850円\nイタリアン（激辛） 900円\n台湾まぜそば 900円",
                'city_name' => '名古屋市',
                'address' => '中区栄3-5-1',
                'station' => '栄駅',
                'lat' => 35.166530, 'lng' => 136.908066,
                'seat_pattern' => 'counter_only',
            ],
            [
                'name' => '神戸牛骨 贅沢亭',
                'description' => '神戸牛の牛骨をじっくり煮出した贅沢なスープ。トッピングのローストビーフが絶品。',
                'menu_info' => "牛骨ラーメン 1,100円\nローストビーフ麺 1,350円\n牛すじ丼 500円\n神戸プリン 400円",
                'city_name' => '神戸市',
                'address' => '中央区三宮町1-10-1',
                'station' => '三ノ宮駅',
                'lat' => 34.693501, 'lng' => 135.195073,
                'seat_pattern' => 'table_only',
            ],
            [
                'name' => '油そば 暴君',
                'description' => 'スープなしの極太麺に特製ダレと背脂。豪快に混ぜれば口の中に旨味が爆発。ランチは大盛り無料。',
                'menu_info' => "油そば 800円\n特製油そば 1,000円\nチーズ油そば 950円\nから揚げ 400円",
                'city_name' => '世田谷区',
                'address' => '北沢2-14-2',
                'station' => '下北沢駅',
                'lat' => 35.661562, 'lng' => 139.667095,
                'seat_pattern' => 'counter_table',
            ],
            [
                'name' => '濃厚魚介 深海',
                'description' => '数種類の節と煮干しをブレンドした超濃厚魚介スープ。ドロドロ系好きにはたまらない。',
                'menu_info' => "濃厚魚介ラーメン 950円\nドロ系つけ麺 1,000円\n和え玉 200円\n〆ライス 100円",
                'city_name' => '杉並区',
                'address' => '高円寺北3-22-8',
                'station' => '高円寺駅',
                'lat' => 35.705563, 'lng' => 139.649786,
                'seat_pattern' => 'counter_only',
            ],
            [
                'name' => 'ベジ味噌 大地の恵',
                'description' => '地元農家直送の旬野菜をたっぷりのせた野菜味噌ラーメン。ヘルシーで満足感も抜群。',
                'menu_info' => "野菜味噌ラーメン 920円\n野菜たっぷりタンメン 900円\n豆乳担々麺 950円\n玄米おにぎり 200円",
                'city_name' => '品川区',
                'address' => '大井1-2-1',
                'station' => '大井町駅',
                'lat' => 35.606838, 'lng' => 139.734563,
                'seat_pattern' => 'table_only',
            ],
            [
                'name' => '焦がし醤油 黒帯',
                'description' => '焦がしネギ油の香ばしさが際立つ黒醤油ラーメン。一口目の香りに驚くこと間違いなし。',
                'menu_info' => "焦がし醤油ラーメン 900円\nWスープ醤油 1,000円\nチャーシュー丼 400円\n煮卵 100円",
                'city_name' => '墨田区',
                'address' => '押上1-1-2',
                'station' => '押上駅',
                'lat' => 35.710279, 'lng' => 139.813065,
                'seat_pattern' => 'counter_table',
            ],
        ];

        // 座席パターン定義
        $seatPatterns = [
            'counter_only' => [
                ['type' => 'counter', 'seats_per_unit' => 1, 'capacity' => 12],
            ],
            'counter_table' => [
                ['type' => 'counter', 'seats_per_unit' => 1, 'capacity' => 8],
                ['type' => 'table', 'seats_per_unit' => 4, 'capacity' => 3],
            ],
            'table_only' => [
                ['type' => 'table', 'seats_per_unit' => 2, 'capacity' => 4],
                ['type' => 'table', 'seats_per_unit' => 4, 'capacity' => 3],
            ],
        ];

        foreach ($restaurants as $index => $data) {
            // CityIDの取得
            $city = City::where('name', 'like', "%{$data['city_name']}%")->first();
            $cityId = $city ? $city->id : 1;

            // 座席パターンから最大予約人数を計算
            $pattern = $seatPatterns[$data['seat_pattern']];
            $maxPartySize = 0;
            foreach ($pattern as $seat) {
                $maxPartySize += $seat['seats_per_unit'] * $seat['capacity'];
            }

            // 店舗作成
            $restaurant = Restaurant::create([
                'user_id' => $user->id,
                'city_id' => $cityId,
                'name' => $data['name'],
                'description' => $data['description'],
                'menu_info' => $data['menu_info'],
                'nearest_station' => $data['station'],
                'address' => $data['address'],
                'latitude' => $data['lat'],
                'longitude' => $data['lng'],
                'max_party_size' => $maxPartySize,
            ]);

            // 座席タイプ作成
            foreach ($pattern as $seat) {
                RestaurantSeatType::create([
                    'restaurant_id' => $restaurant->id,
                    'name' => RestaurantSeatType::generateName($seat['type'], $seat['seats_per_unit'], $seat['capacity']),
                    'type' => $seat['type'],
                    'seats_per_unit' => $seat['seats_per_unit'],
                    'capacity' => $seat['capacity'],
                ]);
            }

            // 営業時間作成（全曜日 00:00〜24:00、滞在60分）
            for ($day = 0; $day <= 6; $day++) {
                RestaurantTimeSetting::create([
                    'restaurant_id' => $restaurant->id,
                    'day_of_week' => $day,
                    'start_time' => '00:00',
                    'end_time' => '24:00',
                    'stay_minutes' => 60,
                ]);
            }

            // 店舗画像登録
            $imageNum = $index + 1;
            RestaurantImage::create([
                'restaurant_id' => $restaurant->id,
                'image_path' => "restaurant_images/ramen_owner_{$imageNum}.jpg",
            ]);
        }

        $this->command->info("20店舗のラーメン屋を作成しました（オーナー: {$user->email}）");
    }
}
