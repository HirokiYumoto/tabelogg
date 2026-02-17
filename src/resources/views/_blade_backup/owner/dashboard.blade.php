<x-app-layout>
    <x-slot name="hideNavigation">true</x-slot>
    <x-site-header />

    <main class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div class="flex justify-between items-center mb-8">
                <h1 class="text-2xl font-bold text-gray-900">
                    {{ $restaurant->name }} 管理画面
                </h1>
                <a href="{{ route('restaurants.show', $restaurant->id) }}" class="text-blue-600 hover:underline font-bold text-sm">
                    店舗ページを見る &rarr;
                </a>
            </div>

            <h2 class="text-xl font-semibold mb-4 text-gray-700">今後の予約一覧</h2>

            @if($reservations->isEmpty())
                <div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                    現在、予約はありません。
                </div>
            @else
                <div class="shadow overflow-hidden border border-gray-200 sm:rounded-lg">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    来店日時
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    お名前
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    席タイプ
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    人数
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    終了予定
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            @foreach ($reservations as $reservation)
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-bold text-gray-900">
                                        {{ $reservation->reserved_at->format('Y/m/d (D)') }}
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        {{ $reservation->reserved_at->format('H:i') }} 〜
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">
                                        {{ $reservation->user->name ?? 'ゲスト' }} 様
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                        {{ $reservation->seatType->type === 'counter' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800' }}">
                                        {{ $reservation->seatType->name }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ $reservation->number_of_people }}名
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ $reservation->end_at->format('H:i') }}
                                </td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                <div class="mt-4">{{ $reservations->links() }}</div>
            @endif

        </div>
    </main>
</x-app-layout>
