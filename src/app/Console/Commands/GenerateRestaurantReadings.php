<?php

namespace App\Console\Commands;

use App\Models\Restaurant;
use App\Services\MeCabService;
use Illuminate\Console\Command;

class GenerateRestaurantReadings extends Command
{
    protected $signature = 'restaurants:generate-readings
                            {--force : 既に読みがあるレストランも再生成する}';

    protected $description = 'MeCab + UniDic でレストランのひらがな読みを一括生成する';

    public function handle(MeCabService $mecab): int
    {
        $query = Restaurant::query();

        if (!$this->option('force')) {
            $query->whereNull('name_reading');
        }

        $total = $query->count();

        if ($total === 0) {
            $this->info('対象のレストランがありません。');
            return self::SUCCESS;
        }

        $this->info("{$total} 件のレストランの読みを生成します...");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $errors = 0;

        $query->chunkById(1000, function ($restaurants) use ($mecab, $bar, &$errors) {
            foreach ($restaurants as $restaurant) {
                try {
                    $restaurant->timestamps = false;
                    $restaurant->update([
                        'name_reading' => $restaurant->name ? $mecab->normalize($restaurant->name) : null,
                        'description_reading' => $restaurant->description ? $mecab->normalize($restaurant->description) : null,
                        'menu_info_reading' => $restaurant->menu_info ? $mecab->normalize($restaurant->menu_info) : null,
                        'nearest_station_reading' => $restaurant->nearest_station ? $mecab->normalize($restaurant->nearest_station) : null,
                    ]);
                } catch (\Exception $e) {
                    $errors++;
                    $this->newLine();
                    $this->error("ID {$restaurant->id}: {$e->getMessage()}");
                }

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        if ($errors > 0) {
            $this->warn("{$errors} 件のエラーが発生しました。");
        }

        $this->info('読み生成が完了しました。');

        return $errors > 0 ? self::FAILURE : self::SUCCESS;
    }
}
