<x-app-layout>
    <x-site-header />

    <main class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {{-- 戻るリンク --}}
            <div class="mb-6">
                <a href="{{ route('restaurants.index') }}" class="text-blue-600 hover:underline">← 一覧に戻る</a>
            </div>

            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                
                {{-- ========================================== --}}
                {{-- ★★★ 上部エリア（固定表示） ★★★ --}}
                {{-- ========================================== --}}
                <div class="p-6 lg:p-10 border-b border-gray-100">
                    {{-- 店名と評価エリア --}}
                    <div class="mb-4">
                        <h1 class="text-3xl font-bold text-gray-900 mb-2">
                            {{ $restaurant->name }}
                        </h1>

                        <div class="flex items-end gap-6 flex-wrap">
                            {{-- 平均満足度 --}}
                            <div class="text-3xl font-bold text-orange-500 flex items-center">
                                <span class="mr-1 text-2xl">★</span>
                                {{ number_format($restaurant->reviews_avg_rating ?? 0, 1) }}
                            </div>

                            {{-- 口コミ数とお気に入り数 --}}
                            <div class="text-base text-gray-600 flex items-center gap-6 mb-1">
                                <span class="flex items-center">
                                    <span class="mr-1">💬</span>
                                    <span class="font-bold">{{ $restaurant->reviews_count }}</span>件
                                </span>
                                <span class="flex items-center">
                                    <span class="mr-1">🔖</span>
                                    <span class="font-bold">{{ $restaurant->favorites_count }}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {{-- 住所・エリアの簡易表示 --}}
                    <div class="text-gray-500 mb-6 flex items-center gap-2 text-sm">
                        <span>📍 {{ $restaurant->city->prefecture->name }}{{ $restaurant->city->name }}</span>
                        @if($restaurant->nearest_station)
                            <span class="border-l border-gray-300 pl-2 ml-1">🚃 {{ $restaurant->nearest_station }}</span>
                        @endif
                    </div>

                    {{-- お気に入りボタン --}}
                    @auth
                        <div>
                            @if($isFavorited)
                                <form action="{{ route('favorites.destroy', $restaurant->id) }}" method="POST">
                                    @csrf @method('DELETE')
                                    <button type="submit" class="bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 px-6 py-2 rounded-full font-bold flex items-center gap-2 transition">
                                        ❤️ お気に入り解除
                                    </button>
                                </form>
                            @else
                                <form action="{{ route('favorites.store', $restaurant->id) }}" method="POST">
                                    @csrf
                                    <button type="submit" class="bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 px-6 py-2 rounded-full font-bold flex items-center gap-2 transition">
                                        🤍 お気に入り登録
                                    </button>
                                </form>
                            @endif
                        </div>
                    @endauth
                </div>


                {{-- ========================================== --}}
                {{-- ★★★ タブリスト ★★★ --}}
                {{-- ========================================== --}}
                <div class="border-b border-gray-200">
                    <ul class="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500" id="myTab" role="tablist">
                        
                        {{-- トップ --}}
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 rounded-t-lg hover:text-gray-600 hover:border-gray-300 js-tab-trigger active-tab" 
                                    id="top-tab" data-target="top" type="button" role="tab">
                                トップ
                            </button>
                        </li>
                        
                        {{-- メニュー --}}
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 js-tab-trigger" 
                                    id="menu-tab" data-target="menu" type="button" role="tab">
                                メニュー
                            </button>
                        </li>

                        {{-- レビュー --}}
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 js-tab-trigger" 
                                    id="reviews-tab" data-target="reviews" type="button" role="tab">
                                レビュー <span class="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs ml-1">{{ $restaurant->reviews_count }}</span>
                            </button>
                        </li>

                        {{-- アクセス --}}
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 js-tab-trigger"
                                    id="access-tab" data-target="access" type="button" role="tab">
                                アクセス
                            </button>
                        </li>

                        {{-- 予約 --}}
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 js-tab-trigger"
                                    id="reservation-tab" data-target="reservation" type="button" role="tab">
                                予約
                            </button>
                        </li>
                    </ul>
                </div>

                {{-- ========================================== --}}
                {{-- ★★★ タブコンテンツ ★★★ --}}
                {{-- ========================================== --}}
                <div id="myTabContent" class="p-6 lg:p-10 min-h-[400px]">
                    
                    {{-- 1. トップタブ --}}
                    <div class="js-tab-content block" id="top" role="tabpanel">
                        
                        {{-- 店舗画像 --}}
                        <div class="mb-8">
                            @if($restaurant->images->isNotEmpty())
                                @php
                                    $allImages = $restaurant->images->map(fn($img) => asset('storage/' . $img->image_path));
                                    $firstImage = $restaurant->images->first();
                                @endphp

                                <div class="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group cursor-pointer shadow-sm js-modal-trigger"
                                     data-images="{{ json_encode($allImages) }}"
                                     onclick="openModalFromElement(this)">
                                    
                                    <img src="{{ asset('storage/' . $firstImage->image_path) }}" 
                                         class="w-full h-full object-contain transition duration-300"
                                         alt="店舗画像">
                                         
                                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition"></div>
                                    <div class="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
                                        {{ $restaurant->images->count() }}枚の写真
                                    </div>
                                </div>
                            @else
                                <div class="aspect-video bg-gray-50 rounded-lg flex flex-col items-center justify-center text-gray-400 border border-gray-200 border-dashed">
                                    <span class="text-4xl mb-2">📷</span>
                                    <p>画像は登録されていません</p>
                                </div>
                            @endif
                        </div>

                        {{-- お店の紹介 --}}
                        <div>
                            <h2 class="text-xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-3">お店の紹介</h2>
                            <p class="text-gray-700 leading-loose whitespace-pre-wrap">{{ $restaurant->description }}</p>
                        </div>

                        {{-- 営業時間 --}}
                        <div class="mt-8">
                            <h2 class="text-xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-3">営業時間</h2>
                            @if($restaurant->timeSettings->isNotEmpty())
                                @php
                                    $dayNames = [0 => '日', 1 => '月', 2 => '火', 3 => '水', 4 => '木', 5 => '金', 6 => '土', 7 => '祝'];
                                    $dayOrder = [1, 2, 3, 4, 5, 6, 0, 7];
                                    $grouped = $restaurant->timeSettings->groupBy('day_of_week');
                                @endphp
                                <div class="overflow-x-auto">
                                    <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-4 py-3 text-left text-gray-600 font-bold">曜日</th>
                                                <th class="px-4 py-3 text-left text-gray-600 font-bold">営業時間</th>
                                                <th class="px-4 py-3 text-left text-gray-600 font-bold">滞在可能時間</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-100">
                                            @foreach($dayOrder as $dayNum)
                                                @if($grouped->has($dayNum))
                                                    @foreach($grouped[$dayNum] as $ts)
                                                        <tr class="hover:bg-gray-50">
                                                            <td class="px-4 py-3 font-bold text-gray-700">{{ $dayNames[$dayNum] ?? '' }}</td>
                                                            <td class="px-4 py-3 text-gray-600">{{ \Carbon\Carbon::parse($ts->start_time)->format('H:i') }} 〜 {{ substr($ts->end_time, 0, 5) }}</td>
                                                            <td class="px-4 py-3 text-gray-600">{{ $ts->stay_minutes }}分</td>
                                                        </tr>
                                                    @endforeach
                                                @endif
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            @else
                                <p class="text-gray-500 text-sm">営業時間情報は登録されていません。</p>
                            @endif
                        </div>
                    </div>


                    {{-- 2. メニュータブ --}}
                    <div class="js-tab-content hidden" id="menu" role="tabpanel">
                        <h2 class="text-xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-3">メニュー・価格情報</h2>
                        @if($restaurant->menu_info)
                            <div class="bg-orange-50 border border-orange-100 p-6 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {{ $restaurant->menu_info }}
                            </div>
                        @else
                            <p class="text-gray-500">メニュー情報はまだ登録されていません。</p>
                        @endif
                    </div>


                    {{-- 3. レビュータブ --}}
                    <div class="js-tab-content hidden" id="reviews" role="tabpanel">
                        
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {{-- 左側：投稿フォーム --}}
                            <div class="lg:col-span-1">
                                <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-4">
                                    <h3 class="font-bold mb-4 text-gray-800">レビューを書く</h3>
                                    @auth
                                        <form action="{{ route('reviews.store', $restaurant->id) }}" method="POST" enctype="multipart/form-data">
                                            @csrf
                                            <div class="mb-4">
                                                <label class="block text-sm font-bold mb-1 text-gray-700">評価</label>
                                                <select name="rating" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500">
                                                    <option value="5" selected>⭐️⭐️⭐️⭐️⭐️ 5</option>
                                                    <option value="4">⭐️⭐️⭐️⭐️ 4</option>
                                                    <option value="3">⭐️⭐️⭐️ 3</option>
                                                    <option value="2">⭐️⭐️ 2</option>
                                                    <option value="1">⭐️ 1</option>
                                                </select>
                                            </div>
                                            <div class="mb-4">
                                                <label class="block text-sm font-bold mb-1 text-gray-700">コメント</label>
                                                <textarea name="comment" rows="4" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="感想を教えてください"></textarea>
                                            </div>
                                            <div class="mb-4">
                                                <label class="block text-sm font-bold mb-1 text-gray-700">画像</label>
                                                <input type="file" name="images[]" multiple class="w-full text-sm text-gray-500 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200">
                                            </div>
                                            <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-full transition shadow-md">
                                                投稿する
                                            </button>
                                        </form>
                                    @else
                                        <p class="text-sm text-gray-500 mb-4">レビューを投稿するにはログインが必要です。</p>
                                        <a href="{{ route('login') }}" class="block text-center border border-orange-500 text-orange-500 font-bold py-2 rounded-full hover:bg-orange-50">ログイン</a>
                                    @endauth
                                </div>
                            </div>

                            {{-- 右側：レビュー一覧 --}}
                            <div class="lg:col-span-2">
                                <h3 class="font-bold mb-4 text-gray-800 text-lg">新着レビュー</h3>
                                @if($restaurant->reviews->isEmpty())
                                    <div class="text-center py-10 bg-gray-50 rounded-lg text-gray-500">
                                        まだレビューはありません。<br>最初の投稿者になりましょう！
                                    </div>
                                @else
                                    <div class="space-y-6">
                                        @foreach($restaurant->reviews as $review)
                                            <div class="border-b border-gray-100 pb-6 last:border-0">
                                                <div class="flex justify-between items-center mb-2">
                                                    <div class="flex items-center gap-2">
                                                        <span class="font-bold text-gray-800">👤 {{ $review->user->name }}</span>
                                                        <span class="text-yellow-500 text-sm">
                                                            {{ str_repeat('★', $review->rating) }}<span class="text-gray-300">{{ str_repeat('★', 5 - $review->rating) }}</span>
                                                        </span>
                                                    </div>
                                                    <span class="text-xs text-gray-400">{{ $review->created_at->format('Y/m/d') }}</span>
                                                </div>
                                                <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-3">{{ $review->comment }}</p>
                                                
                                                @if($review->images->isNotEmpty())
                                                    @php
                                                        $reviewImages = $review->images->map(fn($img) => asset('storage/' . $img->image_path));
                                                        $firstReviewImage = $review->images->first();
                                                    @endphp

                                                    <div class="mt-3 w-full md:w-3/4 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group cursor-pointer shadow-sm js-modal-trigger"
                                                         data-images="{{ json_encode($reviewImages) }}"
                                                         onclick="openModalFromElement(this)">
                                                        <img src="{{ asset('storage/' . $firstReviewImage->image_path) }}" class="w-full h-full object-contain bg-gray-50" alt="レビュー画像">
                                                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition"></div>
                                                        @if($review->images->count() > 1)
                                                            <div class="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
                                                                +{{ $review->images->count() - 1 }}
                                                            </div>
                                                        @endif
                                                    </div>
                                                @endif

                                                @if(Auth::id() === $review->user_id)
                                                    <form action="{{ route('reviews.destroy', $review->id) }}" method="POST" class="mt-2 text-right" onsubmit="return confirm('削除しますか？');">
                                                        @csrf @method('DELETE')
                                                        <button class="text-xs text-red-400 hover:text-red-600 hover:underline">削除する</button>
                                                    </form>
                                                @endif
                                            </div>
                                        @endforeach
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>


                    {{-- 4. アクセスタブ --}}
                    <div class="js-tab-content hidden" id="access" role="tabpanel">
                        <h2 class="text-xl font-bold text-gray-800 mb-6 border-l-4 border-orange-500 pl-3">店舗へのアクセス</h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div class="space-y-4">
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <p class="text-xs text-gray-500 font-bold mb-1">住所</p>
                                    <p class="text-lg">{{ $restaurant->address }}</p>
                                </div>

                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <p class="text-xs text-gray-500 font-bold mb-1">最寄り駅</p>
                                    <p class="text-lg">
                                        {{ $restaurant->nearest_station ?? '情報なし' }}
                                    </p>
                                </div>

                                <div class="pt-4">
                                    <a href="https://www.google.com/maps/search/?api=1&query={{ urlencode($restaurant->address) }}" target="_blank" class="inline-flex items-center text-blue-600 hover:underline font-bold">
                                        <span class="mr-2">🗺️</span> Googleマップで開く
                                    </a>
                                </div>
                            </div>

                            {{-- ★★★ Googleマップ埋め込みエリア ★★★ --}}
                            <div class="h-[300px] w-full bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                @php
                                    $mapQuery = urlencode($restaurant->address);
                                    if ($restaurant->latitude && $restaurant->longitude) {
                                        $mapQuery = "{$restaurant->latitude},{$restaurant->longitude}";
                                    }
                                @endphp
                                <iframe
                                    src="https://maps.google.com/maps?q={{ $mapQuery }}&output=embed&t=m&z=15"
                                    width="100%"
                                    height="100%"
                                    style="border:0;"
                                    allowfullscreen=""
                                    loading="lazy">
                                </iframe>
                            </div>
                        </div>
                    </div>


                    {{-- 5. 予約タブ（ステップウィザード） --}}
                    <div class="js-tab-content hidden" id="reservation" role="tabpanel">
                        <h2 class="text-xl font-bold text-gray-800 mb-6 border-l-4 border-orange-500 pl-3">予約</h2>

                        {{-- 成功メッセージ --}}
                        @if (session('success'))
                            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                                {{ session('success') }}
                            </div>
                        @endif

                        {{-- エラーメッセージ --}}
                        @if ($errors->any())
                            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                                <ul>
                                    @foreach ($errors->all() as $error)
                                        <li>{{ $error }}</li>
                                    @endforeach
                                </ul>
                            </div>
                        @endif

                        @if($restaurant->seatTypes->isEmpty())
                            <div class="text-center py-10 bg-gray-50 rounded-lg text-gray-500">
                                この店舗は現在予約を受け付けていません。
                            </div>
                        @else
                            @auth
                                <div class="max-w-lg" id="reservation-wizard"
                                     data-restaurant-id="{{ $restaurant->id }}"
                                     data-max-party-size="{{ $restaurant->max_party_size ?? '' }}"
                                     data-available-dates-url="{{ route('reservations.available-dates', $restaurant) }}"
                                     data-available-times-url="{{ route('reservations.available-times', $restaurant) }}"
                                     data-available-seats-url="{{ route('reservations.available-seats', $restaurant) }}">

                                    {{-- プログレスバー --}}
                                    <div class="flex items-center justify-between mb-8" id="wizard-progress">
                                        <div class="flex flex-col items-center gap-1">
                                            <span class="wz-dot active" data-step="1">1</span>
                                            <span class="text-xs text-gray-400">人数</span>
                                        </div>
                                        <div class="flex-1 h-px bg-gray-200 mx-1"></div>
                                        <div class="flex flex-col items-center gap-1">
                                            <span class="wz-dot" data-step="2">2</span>
                                            <span class="text-xs text-gray-400">日付</span>
                                        </div>
                                        <div class="flex-1 h-px bg-gray-200 mx-1"></div>
                                        <div class="flex flex-col items-center gap-1">
                                            <span class="wz-dot" data-step="3">3</span>
                                            <span class="text-xs text-gray-400">時間</span>
                                        </div>
                                        <div class="flex-1 h-px bg-gray-200 mx-1"></div>
                                        <div class="flex flex-col items-center gap-1">
                                            <span class="wz-dot" data-step="4">4</span>
                                            <span class="text-xs text-gray-400">席</span>
                                        </div>
                                        <div class="flex-1 h-px bg-gray-200 mx-1"></div>
                                        <div class="flex flex-col items-center gap-1">
                                            <span class="wz-dot" data-step="5">5</span>
                                            <span class="text-xs text-gray-400">確認</span>
                                        </div>
                                    </div>

                                    {{-- ステップ1: 人数 --}}
                                    <div class="wz-step" data-step="1">
                                        <h3 class="text-lg font-bold text-gray-700 mb-4">人数を選択</h3>
                                        @if($restaurant->max_party_size)
                                            <p class="text-xs text-orange-600 mb-3">※ 一度の予約で最大{{ $restaurant->max_party_size }}名まで</p>
                                        @endif
                                        {{-- 直接入力欄（上部） --}}
                                        <div class="flex items-center gap-2 mb-4">
                                            <input type="number" id="wz-people-input" min="1"
                                                   max="{{ $restaurant->max_party_size ?? 99 }}"
                                                   class="w-20 border-gray-300 rounded-md shadow-sm text-center focus:border-orange-500 focus:ring-orange-500"
                                                   placeholder="人数">
                                            <span class="text-sm text-gray-600">名</span>
                                            <button type="button" id="wz-people-next"
                                                    class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled>次へ</button>
                                        </div>
                                        {{-- 横スクロールボタン（下部） --}}
                                        <div class="flex gap-2 overflow-x-auto pb-2" id="wz-people-btns"></div>
                                    </div>

                                    {{-- ステップ2: カレンダー --}}
                                    <div class="wz-step hidden" data-step="2">
                                        <div class="flex items-center justify-between mb-4">
                                            <button type="button" class="wz-back text-sm text-gray-500 hover:text-orange-500" data-back="1">← 人数を変更</button>
                                            <h3 class="text-lg font-bold text-gray-700">日付を選択</h3>
                                            <span></span>
                                        </div>
                                        <p class="text-sm text-gray-500 mb-4" id="wz-people-summary"></p>
                                        <div id="wz-cal">
                                            <div class="flex items-center justify-between mb-3">
                                                <button type="button" id="cal-prev" class="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-30" disabled>
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                                                </button>
                                                <span id="cal-title" class="font-bold text-gray-700"></span>
                                                <button type="button" id="cal-next" class="p-2 hover:bg-gray-100 rounded-full transition">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                                                </button>
                                            </div>
                                            <div style="display:grid; grid-template-columns:repeat(7,1fr); text-align:center; font-size:12px; font-weight:bold; color:#6b7280; margin-bottom:4px;">
                                                <span style="color:#f87171;">日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span style="color:#60a5fa;">土</span>
                                            </div>
                                            <div id="cal-grid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:2px;"></div>
                                        </div>
                                        <div id="cal-loading" class="text-center py-8 text-gray-400 hidden">
                                            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
                                            <p class="mt-2 text-sm">空き日を確認中...</p>
                                        </div>
                                        <div id="cal-empty" class="text-center py-8 text-gray-400 hidden">
                                            <p>この月に空きはありません</p>
                                        </div>
                                    </div>

                                    {{-- ステップ3: 時間帯 --}}
                                    <div class="wz-step hidden" data-step="3">
                                        <div class="flex items-center justify-between mb-4">
                                            <button type="button" class="wz-back text-sm text-gray-500 hover:text-orange-500" data-back="2">← 日付を変更</button>
                                            <h3 class="text-lg font-bold text-gray-700">時間を選択</h3>
                                            <span></span>
                                        </div>
                                        <p class="text-sm text-gray-500 mb-4" id="wz-date-summary"></p>
                                        <div id="wz-times" class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2"></div>
                                        <div id="time-loading" class="text-center py-8 text-gray-400 hidden">
                                            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
                                            <p class="mt-2 text-sm">空き時間を確認中...</p>
                                        </div>
                                    </div>

                                    {{-- ステップ4: 席タイプ --}}
                                    <div class="wz-step hidden" data-step="4">
                                        <div class="flex items-center justify-between mb-4">
                                            <button type="button" class="wz-back text-sm text-gray-500 hover:text-orange-500" data-back="3">← 時間を変更</button>
                                            <h3 class="text-lg font-bold text-gray-700">席タイプを選択</h3>
                                            <span></span>
                                        </div>
                                        <p class="text-sm text-gray-500 mb-4" id="wz-time-summary"></p>
                                        <div id="wz-seats" class="space-y-3"></div>
                                        <div id="seat-loading" class="text-center py-8 text-gray-400 hidden">
                                            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
                                            <p class="mt-2 text-sm">空き席を確認中...</p>
                                        </div>
                                    </div>

                                    {{-- ステップ5: 確認 --}}
                                    <div class="wz-step hidden" data-step="5">
                                        <div class="flex items-center justify-between mb-4">
                                            <button type="button" class="wz-back text-sm text-gray-500 hover:text-orange-500" data-back="4">← 席タイプを変更</button>
                                            <h3 class="text-lg font-bold text-gray-700">予約内容の確認</h3>
                                            <span></span>
                                        </div>
                                        <div class="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                                            <dl class="space-y-3 text-sm">
                                                <div class="flex justify-between"><dt class="text-gray-500">人数</dt><dd class="font-bold" id="wz-cf-people"></dd></div>
                                                <div class="flex justify-between"><dt class="text-gray-500">日付</dt><dd class="font-bold" id="wz-cf-date"></dd></div>
                                                <div class="flex justify-between"><dt class="text-gray-500">時間</dt><dd class="font-bold" id="wz-cf-time"></dd></div>
                                                <div class="flex justify-between"><dt class="text-gray-500">席タイプ</dt><dd class="font-bold" id="wz-cf-seat"></dd></div>
                                            </dl>
                                        </div>
                                        <form action="{{ route('reservations.store', $restaurant->id) }}" method="POST" id="reservation-form">
                                            @csrf
                                            <input type="hidden" name="number_of_people" id="wz-f-people">
                                            <input type="hidden" name="reservation_date" id="wz-f-date">
                                            <input type="hidden" name="reservation_time" id="wz-f-time">
                                            <input type="hidden" name="seat_category" id="wz-f-seat">
                                            <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-full transition shadow-md">
                                                予約確定
                                            </button>
                                        </form>
                                        <button type="button" class="wz-back w-full mt-3 text-sm text-gray-400 hover:text-orange-500 py-2 transition" data-back="1">
                                            最初からやり直す
                                        </button>
                                    </div>
                                </div>
                            @else
                                <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                                    <p class="text-gray-500 mb-4">予約するにはログインが必要です。</p>
                                    <a href="{{ route('login') }}" class="inline-block border border-orange-500 text-orange-500 font-bold py-2 px-6 rounded-full hover:bg-orange-50 transition">ログイン</a>
                                </div>
                            @endauth
                        @endif
                    </div>

                </div>
            </div>
        </div>
    </main>

    {{-- 予約完了ポップアップ --}}
    @if(session('success'))
        <div id="success-reservation-popup" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50" onclick="if(event.target === this) this.remove()">
            <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center transform animate-[popIn_0.3s_ease-out]">
                <div class="text-5xl mb-4">&#10003;</div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">予約が完了しました</h3>
                <p class="text-sm text-gray-500 mb-6">{{ session('success') }}</p>
                <button onclick="document.getElementById('success-reservation-popup').remove()" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-8 rounded-full transition shadow-md">OK</button>
            </div>
        </div>
    @endif

    {{-- 店舗更新完了ポップアップ --}}
    @if(session('success_update'))
        <div id="success-update-popup" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50" onclick="if(event.target === this) this.remove()">
            <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center transform animate-[popIn_0.3s_ease-out]">
                <div class="text-5xl mb-4">&#9998;</div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">更新完了</h3>
                <p class="text-sm text-gray-500 mb-6">{{ session('success_update') }}</p>
                <button onclick="document.getElementById('success-update-popup').remove()" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-8 rounded-full transition shadow-md">OK</button>
            </div>
        </div>
    @endif

    @if(session('success') || session('success_update'))
        <style>
            @keyframes popIn {
                0% { opacity: 0; transform: scale(0.8); }
                100% { opacity: 1; transform: scale(1); }
            }
        </style>
    @endif

    {{-- 画像モーダル --}}
    <div id="image-modal" class="fixed inset-0 z-50 bg-black/95 hidden flex items-center justify-center p-4" onclick="if(event.target === this) closeModal()">
        <button onclick="closeModal()" class="fixed top-6 right-6 z-[60] bg-white rounded-full p-3 text-black shadow-lg hover:bg-gray-200 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <button id="prev-btn" onclick="prevImage()" class="hidden fixed left-4 top-1/2 -translate-y-1/2 z-[60] bg-white rounded-full p-4 text-black shadow-lg hover:bg-gray-200 transition transform hover:scale-110">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div class="relative w-full max-w-7xl h-full flex items-center justify-center mx-auto pointer-events-none">
            <img id="modal-image" src="" class="max-w-full max-h-[90vh] object-contain select-none shadow-2xl rounded pointer-events-auto">
        </div>
        <button id="next-btn" onclick="nextImage()" class="hidden fixed right-4 top-1/2 -translate-y-1/2 z-[60] bg-white rounded-full p-4 text-black shadow-lg hover:bg-gray-200 transition transform hover:scale-110">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
        </button>
    </div>

    {{-- スタイルとスクリプト --}}
    <style>
        .active-tab {
            color: #f97316 !important;
            border-bottom-color: #f97316 !important;
        }
        .wz-dot {
            width: 28px; height: 28px; border-radius: 50%;
            display: inline-flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: bold;
            background-color: #e5e7eb; color: #9ca3af;
            transition: all 0.2s;
        }
        .wz-dot.active { background-color: #f97316; color: white; }
        .wz-dot.done { background-color: #22c55e; color: white; }
        .cal-cell {
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 4px 0; min-height: 48px;
            cursor: default; transition: all 0.15s;
            border-radius: 6px; border: 2px solid transparent;
        }
        .cal-cell.available { cursor: pointer; }
        .cal-cell.available:hover { background-color: #fff7ed; }
        .cal-cell.today { border-color: #f97316; }
        .cal-cell .cal-num { font-size: 14px; line-height: 1.2; }
        .cal-cell .cal-ind { font-size: 16px; line-height: 1; margin-top: 2px; }
        .cal-cell.available .cal-ind { color: #ea580c; }
        .cal-cell.unavailable .cal-num { color: #9ca3af; }
        .cal-cell.unavailable .cal-ind { color: #d1d5db; font-size: 13px; }
        #wz-people-btns { scrollbar-width: thin; }
        #wz-people-btns::-webkit-scrollbar { height: 4px; }
        #wz-people-btns::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
    </style>

    <script>
        // タブ切り替え
        document.addEventListener('DOMContentLoaded', function () {
            const tabs = document.querySelectorAll('.js-tab-trigger');
            const contents = document.querySelectorAll('.js-tab-content');

            function activateTab(targetId) {
                tabs.forEach(t => t.classList.remove('active-tab', 'border-orange-500', 'text-orange-600'));
                tabs.forEach(t => t.classList.add('border-transparent'));
                contents.forEach(c => c.classList.add('hidden'));
                contents.forEach(c => c.classList.remove('block'));
                const targetTab = document.querySelector('.js-tab-trigger[data-target="' + targetId + '"]');
                if (targetTab) {
                    targetTab.classList.add('active-tab');
                    targetTab.classList.remove('border-transparent');
                }
                document.getElementById(targetId).classList.remove('hidden');
                document.getElementById(targetId).classList.add('block');
            }

            tabs.forEach(tab => {
                tab.addEventListener('click', () => activateTab(tab.getAttribute('data-target')));
            });

            // バリデーションエラー時は予約タブを自動表示
            @if($errors->any())
                activateTab('reservation');
            @endif
        });

        // 予約ウィザード
        (function() {
            const wizard = document.getElementById('reservation-wizard');
            if (!wizard) return;

            const config = {
                maxPartySize: wizard.dataset.maxPartySize ? parseInt(wizard.dataset.maxPartySize) : null,
                urls: {
                    dates: wizard.dataset.availableDatesUrl,
                    times: wizard.dataset.availableTimesUrl,
                    seats: wizard.dataset.availableSeatsUrl,
                }
            };

            const state = {
                people: null, date: null, time: null,
                seatCategory: null, seatLabel: null,
                calYear: new Date().getFullYear(),
                calMonth: new Date().getMonth() + 1,
                dateCache: {},
            };

            const dayNames = ['日','月','火','水','木','金','土'];

            function toHalf(s) { return s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)); }

            async function apiFetch(url, params) {
                const q = new URLSearchParams(params).toString();
                const res = await fetch(url + '?' + q, {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                });
                if (!res.ok) throw new Error('API error');
                return res.json();
            }

            // === ステップ切替 ===
            function goToStep(step) {
                wizard.querySelectorAll('.wz-step').forEach(el => el.classList.add('hidden'));
                wizard.querySelector('.wz-step[data-step="'+step+'"]').classList.remove('hidden');
                wizard.querySelectorAll('.wz-dot').forEach(dot => {
                    const s = parseInt(dot.dataset.step);
                    dot.classList.remove('active','done');
                    if (s < step) dot.classList.add('done');
                    if (s === step) dot.classList.add('active');
                });
                // ステップ2以降ではブラウザバック確認を有効化
                if (step > 1) {
                    window.onbeforeunload = () => '選択した予約内容が全てリセットされますが、よろしいですか？';
                } else {
                    window.onbeforeunload = null;
                }
            }

            // フォーム送信時は確認を解除
            const reservationForm = document.getElementById('reservation-form');
            if (reservationForm) {
                reservationForm.addEventListener('submit', () => { window.onbeforeunload = null; });
            }

            // 戻るボタン
            wizard.querySelectorAll('.wz-back').forEach(btn => {
                btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.back)));
            });

            // === ステップ1: 人数 ===
            function initPeopleStep() {
                const max = config.maxPartySize || 10;
                const container = document.getElementById('wz-people-btns');
                const input = document.getElementById('wz-people-input');
                const nextBtn = document.getElementById('wz-people-next');

                for (let i = 1; i <= max; i++) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'flex-shrink-0 w-12 py-3 rounded-lg border-2 border-gray-200 text-gray-700 font-bold hover:border-orange-500 hover:text-orange-500 transition text-sm';
                    btn.textContent = i + '名';
                    btn.addEventListener('click', () => selectPeople(i));
                    container.appendChild(btn);
                }

                input.addEventListener('input', function() {
                    this.value = toHalf(this.value);
                    const v = parseInt(this.value);
                    nextBtn.disabled = !(v >= 1 && (!config.maxPartySize || v <= config.maxPartySize));
                });
                nextBtn.addEventListener('click', () => {
                    const v = parseInt(input.value);
                    if (v >= 1) selectPeople(v);
                });
            }

            function selectPeople(n) {
                state.people = n;
                document.getElementById('wz-people-input').value = n;
                document.querySelectorAll('#wz-people-btns button').forEach(btn => {
                    const sel = btn.textContent === n + '名';
                    btn.classList.toggle('border-orange-500', sel);
                    btn.classList.toggle('text-orange-500', sel);
                    btn.classList.toggle('bg-orange-50', sel);
                });
                document.getElementById('wz-people-summary').textContent = n + '名で予約';
                state.dateCache = {};
                goToStep(2);
                loadCalendar();
            }

            // === ステップ2: カレンダー ===
            async function loadCalendar() {
                const grid = document.getElementById('cal-grid');
                const title = document.getElementById('cal-title');
                const loading = document.getElementById('cal-loading');
                const empty = document.getElementById('cal-empty');
                const prevBtn = document.getElementById('cal-prev');

                const y = state.calYear, m = state.calMonth;
                const key = y + '-' + String(m).padStart(2,'0');

                title.textContent = y + '年' + m + '月';
                const now = new Date();
                prevBtn.disabled = (y === now.getFullYear() && m === now.getMonth() + 1);

                grid.innerHTML = '';
                empty.classList.add('hidden');
                loading.classList.remove('hidden');

                let dates;
                if (state.dateCache[key]) {
                    dates = state.dateCache[key];
                } else {
                    try {
                        const data = await apiFetch(config.urls.dates, { people: state.people, year: y, month: m });
                        if (data.error) {
                            loading.classList.add('hidden');
                            empty.textContent = data.error;
                            empty.classList.remove('hidden');
                            return;
                        }
                        dates = data.dates || [];
                        state.dateCache[key] = dates;
                    } catch(e) {
                        loading.classList.add('hidden');
                        empty.textContent = '読み込みに失敗しました';
                        empty.classList.remove('hidden');
                        return;
                    }
                }

                loading.classList.add('hidden');
                if (dates.length === 0) empty.classList.remove('hidden');
                renderCalendar(y, m, dates);
            }

            function renderCalendar(year, month, availableDates) {
                const grid = document.getElementById('cal-grid');
                grid.innerHTML = '';
                const firstDow = new Date(year, month - 1, 1).getDay();
                const days = new Date(year, month, 0).getDate();
                const today = new Date(); today.setHours(0,0,0,0);
                const avSet = new Set(availableDates);

                // 空セル
                for (let i = 0; i < firstDow; i++) {
                    grid.appendChild(document.createElement('div'));
                }

                for (let d = 1; d <= days; d++) {
                    const ds = year + '-' + String(month).padStart(2,'0') + '-' + String(d).padStart(2,'0');
                    const dObj = new Date(year, month - 1, d);
                    const dow = dObj.getDay();
                    const isToday = dObj.getTime() === today.getTime();
                    const isPast = dObj < today;
                    const isAv = avSet.has(ds);

                    const cell = document.createElement('button');
                    cell.type = 'button';

                    const numSpan = document.createElement('span');
                    numSpan.className = 'cal-num';
                    numSpan.textContent = d;
                    if (dow === 0) numSpan.style.color = '#f87171';
                    else if (dow === 6) numSpan.style.color = '#60a5fa';

                    const indSpan = document.createElement('span');
                    indSpan.className = 'cal-ind';

                    if (isAv && !isPast) {
                        cell.className = 'cal-cell available';
                        indSpan.textContent = '○';
                        cell.addEventListener('click', () => selectDate(ds));
                    } else {
                        cell.className = 'cal-cell unavailable';
                        indSpan.textContent = '—';
                        cell.disabled = true;
                    }

                    if (isToday) cell.classList.add('today');
                    cell.appendChild(numSpan);
                    cell.appendChild(indSpan);
                    grid.appendChild(cell);
                }
            }

            function selectDate(ds) {
                state.date = ds;
                const d = new Date(ds + 'T00:00:00');
                const disp = d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日(' + dayNames[d.getDay()] + ')';
                document.getElementById('wz-date-summary').textContent = state.people + '名 / ' + disp;
                goToStep(3);
                loadTimes();
            }

            document.getElementById('cal-prev').addEventListener('click', () => {
                state.calMonth--;
                if (state.calMonth < 1) { state.calMonth = 12; state.calYear--; }
                loadCalendar();
            });
            document.getElementById('cal-next').addEventListener('click', () => {
                state.calMonth++;
                if (state.calMonth > 12) { state.calMonth = 1; state.calYear++; }
                loadCalendar();
            });

            // === ステップ3: 時間帯 ===
            async function loadTimes() {
                const container = document.getElementById('wz-times');
                const loading = document.getElementById('time-loading');
                container.innerHTML = '';
                loading.classList.remove('hidden');

                try {
                    const data = await apiFetch(config.urls.times, { people: state.people, date: state.date });
                    loading.classList.add('hidden');
                    const times = data.times || [];
                    const hasAvailable = times.some(s => s.available);

                    // 全スロット不可 → カレンダーに戻って再読み込み
                    if (times.length === 0 || !hasAvailable) {
                        state.dateCache = {};
                        goToStep(2);
                        loadCalendar();
                        return;
                    }
                    times.forEach(slot => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.textContent = slot.time;
                        if (slot.available) {
                            btn.className = 'py-3 px-4 rounded-lg border-2 border-gray-200 text-gray-700 font-bold hover:border-orange-500 hover:text-orange-500 transition text-sm text-center';
                            btn.addEventListener('click', () => selectTime(slot.time));
                        } else {
                            btn.className = 'py-3 px-4 rounded-lg border-2 border-gray-100 text-gray-300 font-bold cursor-not-allowed text-sm text-center';
                            btn.disabled = true;
                        }
                        container.appendChild(btn);
                    });
                } catch(e) {
                    loading.classList.add('hidden');
                    container.innerHTML = '<p class="text-red-400 text-center py-4">読み込みに失敗しました</p>';
                }
            }

            function selectTime(time) {
                state.time = time;
                const d = new Date(state.date + 'T00:00:00');
                const disp = (d.getMonth()+1) + '/' + d.getDate() + '(' + dayNames[d.getDay()] + ')';
                document.getElementById('wz-time-summary').textContent = state.people + '名 / ' + disp + ' ' + time;
                goToStep(4);
                loadSeats();
            }

            // === ステップ4: 席タイプ ===
            async function loadSeats() {
                const container = document.getElementById('wz-seats');
                const loading = document.getElementById('seat-loading');
                container.innerHTML = '';
                loading.classList.remove('hidden');

                try {
                    const data = await apiFetch(config.urls.seats, { people: state.people, date: state.date, time: state.time });
                    loading.classList.add('hidden');
                    const seats = data.seats || [];

                    // 空き席ゼロ（レースコンディション対策） → カレンダーからやり直し
                    if (seats.length === 0) {
                        state.dateCache = {};
                        goToStep(2);
                        loadCalendar();
                        return;
                    }

                    // 1種のみなら自動スキップ
                    if (seats.length === 1) {
                        selectSeat(seats[0].value, seats[0].label);
                        return;
                    }

                    seats.forEach(seat => {
                        const card = document.createElement('button');
                        card.type = 'button';
                        card.className = 'w-full p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 transition text-left flex justify-between items-center';

                        const info = document.createElement('div');
                        const labelSpan = document.createElement('span');
                        labelSpan.className = 'font-bold text-gray-700';
                        labelSpan.textContent = seat.label;
                        info.appendChild(labelSpan);
                        if (seat.hint) {
                            info.appendChild(document.createElement('br'));
                            const hintSpan = document.createElement('span');
                            hintSpan.className = 'text-xs text-gray-400';
                            hintSpan.textContent = seat.hint;
                            info.appendChild(hintSpan);
                        }
                        card.appendChild(info);

                        const arrow = document.createElement('span');
                        arrow.className = 'text-orange-500 font-bold text-sm';
                        arrow.textContent = '選択 →';
                        card.appendChild(arrow);

                        card.addEventListener('click', () => selectSeat(seat.value, seat.label));
                        container.appendChild(card);
                    });
                } catch(e) {
                    loading.classList.add('hidden');
                    container.innerHTML = '<p class="text-red-400 text-center py-4">読み込みに失敗しました</p>';
                }
            }

            function selectSeat(value, label) {
                state.seatCategory = value;
                state.seatLabel = label;
                goToStep(5);
                showConfirmation();
            }

            // === ステップ5: 確認 ===
            function showConfirmation() {
                const d = new Date(state.date + 'T00:00:00');
                const disp = d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日(' + dayNames[d.getDay()] + ')';
                document.getElementById('wz-cf-people').textContent = state.people + '名';
                document.getElementById('wz-cf-date').textContent = disp;
                document.getElementById('wz-cf-time').textContent = state.time;
                document.getElementById('wz-cf-seat').textContent = state.seatLabel;
                document.getElementById('wz-f-people').value = state.people;
                document.getElementById('wz-f-date').value = state.date;
                document.getElementById('wz-f-time').value = state.time;
                document.getElementById('wz-f-seat').value = state.seatCategory;
            }

            // 初期化
            initPeopleStep();
            goToStep(1);
        })();

        // モーダル機能
        let currentImages = [];
        let currentIndex = 0;
        function openModalFromElement(element) {
            const imagesJson = element.getAttribute('data-images');
            if(imagesJson) {
                const images = JSON.parse(imagesJson);
                openModal(images, 0); 
            }
        }
        function openModal(images, index = 0) {
            if(!images || images.length === 0) return;
            currentImages = images;
            currentIndex = index;
            updateImage();
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            if (currentImages.length > 1) {
                prevBtn.classList.remove('hidden');
                nextBtn.classList.remove('hidden');
            } else {
                prevBtn.classList.add('hidden');
                nextBtn.classList.add('hidden');
            }
            document.getElementById('image-modal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
        function closeModal() { 
            document.getElementById('image-modal').classList.add('hidden'); 
            document.body.style.overflow = 'auto';
        }
        function updateImage() { 
            document.getElementById('modal-image').src = currentImages[currentIndex];
        }
        function nextImage() { currentIndex = (currentIndex + 1) % currentImages.length; updateImage(); }
        function prevImage() { currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length; updateImage(); }
        document.addEventListener('keydown', function(e) {
            const modal = document.getElementById('image-modal');
            if (modal.classList.contains('hidden')) return;
            if (currentImages.length > 1) {
                if (e.key === 'ArrowRight') nextImage();
                if (e.key === 'ArrowLeft') prevImage();
            }
            if (e.key === 'Escape') closeModal();
        });
    </script>
</x-app-layout>