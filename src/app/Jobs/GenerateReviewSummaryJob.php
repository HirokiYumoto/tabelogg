<?php

namespace App\Jobs;

use App\Models\Restaurant;
use App\Services\ReviewSummaryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateReviewSummaryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 180;

    public function __construct(
        public Restaurant $restaurant
    ) {}

    public function handle(ReviewSummaryService $summaryService): void
    {
        $summary = $summaryService->generate($this->restaurant);
        $this->restaurant->forceFill(['review_summary' => $summary])->save();

        Log::info('Review summary generated', [
            'restaurant_id' => $this->restaurant->id,
            'has_summary' => $summary !== null,
        ]);
    }
}
