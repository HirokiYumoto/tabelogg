<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prefectures', function (Blueprint $table) {
            $table->string('reading')->nullable()->after('name');
        });

        Schema::table('cities', function (Blueprint $table) {
            $table->string('reading')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('prefectures', function (Blueprint $table) {
            $table->dropColumn('reading');
        });

        Schema::table('cities', function (Blueprint $table) {
            $table->dropColumn('reading');
        });
    }
};
