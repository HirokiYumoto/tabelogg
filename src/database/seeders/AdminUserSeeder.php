<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\App;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // 本番環境では脆弱なテストデータの作成を禁止
        if (App::isProduction()) {
            $this->command?->warn('AdminUserSeeder: 本番環境ではスキップされました');
            return;
        }

        // 既に存在しない場合のみ作成
        if (!User::where('email', 'admin@example.com')->exists()) {
            User::create([
                'name' => 'システム管理者',
                'email' => 'admin@example.com',
                'password' => Hash::make('password123'),
                'role_id' => 3,
            ]);
        }
    }
}