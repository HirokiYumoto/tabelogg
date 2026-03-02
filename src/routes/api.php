<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RestaurantController;
use App\Http\Controllers\Api\PrefectureController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RestaurantManageController;
use App\Http\Controllers\Api\OwnerController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CityController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\BlockController;
use App\Http\Controllers\Api\ReportController;

/*
|--------------------------------------------------------------------------
| Public Endpoints
|--------------------------------------------------------------------------
*/
Route::get('/restaurants', [RestaurantController::class, 'index']);
Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);
Route::get('/prefectures', [PrefectureController::class, 'index']);
Route::get('/cities', [CityController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Auth Endpoints
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

/*
|--------------------------------------------------------------------------
| Authenticated Endpoints
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Reviews
    Route::post('/restaurants/{id}/reviews', [ReviewController::class, 'store']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

    // Favorites
    Route::post('/restaurants/{id}/favorites', [FavoriteController::class, 'store']);
    Route::delete('/restaurants/{id}/favorites', [FavoriteController::class, 'destroy']);

    // Reservations
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/restaurants/{restaurant}/reservations', [ReservationController::class, 'store']);
    Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);
    Route::get('/restaurants/{restaurant}/reservations/available-dates', [ReservationController::class, 'availableDates']);
    Route::get('/restaurants/{restaurant}/reservations/available-times', [ReservationController::class, 'availableTimes']);
    Route::get('/restaurants/{restaurant}/reservations/available-seats', [ReservationController::class, 'availableSeats']);

    // Cities
    Route::post('/cities/resolve', [CityController::class, 'resolve']);
    Route::get('/postal-codes/reverse', [CityController::class, 'reversePostalCode']);

    // Dashboard (マイページ)
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/user/reviews', [DashboardController::class, 'userReviews']);
    Route::get('/user/restaurants', [DashboardController::class, 'ownedRestaurants']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);

    // Chat
    Route::get('/chat/unread-count', [ChatController::class, 'unreadCount']);
    Route::get('/chat/rooms', [ChatController::class, 'rooms']);
    Route::get('/chat/rooms/{roomId}/messages', [ChatController::class, 'messages']);
    Route::post('/chat/rooms/{restaurantId}/messages', [ChatController::class, 'sendMessage']);
    Route::put('/chat/rooms/{roomId}/mark-read', [ChatController::class, 'markRead']);
    Route::post('/chat/messages/{messageId}/hide', [ChatController::class, 'hideMessage']);
    Route::post('/chat/rooms/{roomId}/hide', [ChatController::class, 'hideRoom']);

    // Block
    Route::get('/users/{userId}/block-status', [BlockController::class, 'status']);
    Route::post('/users/{userId}/block', [BlockController::class, 'store']);
    Route::delete('/users/{userId}/block', [BlockController::class, 'destroy']);

    // Report
    Route::post('/reports', [ReportController::class, 'store']);

    // Owner routes
    Route::middleware('owner')->group(function () {
        Route::post('/restaurants', [RestaurantManageController::class, 'store']);
        Route::put('/restaurants/{id}', [RestaurantManageController::class, 'update']);
        Route::delete('/restaurants/{id}', [RestaurantManageController::class, 'destroy']);
        Route::get('/owner/restaurants/{restaurant}/dashboard', [OwnerController::class, 'dashboard']);
    });

    // Admin routes
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'index']);
        Route::delete('/users/{id}', [AdminController::class, 'destroyUser']);
        Route::delete('/restaurants/{id}', [AdminController::class, 'destroyRestaurant']);
        Route::delete('/reviews/{id}', [AdminController::class, 'destroyReview']);
    });
});
