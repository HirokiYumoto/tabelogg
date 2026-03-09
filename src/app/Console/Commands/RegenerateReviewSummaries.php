<?php

namespace App\Console\Commands;

use App\Models\Restaurant;
use App\Services\ReviewSummaryService;
use Illuminate\Console\Command;

class RegenerateReviewSummaries extends Command
{
    protected $signature = 'reviews:regenerate-summaries
                            {--restaurant= : 特定の店舗IDのみ再生成}';

    protected $description = 'レビュー要約を一括再生成する（レビュー1件以上の店舗が対象）';

    public function handle(ReviewSummaryService $summaryService): int
    {
        $query = Restaurant::withCount('reviews')->having('reviews_count', '>=', 1);

        if ($id = $this->option('restaurant')) {
            $query->where('id', $id);
        }

        $restaurants = $query->get();

        if ($restaurants->isEmpty()) {
            $this->info('対象の店舗がありません。');
            return self::SUCCESS;
        }

        $this->info("{$restaurants->count()} 件の店舗の要約を再生成します...");
        $bar = $this->output->createProgressBar($restaurants->count());
        $bar->start();

        $success = 0;
        $skipped = 0;

        foreach ($restaurants as $restaurant) {
            $summary = $summaryService->generate($restaurant);
            $restaurant->forceFill(['review_summary' => $summary])->save();

            if ($summary !== null) {
                $success++;
            } else {
                $skipped++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("完了: 成功 {$success} 件 / スキップ {$skipped} 件");

        return self::SUCCESS;
    }
}
