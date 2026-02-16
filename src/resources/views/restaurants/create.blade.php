<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('新しいお店を登録') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900">
                    
                    {{-- エラー表示 --}}
                    @if ($errors->any())
                        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            <ul>
                                @foreach ($errors->all() as $error)
                                    <li>・{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <form action="{{ route('restaurants.store') }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        
                        {{-- 店舗名 --}}
                        <div class="mb-6">
                            <label class="block text-gray-700 font-bold mb-2">店舗名 <span class="text-red-500">*</span></label>
                            <input type="text" name="name" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="例：中華そば 太郎" required>
                        </div>

                        {{-- エリア選択 --}}
                        <div class="mb-6">
                            <label class="block text-gray-700 font-bold mb-2">エリア <span class="text-red-500">*</span></label>
                            <select name="city_id" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500">
                                @foreach($prefectures as $prefecture)
                                    <optgroup label="{{ $prefecture->name }}">
                                        @foreach($prefecture->cities as $city)
                                            <option value="{{ $city->id }}">{{ $city->name }}</option>
                                        @endforeach
                                    </optgroup>
                                @endforeach
                            </select>
                        </div>

                        {{-- ★★★ 追加：住所（必須） ★★★ --}}
                        <div class="mb-6">
                            <label class="block text-gray-700 font-bold mb-2">住所詳細 <span class="text-red-500">*</span></label>
                            <input type="text" name="address" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="例：1-2-3 ○○ビル1F" required>
                            <p class="text-xs text-gray-500 mt-1">※市区町村以降の住所を入力してください</p>
                        </div>

                        {{-- 最寄駅 --}}
                        <div class="mb-6">
                            <label class="block text-gray-700 font-bold mb-2">最寄駅（任意）</label>
                            <input type="text" name="nearest_station" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="例：JR新宿駅 東口徒歩5分">
                        </div>

                        {{-- お店の紹介 --}}
                        <div class="mb-6">
                            <label class="block text-gray-700 font-bold mb-2">お店の紹介 <span class="text-red-500">*</span></label>
                            <textarea name="description" rows="5" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="お店のこだわりや特徴を入力してください" required></textarea>
                        </div>

                        {{-- メニュー情報 --}}
                        <div class="mb-6">
                            <label class="block text-gray-700 font-bold mb-2">おすすめメニュー・価格など（任意）</label>
                            <textarea name="menu_info" rows="4" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="例：&#13;&#10;特製醤油ラーメン 850円&#13;&#10;半チャーハン 300円"></textarea>
                        </div>

                        {{-- 座席タイプ --}}
                        <div class="mb-6">
                            <label class="block text-gray-700 font-bold mb-2">座席タイプ（任意）</label>
                            <p class="text-xs text-gray-500 mb-3">予約機能を利用する場合は、座席タイプを追加してください。</p>

                            <div id="seat-types-container">
                                {{-- JavaScript で動的に追加される --}}
                            </div>

                            <button type="button" onclick="addSeatType()" class="mt-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-full transition border border-gray-300">
                                + 座席タイプを追加
                            </button>
                        </div>

                        {{-- 一予約あたりの最大人数 --}}
                        <div class="mb-6">
                            <label class="block text-gray-700 font-bold mb-2">一予約あたりの最大人数（任意）</label>
                            <input type="number" name="max_party_size" min="1" value="{{ old('max_party_size') }}" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="例：8">
                            <p class="text-xs text-gray-500 mt-1">※未入力の場合は人数制限なしになります</p>
                        </div>

                        {{-- 営業時間設定 --}}
                        <div class="mb-6">
                            <label class="block text-gray-700 font-bold mb-2">営業時間（任意）</label>
                            <p class="text-xs text-gray-500 mb-3">予約を受け付ける曜日・時間帯を設定してください。</p>

                            @php
                                $days = [
                                    1 => '月曜日', 2 => '火曜日', 3 => '水曜日', 4 => '木曜日',
                                    5 => '金曜日', 6 => '土曜日', 0 => '日曜日', 7 => '祝日',
                                ];
                            @endphp

                            <div class="space-y-3" id="time-settings-container">
                                @foreach($days as $dayNum => $dayName)
                                    <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <label class="flex items-center gap-2 cursor-pointer mb-2">
                                            <input type="checkbox" class="rounded border-gray-300 text-orange-500 focus:ring-orange-500 js-day-toggle" data-day="{{ $dayNum }}"
                                                onchange="toggleDayFields({{ $dayNum }})">
                                            <span class="font-bold text-sm text-gray-700">{{ $dayName }}</span>
                                        </label>
                                        <div id="day-slots-{{ $dayNum }}" class="hidden mt-3 space-y-3"></div>
                                        <button type="button" id="add-slot-btn-{{ $dayNum }}" class="hidden mt-2 text-xs bg-white hover:bg-gray-100 text-gray-600 font-bold py-1.5 px-3 rounded-full transition border border-gray-300"
                                            onclick="addTimeSlot({{ $dayNum }})">
                                            ＋ 時間帯を追加
                                        </button>
                                    </div>
                                @endforeach
                            </div>
                        </div>

                        {{-- 画像アップロード --}}
                        <div class="mb-8">
                            <label class="block text-gray-700 font-bold mb-2">店舗・メニュー画像（複数可）</label>
                            <input type="file" name="images[]" multiple class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-200 file:text-orange-800 hover:file:bg-orange-300 cursor-pointer">
                        </div>

                        <div class="flex justify-center gap-4">
                            <a href="{{ route('dashboard') }}" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full transition">キャンセル</a>
                            <button type="submit" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-8 rounded-full shadow-lg transition">登録する</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    </div>
    <script>
        let seatTypeIndex = 0;
        const inputClass = 'w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500';

        function addSeatType() {
            const container = document.getElementById('seat-types-container');
            const card = document.createElement('div');
            card.className = 'border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50';
            card.id = 'seat-type-row-' + seatTypeIndex;
            const idx = seatTypeIndex;
            card.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-bold text-gray-700">席タイプ ${idx + 1}</span>
                    <button type="button" onclick="removeSeatType(${idx})"
                        class="text-red-400 hover:text-red-600 font-bold text-sm">削除</button>
                </div>
                <div class="mb-3">
                    <select name="seat_types[${idx}][type]" onchange="onSeatTypeChange(${idx})"
                        class="${inputClass}" required>
                        <option value="">種類を選択</option>
                        <option value="counter">カウンター</option>
                        <option value="table">テーブル</option>
                    </select>
                </div>
                <div id="seat-type-fields-${idx}"></div>
            `;
            container.appendChild(card);
            seatTypeIndex++;
        }

        function onSeatTypeChange(idx) {
            const fieldsDiv = document.getElementById('seat-type-fields-' + idx);

            const row = document.getElementById('seat-type-row-' + idx);
            const type = row.querySelector('select[name="seat_types[' + idx + '][type]"]').value;

            if (type === 'counter') {
                fieldsDiv.innerHTML = `
                    <label class="block text-sm text-gray-600 mb-1">カウンター席数（合計）</label>
                    <input type="number" name="seat_types[${idx}][capacity]" min="1"
                        class="${inputClass}" placeholder="例：10" required>
                    <input type="hidden" name="seat_types[${idx}][seats_per_unit]" value="1">
                `;
            } else if (type === 'table') {
                fieldsDiv.innerHTML = `
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">1卓あたりの席数</label>
                            <input type="number" name="seat_types[${idx}][seats_per_unit]" min="1"
                                class="${inputClass}" placeholder="例：4" required>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">テーブル数（卓数）</label>
                            <input type="number" name="seat_types[${idx}][capacity]" min="1"
                                class="${inputClass}" placeholder="例：5" required>
                        </div>
                    </div>
                `;
            } else {
                fieldsDiv.innerHTML = '';
            }
        }

        function removeSeatType(index) {
            const row = document.getElementById('seat-type-row-' + index);
            if (row) row.remove();
        }

        // ===== 営業時間スロット管理 =====
        const daySlotCounts = {};
        const MAX_SLOTS = 3;

        function generateTimeOptions(selectedVal) {
            let html = '';
            for (let h = 0; h < 24; h++) {
                for (let m = 0; m < 60; m += 15) {
                    const val = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                    html += '<option value="' + val + '"' + (val === selectedVal ? ' selected' : '') + '>' + val + '</option>';
                }
            }
            return html;
        }

        function generateEndTimeOptions(selectedVal) {
            let html = generateTimeOptions(selectedVal);
            html += '<option value="24:00"' + (selectedVal === '24:00' ? ' selected' : '') + '>24:00</option>';
            return html;
        }

        function addTimeSlot(dayNum, startTime, endTime, stayMinutes) {
            startTime = startTime || '11:00';
            endTime = endTime || '21:00';
            stayMinutes = stayMinutes || '60';

            if (!daySlotCounts[dayNum]) daySlotCounts[dayNum] = 0;
            const slotIdx = daySlotCounts[dayNum];
            if (slotIdx >= MAX_SLOTS) return;

            const key = dayNum + '_' + slotIdx;
            const container = document.getElementById('day-slots-' + dayNum);
            const slot = document.createElement('div');
            slot.id = 'time-slot-' + key;
            slot.className = 'border border-gray-100 rounded-md p-3 bg-white';
            slot.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-gray-500">時間帯 ${slotIdx + 1}</span>
                    <button type="button" onclick="removeTimeSlot('${key}', ${dayNum})" class="text-red-400 hover:text-red-600 text-xs font-bold">削除</button>
                </div>
                <input type="hidden" name="time_settings[${key}][day_of_week]" value="${dayNum}">
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">開始時間</label>
                        <select name="time_settings[${key}][start_time]" class="${inputClass} text-sm">
                            ${generateTimeOptions(startTime)}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">終了時間</label>
                        <select name="time_settings[${key}][end_time]" class="${inputClass} text-sm">
                            ${generateEndTimeOptions(endTime)}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">滞在時間</label>
                        <select name="time_settings[${key}][stay_minutes]" class="${inputClass} text-sm">
                            <option value="30"${stayMinutes == 30 ? ' selected' : ''}>30分</option>
                            <option value="60"${stayMinutes == 60 ? ' selected' : ''}>60分</option>
                            <option value="90"${stayMinutes == 90 ? ' selected' : ''}>90分</option>
                            <option value="120"${stayMinutes == 120 ? ' selected' : ''}>120分</option>
                        </select>
                    </div>
                </div>
            `;
            container.appendChild(slot);
            daySlotCounts[dayNum]++;
            updateAddSlotBtn(dayNum);
        }

        function removeTimeSlot(key, dayNum) {
            const slot = document.getElementById('time-slot-' + key);
            if (slot) slot.remove();
            daySlotCounts[dayNum]--;
            updateAddSlotBtn(dayNum);
        }

        function updateAddSlotBtn(dayNum) {
            const btn = document.getElementById('add-slot-btn-' + dayNum);
            const count = daySlotCounts[dayNum] || 0;
            if (count >= MAX_SLOTS) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
            }
        }

        function toggleDayFields(dayNum) {
            const container = document.getElementById('day-slots-' + dayNum);
            const btn = document.getElementById('add-slot-btn-' + dayNum);
            const checkbox = document.querySelector('.js-day-toggle[data-day="' + dayNum + '"]');
            if (checkbox.checked) {
                container.classList.remove('hidden');
                btn.classList.remove('hidden');
                if (!daySlotCounts[dayNum] || daySlotCounts[dayNum] === 0) {
                    addTimeSlot(dayNum);
                }
            } else {
                container.classList.add('hidden');
                btn.classList.add('hidden');
                container.innerHTML = '';
                daySlotCounts[dayNum] = 0;
            }
        }
    </script>
</x-app-layout>