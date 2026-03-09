<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 店舗登録・更新時の共通バリデーション
 *
 * RestaurantManageController の store/update で重複していた
 * バリデーションルールを一箇所に集約。
 */
class StoreRestaurantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'city_id' => 'required|exists:cities,id',
            'postal_code' => ['required', 'string', 'regex:/^\d{7}$/'],
            'address' => 'required|string|max:255',
            'nearest_station' => 'nullable|string|max:255',
            'menu_info' => 'nullable|string',
            'max_party_size' => 'nullable|integer|min:1',
            'images.*' => 'nullable|image|max:2048',
            'seat_types' => 'nullable|array',
            'seat_types.*.type' => 'required_with:seat_types|in:counter,table',
            'seat_types.*.capacity' => 'required_with:seat_types|integer|min:1',
            'seat_types.*.seats_per_unit' => 'required_with:seat_types|integer|min:1',
            'time_settings' => 'nullable|array',
            'time_settings.*.day_of_week' => 'required|integer|between:0,7',
            'time_settings.*.start_time' => 'required|date_format:H:i',
            'time_settings.*.end_time' => ['required', 'regex:/^([01]\d|2[0-4]):[0-5]\d$/'],
            'time_settings.*.stay_minutes' => 'required|integer|in:30,60,90,120',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => '店舗名は必須です。',
            'description.required' => '説明文は必須です。',
            'city_id.required' => '市区町村を選択してください。',
            'city_id.exists' => '選択された市区町村が見つかりません。',
            'postal_code.required' => '郵便番号は必須です。',
            'postal_code.regex' => '郵便番号は7桁の数字で入力してください。',
            'address.required' => '住所は必須です。',
        ];
    }
}
