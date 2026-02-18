<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->text('name_reading')->nullable()->after('name');
            $table->text('description_reading')->nullable()->after('description');
            $table->text('menu_info_reading')->nullable()->after('menu_info');
            $table->text('nearest_station_reading')->nullable()->after('nearest_station');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn([
                'name_reading',
                'description_reading',
                'menu_info_reading',
                'nearest_station_reading',
            ]);
        });
    }
};
