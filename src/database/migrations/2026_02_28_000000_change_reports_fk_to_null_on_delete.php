<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            // reporter_id: 既存FK削除 → nullable + nullOnDelete で再作成
            $table->dropForeign(['reporter_id']);
            $table->unsignedBigInteger('reporter_id')->nullable()->change();
            $table->foreign('reporter_id')
                ->references('id')->on('users')
                ->nullOnDelete();

            // target_user_id: 既存FK削除 → nullable + nullOnDelete で再作成
            $table->dropForeign(['target_user_id']);
            $table->unsignedBigInteger('target_user_id')->nullable()->change();
            $table->foreign('target_user_id')
                ->references('id')->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            // nullOnDelete FK を削除 → cascadeOnDelete で再作成
            $table->dropForeign(['reporter_id']);
            $table->unsignedBigInteger('reporter_id')->nullable(false)->change();
            $table->foreign('reporter_id')
                ->references('id')->on('users')
                ->cascadeOnDelete();

            $table->dropForeign(['target_user_id']);
            $table->unsignedBigInteger('target_user_id')->nullable(false)->change();
            $table->foreign('target_user_id')
                ->references('id')->on('users')
                ->cascadeOnDelete();
        });
    }
};
