<x-guest-layout>
    <form method="POST" action="{{ route('register') }}">
        @csrf

        <div>
            <x-input-label for="name" :value="'お名前'" />
            <x-text-input id="name" class="block mt-1 w-full" type="text" name="name" :value="old('name')" required autofocus autocomplete="name" />
            <x-input-error :messages="$errors->get('name')" class="mt-2" />
        </div>

        <div class="mt-4">
            <x-input-label for="email" :value="'メールアドレス'" />
            <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autocomplete="username" />
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>

        <div class="mt-4">
            <x-input-label for="password" :value="'パスワード'" />

            <x-text-input id="password" class="block mt-1 w-full"
                            type="password"
                            name="password"
                            required autocomplete="new-password" />

            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>

        <div class="mt-4">
            <x-input-label for="password_confirmation" :value="'パスワード（確認）'" />

            <x-text-input id="password_confirmation" class="block mt-1 w-full"
                            type="password"
                            name="password_confirmation"
                            required autocomplete="new-password" />

            <x-input-error :messages="$errors->get('password_confirmation')" class="mt-2" />
        </div>

        <div class="mt-4">
            <span class="block font-medium text-sm text-gray-700">アカウント種別</span>
            <div class="mt-2 flex gap-6">
                {{-- 一般ユーザー --}}
                <label class="flex items-center cursor-pointer">
                    <input type="radio" name="role_id" value="1" class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500" checked>
                    <span class="ml-2 text-gray-700">一般ユーザー</span>
                </label>
                
                {{-- 店舗代表者 --}}
                <label class="flex items-center cursor-pointer">
                    <input type="radio" name="role_id" value="2" class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500">
                    <span class="ml-2 text-gray-700">店舗代表者</span>
                </label>
            </div>
        </div>

        <div class="flex items-center justify-end mt-4">
            <a class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500" href="{{ route('login') }}">
                既に登録済みの方はこちら
            </a>

            <x-primary-button class="ms-4">
                登録
            </x-primary-button>
        </div>
    </form>
</x-guest-layout>