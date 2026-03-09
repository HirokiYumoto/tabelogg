<?php

namespace App\Http\Middleware;

use App\Enums\RoleEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check() || Auth::user()->role_id !== RoleEnum::Admin) {
            if ($request->expectsJson()) {
                return response()->json(['message' => '管理者権限がありません。'], 403);
            }
            abort(403, '管理者権限がありません。');
        }

        return $next($request);
    }
}
