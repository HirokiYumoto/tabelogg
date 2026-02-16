<x-app-layout>
    <x-site-header />

    <main class="py-10">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            <h1 class="text-2xl font-bold text-gray-900 mb-8">マイ予約</h1>

            @if (session('success'))
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                    {{ session('success') }}
                </div>
            @endif

            {{-- 今後の予約 --}}
            <section class="mb-10">
                <h2 class="text-lg font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-3">今後の予約</h2>

                @if($upcoming->isEmpty())
                    <div class="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                        今後の予約はありません。
                    </div>
                @else
                    <div class="space-y-4">
                        @foreach($upcoming as $reservation)
                            <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <a href="{{ route('restaurants.show', $reservation->restaurant_id) }}" class="text-lg font-bold text-orange-600 hover:underline">
                                        {{ $reservation->restaurant->name }}
                                    </a>
                                    <div class="text-sm text-gray-600 mt-1 space-y-0.5">
                                        <p>{{ $reservation->reserved_at->format('Y/m/d (D) H:i') }} 〜 {{ $reservation->end_at->format('H:i') }}</p>
                                        <p>{{ $reservation->seatType->name }} / {{ $reservation->number_of_people }}名</p>
                                    </div>
                                </div>
                                <form action="{{ route('reservations.destroy', $reservation->id) }}" method="POST" onsubmit="return confirm('この予約をキャンセルしますか？');">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="text-sm text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 px-4 py-2 rounded-full font-bold transition">
                                        キャンセル
                                    </button>
                                </form>
                            </div>
                        @endforeach
                    </div>
                    <div class="mt-4">{{ $upcoming->links() }}</div>
                @endif
            </section>

            {{-- 過去の予約 --}}
            <section>
                <h2 class="text-lg font-bold text-gray-800 mb-4 border-l-4 border-gray-400 pl-3">過去の予約</h2>

                @if($past->isEmpty())
                    <div class="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                        過去の予約はありません。
                    </div>
                @else
                    <div class="space-y-4">
                        @foreach($past as $reservation)
                            <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-5 opacity-70">
                                <a href="{{ route('restaurants.show', $reservation->restaurant_id) }}" class="text-lg font-bold text-gray-700 hover:underline">
                                    {{ $reservation->restaurant->name }}
                                </a>
                                <div class="text-sm text-gray-500 mt-1 space-y-0.5">
                                    <p>{{ $reservation->reserved_at->format('Y/m/d (D) H:i') }} 〜 {{ $reservation->end_at->format('H:i') }}</p>
                                    <p>{{ $reservation->seatType->name }} / {{ $reservation->number_of_people }}名</p>
                                </div>
                            </div>
                        @endforeach
                    </div>
                    <div class="mt-4">{{ $past->links() }}</div>
                @endif
            </section>

        </div>
    </main>
</x-app-layout>
