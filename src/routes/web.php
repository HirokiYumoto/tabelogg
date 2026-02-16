<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\OwnerController;

/*
|--------------------------------------------------------------------------
| 一般公開ルート (一覧など)
|--------------------------------------------------------------------------
*/
Route::get('/', [RestaurantController::class, 'index'])->name('home');
Route::get('/restaurants', [RestaurantController::class, 'index'])->name('restaurants.index');

/*
|--------------------------------------------------------------------------
| 認証済みユーザー用ルート
|--------------------------------------------------------------------------
*/
Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/restaurants/{id}/reviews', [ReviewController::class, 'store'])->name('reviews.store');
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy'])->name('reviews.destroy');
    Route::post('/restaurants/{id}/favorites', [FavoriteController::class, 'store'])->name('favorites.store');
    Route::delete('/restaurants/{id}/favorites', [FavoriteController::class, 'destroy'])->name('favorites.destroy');

    // 予約関連ルート
    Route::get('/reservations', [ReservationController::class, 'index'])->name('reservations.index');
    Route::get('/restaurants/{restaurant}/reservations/create', [ReservationController::class, 'create'])->name('reservations.create');
    Route::post('/restaurants/{restaurant}/reservations', [ReservationController::class, 'store'])->name('reservations.store');
    Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy'])->name('reservations.destroy');

    // 予約空き状況API
    Route::get('/restaurants/{restaurant}/reservations/available-dates', [ReservationController::class, 'availableDates'])->name('reservations.available-dates');
    Route::get('/restaurants/{restaurant}/reservations/available-times', [ReservationController::class, 'availableTimes'])->name('reservations.available-times');
    Route::get('/restaurants/{restaurant}/reservations/available-seats', [ReservationController::class, 'availableSeats'])->name('reservations.available-seats');
});

/*
|--------------------------------------------------------------------------
| 店舗オーナー専用ルート (create は {id} より前に書く！)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'owner'])->group(function () {
    Route::get('/restaurants/create', [RestaurantController::class, 'create'])->name('restaurants.create');
    Route::post('/restaurants', [RestaurantController::class, 'store'])->name('restaurants.store');
    Route::delete('/restaurants/{id}', [RestaurantController::class, 'destroy'])->name('restaurants.destroy');
    Route::get('/restaurants/{id}/edit', [RestaurantController::class, 'edit'])->name('restaurants.edit');
    Route::put('/restaurants/{id}', [RestaurantController::class, 'update'])->name('restaurants.update');
    Route::get('/owner/restaurants/{restaurant}/dashboard', [OwnerController::class, 'dashboard'])->name('owner.dashboard');
});

/*
|--------------------------------------------------------------------------
| 管理者専用ルート
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('admin.dashboard');
    Route::delete('/users/{id}', [AdminController::class, 'destroyUser'])->name('admin.users.destroy');
    Route::delete('/restaurants/{id}', [AdminController::class, 'destroyRestaurant'])->name('admin.restaurants.destroy');
    Route::delete('/reviews/{id}', [AdminController::class, 'destroyReview'])->name('admin.reviews.destroy');
});

// ここを一番下に持ってくることで、上の create などに当てはまらなかった場合のみ、ここに来るようになります。
Route::get('/restaurants/{id}', [RestaurantController::class, 'show'])->name('restaurants.show');


require __DIR__.'/auth.php';
