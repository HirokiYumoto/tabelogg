import type { TimeSetting } from '@/types/restaurant';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

export default function BusinessHours({ timeSettings }: { timeSettings: TimeSetting[] }) {
  const byDay = new Map<number, TimeSetting[]>();
  for (const ts of timeSettings) {
    if (ts.day_of_week === 7) {
      for (let d = 0; d <= 6; d++) {
        const list = byDay.get(d) ?? [];
        list.push(ts);
        byDay.set(d, list);
      }
    } else {
      const list = byDay.get(ts.day_of_week) ?? [];
      list.push(ts);
      byDay.set(ts.day_of_week, list);
    }
  }

  for (const list of byDay.values()) {
    list.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const allSame = dayOrder.every((d) => {
    const a = byDay.get(d);
    const b = byDay.get(dayOrder[0]);
    if (!a && !b) return true;
    if (!a || !b || a.length !== b.length) return false;
    return a.every((p, i) => p.start_time === b[i].start_time && p.end_time === b[i].end_time);
  }) && byDay.size > 0;

  if (allSame) {
    const periods = byDay.get(dayOrder[0])!;
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">営業時間</h3>
        <div className="flex items-center text-sm">
          <span className="w-12 font-medium text-gray-700">毎日</span>
          <span className="text-gray-600">
            {periods
              .map((p) => `${p.start_time.slice(0, 5)} - ${p.end_time.slice(0, 5)}`)
              .join('、')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">営業時間</h3>
      <div className="space-y-1">
        {dayOrder.map((day) => {
          const periods = byDay.get(day);
          const dayLabel = DAY_LABELS[day];
          return (
            <div key={day} className="flex items-center text-sm">
              <span
                className={`w-8 font-medium ${
                  day === 0 ? 'text-red-500' : day === 6 ? 'text-blue-500' : 'text-gray-700'
                }`}
              >
                {dayLabel}
              </span>
              {periods && periods.length > 0 ? (
                <span className="text-gray-600">
                  {periods
                    .map((p) => `${p.start_time.slice(0, 5)} - ${p.end_time.slice(0, 5)}`)
                    .join('、')}
                </span>
              ) : (
                <span className="text-gray-400">定休日</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
