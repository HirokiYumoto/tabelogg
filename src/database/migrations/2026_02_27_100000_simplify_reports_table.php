<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. target_user_id カラムを追加
        Schema::table('reports', function (Blueprint $table) {
            $table->foreignId('target_user_id')
                ->nullable()
                ->after('reporter_id')
                ->constrained('users')
                ->cascadeOnDelete();
        });

        // 2. 既存データを移行（target_type='user' のみ target_id を target_user_id へ）
        DB::table('reports')
            ->where('target_type', 'user')
            ->update(['target_user_id' => DB::raw('target_id')]);

        // 3. target_type='user' 以外の通報は削除（チャットメッセージ通報は不要になるため）
        DB::table('reports')
            ->where('target_type', '!=', 'user')
            ->delete();

        // 4. 旧カラム・インデックスを削除
        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex(['target_type', 'target_id']);
            $table->dropColumn(['target_type', 'target_id']);
        });

        // 5. target_user_id を NOT NULL に変更
        Schema::table('reports', function (Blueprint $table) {
            $table->foreignId('target_user_id')->nullable(false)->change();
        });

        // 6. report_images テーブルを削除
        Schema::dropIfExists('report_images');
    }

    public function down(): void
    {
        // report_images テーブルを復元
        Schema::create('report_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->timestamp('created_at')->nullable();
        });

        // target_type, target_id カラムを復元
        Schema::table('reports', function (Blueprint $table) {
            $table->string('target_type', 50)->default('user')->after('reporter_id');
            $table->unsignedBigInteger('target_id')->default(0)->after('target_type');
        });

        // データを戻す
        DB::table('reports')->update([
            'target_type' => 'user',
            'target_id' => DB::raw('target_user_id'),
        ]);

        Schema::table('reports', function (Blueprint $table) {
            $table->index(['target_type', 'target_id']);
            $table->dropForeign(['target_user_id']);
            $table->dropColumn('target_user_id');
        });
    }
};
