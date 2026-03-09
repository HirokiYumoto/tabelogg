<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * セキュリティ改善: 連鎖削除を防止
 *
 * 都道府県を削除 → 市区町村 → 全店舗が連鎖削除される問題を修正。
 * restrictOnDelete に変更することで、子レコードが存在する場合は
 * 親レコードの削除を拒否するようになる。
 */
return new class extends Migration
{
    public function up(): void
    {
        // cities テーブル: prefecture_id の外部キーを restrictOnDelete に変更
        Schema::table('cities', function (Blueprint $table) {
            $table->dropForeign(['prefecture_id']);
            $table->foreignId('prefecture_id')->change();
            $table->foreign('prefecture_id')
                  ->references('id')
                  ->on('prefectures')
                  ->restrictOnDelete();
        });

        // restaurants テーブル: city_id の外部キーを restrictOnDelete に変更
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->foreignId('city_id')->change();
            $table->foreign('city_id')
                  ->references('id')
                  ->on('cities')
                  ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        // 元に戻す: cascadeOnDelete に復元
        Schema::table('cities', function (Blueprint $table) {
            $table->dropForeign(['prefecture_id']);
            $table->foreignId('prefecture_id')->change();
            $table->foreign('prefecture_id')
                  ->references('id')
                  ->on('prefectures')
                  ->cascadeOnDelete();
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->foreignId('city_id')->change();
            $table->foreign('city_id')
                  ->references('id')
                  ->on('cities')
                  ->cascadeOnDelete();
        });
    }
};
