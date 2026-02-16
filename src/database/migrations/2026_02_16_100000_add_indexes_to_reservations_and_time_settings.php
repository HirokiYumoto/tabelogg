<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->index(
                ['restaurant_id', 'restaurant_seat_type_id', 'reserved_at', 'end_at'],
                'reservations_overlap_check_index'
            );
        });

        Schema::table('restaurant_time_settings', function (Blueprint $table) {
            $table->index(
                ['restaurant_id', 'day_of_week'],
                'time_settings_lookup_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex('reservations_overlap_check_index');
        });

        Schema::table('restaurant_time_settings', function (Blueprint $table) {
            $table->dropIndex('time_settings_lookup_index');
        });
    }
};
