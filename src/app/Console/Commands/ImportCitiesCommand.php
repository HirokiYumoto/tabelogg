<?php

namespace App\Console\Commands;

use App\Models\City;
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

        // Extract unique prefecture + city pairs
        $uniqueCities = [];
        $lines = explode("\n", $csvContent);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;
            $cols = str_getcsv($line);
            if (count($cols) < 8) continue;
            $prefName = $cols[6];
            $cityName = $cols[7];
            $key = $prefName . '|' . $cityName;
            if (!isset($uniqueCities[$key])) {
                $uniqueCities[$key] = [
                    'prefecture' => $prefName,
                    'city' => $cityName,
                ];
            }
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

            $city = City::firstOrCreate(
                ['prefecture_id' => $pref->id, 'name' => $data['city']]
            );

            if ($city->wasRecentlyCreated) {
                $created++;
            } else {
                $existed++;
            }
        }

        $this->info("Done! Created: {$created}, Already existed: {$existed}");

        return 0;
    }
}
