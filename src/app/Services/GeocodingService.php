<?php

namespace App\Services;

use App\Models\City;
use Illuminate\Support\Facades\Http;

class GeocodingService
{
    /**
     * Geocode an address with city-level fallback.
     * Tries full address first; if Nominatim returns no result, retries with just prefecture + city.
     *
     * @return array{0: string|null, 1: string|null}
     */
    public function geocode(City $city, string $address): array
    {
        $prefectureName = $city->prefecture->name;
        $cityName = $city->name;

        try {
            $cityAddress = $prefectureName . $cityName;
            $cityResult = $this->nominatimSearch($cityAddress);

            $fullAddress = $prefectureName . $cityName . $address;
            $fullResult = $this->nominatimSearch($fullAddress);

            if ($fullResult && $cityResult) {
                $distance = $this->haversineDistance(
                    (float) $fullResult['lat'], (float) $fullResult['lon'],
                    (float) $cityResult['lat'], (float) $cityResult['lon']
                );

                if ($distance <= 50) {
                    return [$fullResult['lat'], $fullResult['lon']];
                }

                \Log::info("Geocoding: full address result too far ({$distance}km), using city fallback for: {$fullAddress}");
                return [$cityResult['lat'], $cityResult['lon']];
            }

            if ($fullResult) {
                return [$fullResult['lat'], $fullResult['lon']];
            }

            if ($cityResult) {
                \Log::info("Geocoding fallback used for: {$fullAddress} → {$cityAddress}");
                return [$cityResult['lat'], $cityResult['lon']];
            }
        } catch (\Exception $e) {
            \Log::error('Geocoding Error: ' . $e->getMessage());
        }

        return [null, null];
    }

    /**
     * Calculate distance between two coordinates in km (Haversine formula).
     */
    public function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /**
     * Search Nominatim for a given query string.
     *
     * @return array{lat: string, lon: string}|null
     */
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
}
