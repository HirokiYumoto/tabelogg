<x-app-layout>
    <x-site-header />

    <main class="py-10">
        <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="bg-white p-8 rounded-lg shadow">

                <h1 class="text-2xl font-bold mb-6">{{ $restaurant->name }} 予約フォーム</h1>

                @if (session('success'))
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {{ session('success') }}
                    </div>
                @endif

                @if ($errors->any())
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <ul>
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <form action="{{ route('reservations.store', $restaurant->id) }}" method="POST">
                    @csrf

                    <div class="mb-4">
                        <label class="block text-gray-700 font-bold mb-2">日付</label>
                        <input type="date" name="reservation_date" value="{{ old('reservation_date') }}"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" required>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 font-bold mb-2">時間</label>
                        <select name="reservation_time" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" required>
                            <option value="">選択してください</option>
                            @for ($h = 0; $h < 24; $h++)
                                @for ($m = 0; $m < 60; $m += 15)
                                    @php $time = sprintf('%02d:%02d', $h, $m); @endphp
                                    <option value="{{ $time }}" {{ old('reservation_time') === $time ? 'selected' : '' }}>{{ $time }}</option>
                                @endfor
                            @endfor
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 font-bold mb-2">席カテゴリ</label>
                        <select id="rc-seat-category" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" required>
                            <option value="">選択してください</option>
                            @if($seatTypes->where('type', 'counter')->count() > 0)
                                <option value="counter">カウンター</option>
                            @endif
                            @if($seatTypes->where('type', 'table')->count() > 0)
                                <option value="table">テーブル</option>
                            @endif
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 font-bold mb-2">座席タイプ</label>
                        <select name="seat_type_id" id="rc-seat-type" class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" required>
                            <option value="">先に席カテゴリを選択</option>
                            @foreach ($seatTypes as $st)
                                <option value="{{ $st->id }}"
                                    data-type="{{ $st->type }}"
                                    data-seats-per-unit="{{ $st->seats_per_unit }}"
                                    style="display:none;"
                                    {{ old('seat_type_id') == $st->id ? 'selected' : '' }}>
                                    {{ $st->name }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div class="mb-6">
                        <label class="block text-gray-700 font-bold mb-2">人数</label>
                        <input type="text" inputmode="numeric" name="number_of_people" id="rc-number-of-people"
                            value="{{ old('number_of_people', 1) }}"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500" required>
                        <p id="rc-people-hint" class="text-xs text-gray-500 mt-1"></p>
                    </div>

                    <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full transition shadow-md">
                        予約を確定する
                    </button>
                </form>

            </div>
        </div>
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const cat = document.getElementById('rc-seat-category');
            const seatSel = document.getElementById('rc-seat-type');
            const numInput = document.getElementById('rc-number-of-people');
            const hint = document.getElementById('rc-people-hint');

            function toHalf(s) { return s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)); }
            if (numInput) numInput.addEventListener('input', function() { this.value = toHalf(this.value); });

            cat.addEventListener('change', function() {
                const v = this.value;
                seatSel.value = '';
                hint.textContent = '';
                seatSel.querySelectorAll('option[data-type]').forEach(o => {
                    o.style.display = o.dataset.type === v ? '' : 'none';
                });
            });

            seatSel.addEventListener('change', function() {
                const opt = this.options[this.selectedIndex];
                if (!opt || !opt.dataset.type) { hint.textContent = ''; return; }
                if (opt.dataset.type === 'counter') {
                    hint.textContent = 'カウンター席：1名から入力できます';
                } else {
                    hint.textContent = 'テーブル席：1卓あたり最大' + opt.dataset.seatsPerUnit + '名まで';
                }
            });

            const oldId = '{{ old("seat_type_id") }}';
            if (oldId) {
                const opt = seatSel.querySelector('option[value="' + oldId + '"]');
                if (opt) {
                    cat.value = opt.dataset.type;
                    cat.dispatchEvent(new Event('change'));
                    seatSel.value = oldId;
                    seatSel.dispatchEvent(new Event('change'));
                }
            }
        });
    </script>
</x-app-layout>
