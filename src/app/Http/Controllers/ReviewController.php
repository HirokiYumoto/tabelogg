<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Review;
use App\Models\Restaurant;
use Illuminate\Support\Facades\Auth;
use App\Jobs\GenerateReviewSummaryJob;

class ReviewController extends Controller
{
    // レビューを保存する
public function store(Request $request, $restaurantId)
    {
        // 重複レビューチェック
        $exists = Review::where('restaurant_id', $restaurantId)
            ->where('user_id', Auth::id())
            ->exists();
        if ($exists) {
            return back()->withErrors(['comment' => 'この店舗にはすでにレビューを投稿済みです。']);
        }

        // 1. バリデーション（画像チェックを追加）
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:500',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048', // 1枚あたり2MBまで
        ]);

        // 2. レビュー本体を保存
        $review = Review::create([
            'restaurant_id' => $restaurantId,
            'user_id' => Auth::id(),
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        // 3. 画像があれば保存（複数枚対応）
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                // storage/app/public/reviews フォルダに保存
                $path = $image->store('reviews', 'public');
                
                // データベースにパスを保存
                $review->images()->create([
                    'image_path' => $path,
                ]);
            }
        }

        // レビュー要約を非同期で再生成
        $restaurant = Restaurant::find($restaurantId);
        GenerateReviewSummaryJob::dispatch($restaurant);

        return back();
    }
    // ... storeメソッドなどの続き ...

    /**
     * レビュー削除処理
     */
    public function destroy(Review $review)
    {
        // セキュリティチェック：自分のレビューでなければエラーにする
        if ($review->user_id !== Auth::id()) {
            abort(403, '権限がありません。');
        }

        // 削除実行
        $restaurant = $review->restaurant;
        $review->delete();

        // レビュー要約を非同期で再生成
        GenerateReviewSummaryJob::dispatch($restaurant);

        return back()->with('success', 'レビューを削除しました。');
    }


}