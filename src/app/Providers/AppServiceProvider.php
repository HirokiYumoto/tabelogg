<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;
use App\Models\Prefecture;
use App\Models\Restaurant;
use App\Observers\RestaurantObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Restaurant::observe(RestaurantObserver::class);

        // ヘッダーのエリアドロップダウン用：1リクエストにつき1回だけ取得
        View::composer('components.site-header', function ($view) {
            $prefectures = cache()->store('array')->remember('headerPrefectures', 60, function () {
                return Prefecture::all();
            });
            $view->with('headerPrefectures', $prefectures);
        });
    }
}