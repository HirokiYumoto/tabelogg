<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\Restaurant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class RegeocodeRestaurants extends Command
{
    protected $signature = 'restaurants:regeocode
                            {--restaurant= : 特定の店舗IDのみ再ジオコーディング}';

    protected $description = '全店舗の座標を再ジオコーディングする（市区町村フォールバック付き）';

    public function handle(): int
    {
        $query = Restaurant::with('city.prefecture');

        if ($id = $this->option('restaurant')) {
            $query->where('id', $id);
        }

        $restaurants = $query->get();

        if ($restaurants->isEmpty()) {
            $this->info('対象の店舗がありません。');
            return self::SUCCESS;
        }

        $this->info("{$restaurants->count()} 件の店舗を再ジオコーディングします...");
        $bar = $this->output->createProgressBar($restaurants->count());
        $bar->start();

        $updated = 0;
        $fallback = 0;
        $failed = 0;

        foreach ($restaurants as $restaurant) {
            $city = $restaurant->city;
            if (!$city || !$city->prefecture) {
                $failed++;
                $bar->advance();
                continue;
            }

            $prefectureName = $city->prefecture->name;
            $cityName = $city->name;
            $cityAddress = $prefectureName . $cityName;

            try {
                // Get city-level baseline
                $cityResult = $this->nominatimSearch($cityAddress);

                // Try full address
                $fullAddress = $prefectureName . $cityName . $restaurant->address;
                $fullResult = $this->nominatimSearch($fullAddress);

                $lat = null;
                $lng = null;
                $usedFallback = false;

                if ($fullResult && $cityResult) {
                    $distance = $this->haversineDistance(
                        (float) $fullResult['lat'], (float) $fullResult['lon'],
                        (float) $cityResult['lat'], (float) $cityResult['lon']
                    );

                    if ($distance <= 50) {
                        $lat = $fullResult['lat'];
                        $lng = $fullResult['lon'];
                    } else {
                        $lat = $cityResult['lat'];
                        $lng = $cityResult['lon'];
                        $usedFallback = true;
                    }
                } elseif ($fullResult) {
                    $lat = $fullResult['lat'];
                    $lng = $fullResult['lon'];
                } elseif ($cityResult) {
                    $lat = $cityResult['lat'];
                    $lng = $cityResult['lon'];
                    $usedFallback = true;
                }

                if ($lat !== null) {
                    $restaurant->update(['latitude' => $lat, 'longitude' => $lng]);
                    $updated++;
                    if ($usedFallback) {
                        $fallback++;
                    }
                } else {
                    $failed++;
                }

                // Nominatim rate limit: 1 request/second
                usleep(1100000);
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("Error for restaurant {$restaurant->id}: {$e->getMessage()}");
                $failed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("完了: 更新 {$updated} 件（うちフォールバック {$fallback} 件）/ 失敗 {$failed} 件");

        return self::SUCCESS;
    }

    private function nominatimSearch(string $query): ?array
    {
        $response = Http::withHeaders([
            'User-Agent' => 'LaravelApp/1.0 (test-user)',
        ])->get('https://nominatim.openstreetmap.org/search', [
            'q' => $query,
            'format' => 'json',
            'limit' => 1,
        ]);

        if ($response->successful() && !empty($response->json())) {
            return $response->json()[0];
        }

        return null;
    }

    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
