<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
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
    }
}