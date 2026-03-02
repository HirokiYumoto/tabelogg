<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class OwnerMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check() || Auth::user()->role_id !== 2) {
            if ($request->expectsJson()) {
                return response()->json(['message' => '店舗代表者の権限がありません。'], 403);
            }
            abort(403, '店舗代表者の権限がありません。');
        }

        return $next($request);
    }
}