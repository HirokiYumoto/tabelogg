<?php

namespace App\Http\Middleware;

use App\Enums\RoleEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class OwnerMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check() || Auth::user()->role_id !== RoleEnum::Owner) {
            if ($request->expectsJson()) {
                return response()->json(['message' => '店舗代表者の権限がありません。'], 403);
            }
            abort(403, '店舗代表者の権限がありません。');
        }

        return $next($request);
    }
}