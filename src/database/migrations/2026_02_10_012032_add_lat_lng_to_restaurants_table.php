<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * このマイグレーションは 2026_02_03_052901_add_coordinates_to_restaurants_table.php と
 * 重複していたため、無効化されています。
 * latitude/longitude は add_coordinates マイグレーションで追加済みです。
 */
return new class extends Migration
{
    public function up(): void
    {
        // 重複マイグレーション — add_coordinates_to_restaurants_table で対応済み
    }

    public function down(): void
    {
        // no-op
    }
};
