<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\ReportImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    /**
     * 通報送信
     */
    public function store(Request $request)
    {
        $request->validate([
            'target_type' => 'required|string|in:user,chat_message',
            'target_id' => 'required|integer',
            'reason' => 'required|string|max:2000',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|max:5120', // 5MB per image
        ]);

        $report = Report::create([
            'reporter_id' => Auth::id(),
            'target_type' => $request->input('target_type'),
            'target_id' => $request->input('target_id'),
            'reason' => $request->input('reason'),
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('report_images', 'public');

                ReportImage::create([
                    'report_id' => $report->id,
                    'image_path' => $path,
                ]);
            }
        }

        return response()->json(['message' => '通報を受け付けました。'], 201);
    }
}
