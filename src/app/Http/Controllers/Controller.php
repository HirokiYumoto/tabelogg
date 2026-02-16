<?php

namespace App\Http\Controllers;

abstract class Controller
{
    public function __construct()
    {
        if (app()->environment('local')) {
            \Illuminate\Support\Facades\DB::listen(function (\Illuminate\Database\Events\QueryExecuted $query) {
                $bindings = collect($query->bindings)->map(function ($b) {
                    switch (true) {
                        case is_null($b): return 'NULL';
                        case is_bool($b): return $b ? 'TRUE' : 'FALSE';
                        case $b instanceof \DateTimeInterface:
                            return "'" . $b->format('Y-m-d H:i:s') . "'";
                        case is_numeric($b): return (string) $b;
                        default: return "'" . addslashes((string) $b) . "'";
                    }
                })->all();
                $sql = \Illuminate\Support\Str::replaceArray('?', $bindings, $query->sql);
                $truncated = \Illuminate\Support\Str::limit($sql, 200, ' …');
                \Illuminate\Support\Facades\Log::info("Query: {$truncated} ({$query->time} ms)");
            });
        }
    }
}
