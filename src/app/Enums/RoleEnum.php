<?php

namespace App\Enums;

/**
 * ユーザーロール定義
 *
 * DB上の role_id カラムに対応する列挙型。
 * マジックナンバー（1, 2, 3）を排除し、型安全に判定できる。
 */
enum RoleEnum: int
{
    case User = 1;      // 一般ユーザー
    case Owner = 2;     // 店舗オーナー
    case Admin = 3;     // 管理者

    public function label(): string
    {
        return match ($this) {
            self::User => '一般ユーザー',
            self::Owner => '店舗オーナー',
            self::Admin => '管理者',
        };
    }
}
