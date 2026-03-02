<?php

use Illuminate\Support\Facades\Route;

// Laravel内部で使用される名前付きルート（パスワードリセットメール等）
Route::get('login', fn() => view('spa'))->name('login');
Route::get('reset-password/{token}', fn() => view('spa'))->name('password.reset');

// SPA catch-all route — must be last
Route::get('/{any}', fn() => view('spa'))->where('any', '.*');
