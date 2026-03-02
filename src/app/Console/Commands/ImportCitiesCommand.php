<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\PostalCode;
use App\Models\Prefecture;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class ImportCitiesCommand extends Command
{
    protected $signature = 'cities:import';
    protected $description = 'Import all Japanese cities from Japan Post KEN_ALL data (same source as postal code API)';

    public function handle(): int
    {
        $this->info('Downloading KEN_ALL.zip from Japan Post...');

        $zipUrl = 'https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip';

        $response = Http::timeout(120)->get($zipUrl);
        if (!$response->successful()) {
            $this->error('Failed to download KEN_ALL.zip');
            return 1;
        }

        $tempZip = tempnam(sys_get_temp_dir(), 'ken_all') . '.zip';
        file_put_contents($tempZip, $response->body());

        $zip = new \ZipArchive();
        if ($zip->open($tempZip) !== true) {
            $this->error('Failed to open ZIP file');
            unlink($tempZip);
            return 1;
        }

        $csvContent = $zip->getFromName('KEN_ALL.CSV');
        $zip->close();
        unlink($tempZip);

        if (!$csvContent) {
            $this->error('KEN_ALL.CSV not found in ZIP');
            return 1;
        }

        $this->info('Parsing CSV...');

        // Convert Shift-JIS to UTF-8
        $csvContent = mb_convert_encoding($csvContent, 'UTF-8', 'SJIS-win');

        // Extract unique prefecture + city pairs and all postal code entries
        $uniqueCities = [];
        $postalEntries = [];
        $lines = explode("\n", $csvContent);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;
            $cols = str_getcsv($line);
            if (count($cols) < 9) continue;
            $prefName = $cols[6];
            $cityName = $cols[7];
            // cols[4] = 半角カタカナの市区町村読み
            $cityReading = isset($cols[4]) ? mb_convert_kana(mb_convert_kana($cols[4], 'KV'), 'Hc') : '';
            $key = $prefName . '|' . $cityName;
            if (!isset($uniqueCities[$key])) {
                $uniqueCities[$key] = [
                    'prefecture' => $prefName,
                    'city' => $cityName,
                    'reading' => $cityReading,
                ];
            }

            // Collect postal code entries for reverse lookup
            $postalCode = $cols[2];
            $town = $cols[8];
            if ($town === '以下に掲載がない場合') {
                $town = '';
            } else {
                $town = preg_replace('/（.*/', '', $town);
            }
            $postalEntries[] = [
                'postal_code' => $postalCode,
                'prefecture' => $prefName,
                'city' => $cityName,
                'town' => $town,
            ];
        }

        $this->info(count($uniqueCities) . ' unique cities found.');

        // Load prefectures keyed by name
        $prefectures = Prefecture::all()->keyBy('name');

        $created = 0;
        $existed = 0;

        foreach ($uniqueCities as $data) {
            $pref = $prefectures->get($data['prefecture']);
            if (!$pref) {
                $this->warn("Prefecture not found: {$data['prefecture']}");
                continue;
            }

            $city = City::updateOrCreate(
                ['prefecture_id' => $pref->id, 'name' => $data['city']],
                ['reading' => $data['reading']]
            );

            if ($city->wasRecentlyCreated) {
                $created++;
            } else {
                $existed++;
            }
        }

        $this->info("Cities — Created: {$created}, Already existed: {$existed}");

        // Import postal codes for reverse lookup
        $this->info('Importing postal codes...');
        PostalCode::truncate();

        $cityMap = City::with('prefecture')->get()->keyBy(function ($city) {
            return $city->prefecture->name . '|' . $city->name;
        });

        $inserted = 0;
        foreach (array_chunk($postalEntries, 1000) as $chunk) {
            $rows = [];
            foreach ($chunk as $entry) {
                $key = $entry['prefecture'] . '|' . $entry['city'];
                $city = $cityMap->get($key);
                if (!$city) continue;
                $rows[] = [
                    'postal_code' => $entry['postal_code'],
                    'prefecture_id' => $city->prefecture_id,
                    'city_id' => $city->id,
                    'town' => $entry['town'],
                ];
            }
            if ($rows) {
                PostalCode::insert($rows);
                $inserted += count($rows);
            }
        }

        $this->info("Postal codes — Inserted: {$inserted}");

        return 0;
    }
}
