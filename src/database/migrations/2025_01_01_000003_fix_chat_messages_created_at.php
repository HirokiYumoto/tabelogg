<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // useCurrent() (MySQL CURRENT_TIMESTAMP = JST) で記録された値を UTC に補正
        DB::statement('UPDATE chat_messages SET created_at = DATE_SUB(created_at, INTERVAL 9 HOUR) WHERE created_at IS NOT NULL');

        // DEFAULT CURRENT_TIMESTAMP を削除
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->timestamp('created_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->timestamp('created_at')->useCurrent()->change();
        });
    }
};
