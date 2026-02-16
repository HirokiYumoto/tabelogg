<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Restaurant;
use App\Models\Review;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    /**
     * 管理者ダッシュボード表示
     */
    public function index()
    {
        $users = User::latest()->paginate(30, ['*'], 'users_page');
        $restaurants = Restaurant::with('user')->latest()->paginate(30, ['*'], 'restaurants_page');
        $reviews = Review::with(['user', 'restaurant'])->latest()->paginate(30, ['*'], 'reviews_page');

        return view('admin.dashboard', compact('users', 'restaurants', 'reviews'));
    }

    /**
     * ユーザー削除
     */
    public function destroyUser($id)
    {
        // 自分自身は削除できないようにする
        if ($id == Auth::id()) {
            return back()->with('error', '自分自身は削除できません。');
        }

        User::destroy($id);
        return back()->with('success', 'ユーザーを削除しました。');
    }

    /**
     * 店舗削除
     */
    public function destroyRestaurant($id)
    {
        Restaurant::destroy($id);
        return back()->with('success', '店舗を削除しました。');
    }

    /**
     * レビュー削除
     */
    public function destroyReview($id)
    {
        Review::destroy($id);
        return back()->with('success', 'レビューを削除しました。');
    }
}