<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    /**
     * 通報送信
     */
    public function store(Request $request)
    {
        $request->validate([
            'target_user_id' => 'required|integer|exists:users,id',
            'reason' => 'required|string|max:2000',
        ]);

        $exists = Report::where('reporter_id', Auth::id())
            ->where('target_user_id', $request->input('target_user_id'))
            ->exists();

        if ($exists) {
            abort(409, 'すでに通報済みです。');
        }

        Report::create([
            'reporter_id' => Auth::id(),
            'target_user_id' => $request->input('target_user_id'),
            'reason' => $request->input('reason'),
        ]);

        return response()->json(['message' => '通報を受け付けました。'], 201);
    }

    /**
     * 通報ステータス取得
     */
    public function status(int $userId)
    {
        $reported = Report::where('reporter_id', Auth::id())
            ->where('target_user_id', $userId)
            ->exists();

        return response()->json(['reported' => $reported]);
    }
}
