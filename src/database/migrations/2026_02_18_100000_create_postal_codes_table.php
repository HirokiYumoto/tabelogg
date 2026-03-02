<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('postal_codes', function (Blueprint $table) {
            $table->id();
            $table->string('postal_code', 7)->index();
            $table->foreignId('prefecture_id')->constrained()->cascadeOnDelete();
            $table->foreignId('city_id')->constrained()->cascadeOnDelete();
            $table->string('town')->default('');
            $table->index(['prefecture_id', 'city_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('postal_codes');
    }
};
