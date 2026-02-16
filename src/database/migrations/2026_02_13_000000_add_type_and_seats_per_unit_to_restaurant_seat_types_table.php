<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_seat_types', function (Blueprint $table) {
            $table->string('type')->default('counter')->after('name');
            $table->integer('seats_per_unit')->default(1)->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_seat_types', function (Blueprint $table) {
            $table->dropColumn(['type', 'seats_per_unit']);
        });
    }
};
