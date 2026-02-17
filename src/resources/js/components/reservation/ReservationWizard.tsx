import { useReducer, useMemo, useCallback } from 'react';
import { AxiosError } from 'axios';
import type { RestaurantDetail } from '@/types/restaurant';
import type { AvailableSeat } from '@/types/reservation';
import {
  useAvailableDates,
  useAvailableTimes,
  useAvailableSeats,
  useStoreReservation,
} from '@/hooks/useReservations';
import Spinner from '@/components/ui/Spinner';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  people: number;
  date: string;
  time: string;
  seatCategory: string;
  seatLabel: string;
  stayMinutes: number;
}

type WizardAction =
  | { type: 'SET_PEOPLE'; payload: number }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_TIME'; payload: string }
  | { type: 'SET_SEAT'; payload: { category: string; label: string; stayMinutes: number } }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: WizardState['step'] };

interface Props {
  restaurant: RestaurantDetail;
  onComplete?: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Reducer                                                                   */
/* -------------------------------------------------------------------------- */

const initialState: WizardState = {
  step: 1,
  people: 1,
  date: '',
  time: '',
  seatCategory: '',
  seatLabel: '',
  stayMinutes: 0,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_PEOPLE':
      return { ...state, people: action.payload };
    case 'SET_DATE':
      return { ...state, date: action.payload, time: '', seatCategory: '', seatLabel: '', stayMinutes: 0 };
    case 'SET_TIME':
      return { ...state, time: action.payload, seatCategory: '', seatLabel: '', stayMinutes: 0 };
    case 'SET_SEAT':
      return {
        ...state,
        seatCategory: action.payload.category,
        seatLabel: action.payload.label,
        stayMinutes: action.payload.stayMinutes,
      };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 5) as WizardState['step'] };
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) as WizardState['step'] };
    case 'GO_TO_STEP':
      return { ...state, step: action.payload };
    default:
      return state;
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const STEP_LABELS = ['人数', '日付', '時間', '座席', '確認'] as const;
const DAY_HEADERS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function formatDateJP(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}年${m}月${day}日`;
}

function formatTimeJP(timeStr: string): string {
  // timeStr is "HH:MM" or "HH:MM:SS"
  return timeStr.slice(0, 5);
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* -------------------------------------------------------------------------- */
/*  Step Indicator                                                            */
/* -------------------------------------------------------------------------- */

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : isCompleted
                      ? 'bg-orange-200 text-orange-700'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              <span
                className={`mt-1 text-xs ${
                  isActive ? 'text-orange-600 font-semibold' : isCompleted ? 'text-orange-500' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 ${
                  stepNum < currentStep ? 'bg-orange-300' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1 - People                                                           */
/* -------------------------------------------------------------------------- */

function StepPeople({
  people,
  maxPartySize,
  onChange,
  onNext,
}: {
  people: number;
  maxPartySize: number;
  onChange: (n: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-800">人数を選択</h2>
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={people <= 1}
          onClick={() => onChange(people - 1)}
          className="w-10 h-10 rounded-full border border-gray-300 text-xl font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          -
        </button>
        <span className="text-3xl font-bold text-gray-800 min-w-[3rem] text-center">{people}</span>
        <button
          type="button"
          disabled={people >= maxPartySize}
          onClick={() => onChange(people + 1)}
          className="w-10 h-10 rounded-full border border-gray-300 text-xl font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
        <span className="text-sm text-gray-500">名</span>
      </div>
      <p className="text-xs text-gray-400">最大 {maxPartySize} 名まで</p>
      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-md bg-orange-500 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        次へ
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2 - Date (Calendar)                                                  */
/* -------------------------------------------------------------------------- */

function StepDate({
  restaurantId,
  people,
  selectedDate,
  onSelect,
  onBack,
}: {
  restaurantId: number;
  people: number;
  selectedDate: string;
  onSelect: (date: string) => void;
  onBack: () => void;
}) {
  const now = new Date();
  const [calYear, setCalYear] = useReducerValue(now.getFullYear());
  const [calMonth, setCalMonth] = useReducerValue(now.getMonth() + 1); // 1-indexed

  const { data, isLoading } = useAvailableDates(
    restaurantId,
    { people, year: calYear, month: calMonth },
    true
  );

  const availableSet = useMemo(() => new Set(data?.dates ?? []), [data]);
  const today = todayStr();

  const handlePrevMonth = useCallback(() => {
    if (calMonth === 1) {
      setCalYear(calYear - 1);
      setCalMonth(12);
    } else {
      setCalMonth(calMonth - 1);
    }
  }, [calYear, calMonth, setCalYear, setCalMonth]);

  const handleNextMonth = useCallback(() => {
    if (calMonth === 12) {
      setCalYear(calYear + 1);
      setCalMonth(1);
    } else {
      setCalMonth(calMonth + 1);
    }
  }, [calYear, calMonth, setCalYear, setCalMonth]);

  // Build calendar grid
  const firstDayOfMonth = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const isPrevDisabled = calYear === now.getFullYear() && calMonth <= now.getMonth() + 1;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">日付を選択</h2>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="前の月"
        >
          <ChevronLeft />
        </button>
        <span className="text-base font-semibold text-gray-800">
          {calYear}年{calMonth}月
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded hover:bg-gray-100"
          aria-label="次の月"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500">
        {DAY_HEADERS.map((d, i) => (
          <div
            key={d}
            className={i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : ''}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar body */}
      {isLoading ? (
        <Spinner className="py-12" />
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }
            const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isAvailable = availableSet.has(dateStr);
            const isPast = dateStr < today;
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dayOfWeek = new Date(calYear, calMonth - 1, day).getDay();

            const canClick = isAvailable && !isPast;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={!canClick}
                onClick={() => {
                  if (canClick) onSelect(dateStr);
                }}
                className={`
                  aspect-square flex items-center justify-center rounded-md text-sm transition-colors
                  ${isSelected ? 'bg-orange-500 text-white font-bold' : ''}
                  ${!isSelected && canClick ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium cursor-pointer' : ''}
                  ${!canClick && !isSelected ? 'text-gray-300 cursor-not-allowed' : ''}
                  ${isToday && !isSelected ? 'ring-2 ring-orange-400' : ''}
                  ${dayOfWeek === 0 && canClick && !isSelected ? 'text-red-500' : ''}
                  ${dayOfWeek === 6 && canClick && !isSelected ? 'text-blue-500' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      )}

      {data?.error && (
        <p className="text-sm text-red-600">{data.error}</p>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        戻る
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 3 - Time                                                             */
/* -------------------------------------------------------------------------- */

function StepTime({
  restaurantId,
  people,
  date,
  onSelect,
  onBack,
}: {
  restaurantId: number;
  people: number;
  date: string;
  onSelect: (time: string) => void;
  onBack: () => void;
}) {
  const { data, isLoading } = useAvailableTimes(restaurantId, { people, date }, true);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">時間を選択</h2>
      <p className="text-sm text-gray-500">{formatDateJP(date)}</p>

      {isLoading ? (
        <Spinner className="py-12" />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {data?.times.map(({ time, available }) => (
            <button
              key={time}
              type="button"
              disabled={!available}
              onClick={() => {
                if (available) onSelect(time);
              }}
              className={`
                rounded-md py-2.5 text-sm font-medium transition-colors
                ${available
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
            >
              {formatTimeJP(time)}
            </button>
          ))}
        </div>
      )}

      {data?.times.length === 0 && !isLoading && (
        <p className="text-sm text-gray-500 text-center py-4">
          利用可能な時間帯がありません。別の日付をお試しください。
        </p>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        戻る
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 4 - Seat                                                             */
/* -------------------------------------------------------------------------- */

function StepSeat({
  restaurantId,
  people,
  date,
  time,
  onSelect,
  onBack,
}: {
  restaurantId: number;
  people: number;
  date: string;
  time: string;
  onSelect: (seat: AvailableSeat, stayMinutes: number) => void;
  onBack: () => void;
}) {
  const { data, isLoading } = useAvailableSeats(restaurantId, { people, date, time }, true);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">座席を選択</h2>
      <p className="text-sm text-gray-500">
        {formatDateJP(date)} {formatTimeJP(time)}
      </p>

      {isLoading ? (
        <Spinner className="py-12" />
      ) : (
        <div className="space-y-2">
          {data?.seats.map((seat) => (
            <button
              key={seat.value}
              type="button"
              onClick={() => onSelect(seat, data.stay_minutes)}
              className="w-full rounded-lg border border-gray-200 p-4 text-left hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <div className="font-medium text-gray-800">{seat.label}</div>
              <div className="text-xs text-gray-500 mt-1">{seat.hint}</div>
            </button>
          ))}
        </div>
      )}

      {data?.seats.length === 0 && !isLoading && (
        <p className="text-sm text-gray-500 text-center py-4">
          利用可能な座席がありません。別の時間をお試しください。
        </p>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        戻る
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 5 - Confirmation                                                     */
/* -------------------------------------------------------------------------- */

function StepConfirm({
  state,
  restaurantName,
  isSubmitting,
  isSuccess,
  error,
  onSubmit,
  onBack,
}: {
  state: WizardState;
  restaurantName: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}) {
  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800">予約が確定しました</h2>
        <p className="text-sm text-gray-600">
          {restaurantName}への予約が完了しました。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">予約内容の確認</h2>

      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        <SummaryRow label="店舗" value={restaurantName} />
        <SummaryRow label="人数" value={`${state.people}名`} />
        <SummaryRow label="日付" value={formatDateJP(state.date)} />
        <SummaryRow label="時間" value={formatTimeJP(state.time)} />
        <SummaryRow label="座席" value={state.seatLabel} />
        <SummaryRow label="滞在時間" value={`${state.stayMinutes}分`} />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full rounded-md bg-orange-500 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '予約処理中...' : '予約を確定'}
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        className="w-full rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
      >
        戻る
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small utility hooks / icons                                               */
/* -------------------------------------------------------------------------- */

function useReducerValue<T>(initial: T): [T, (v: T) => void] {
  const [val, setVal] = useReducer((_: T, next: T) => next, initial);
  return [val, setVal];
}

function ChevronLeft() {
  return (
    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export default function ReservationWizard({ restaurant, onComplete }: Props) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const mutation = useStoreReservation();

  const maxPartySize = restaurant.max_party_size ?? 99;

  const handleSubmit = async () => {
    try {
      await mutation.mutateAsync({
        restaurantId: restaurant.id,
        params: {
          seat_category: state.seatCategory,
          reservation_date: state.date,
          reservation_time: state.time,
          number_of_people: state.people,
        },
      });
      onComplete?.();
    } catch {
      // error is handled via mutation.error
    }
  };

  const errorMessage = useMemo(() => {
    if (!mutation.error) return null;
    const err = mutation.error;
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      if (status === 422) {
        const data = err.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
        if (data?.errors) {
          return Object.values(data.errors).flat().join(' ');
        }
        return data?.message ?? '入力内容にエラーがあります。';
      }
      return err.response?.data?.message ?? '予約に失敗しました。もう一度お試しください。';
    }
    return '予約に失敗しました。もう一度お試しください。';
  }, [mutation.error]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <StepIndicator currentStep={state.step} />

      {state.step === 1 && (
        <StepPeople
          people={state.people}
          maxPartySize={maxPartySize}
          onChange={(n) => dispatch({ type: 'SET_PEOPLE', payload: n })}
          onNext={() => dispatch({ type: 'NEXT_STEP' })}
        />
      )}

      {state.step === 2 && (
        <StepDate
          restaurantId={restaurant.id}
          people={state.people}
          selectedDate={state.date}
          onSelect={(date) => {
            dispatch({ type: 'SET_DATE', payload: date });
            dispatch({ type: 'NEXT_STEP' });
          }}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}

      {state.step === 3 && (
        <StepTime
          restaurantId={restaurant.id}
          people={state.people}
          date={state.date}
          onSelect={(time) => {
            dispatch({ type: 'SET_TIME', payload: time });
            dispatch({ type: 'NEXT_STEP' });
          }}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}

      {state.step === 4 && (
        <StepSeat
          restaurantId={restaurant.id}
          people={state.people}
          date={state.date}
          time={state.time}
          onSelect={(seat, stayMinutes) => {
            dispatch({
              type: 'SET_SEAT',
              payload: { category: seat.value, label: seat.label, stayMinutes },
            });
            dispatch({ type: 'NEXT_STEP' });
          }}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}

      {state.step === 5 && (
        <StepConfirm
          state={state}
          restaurantName={restaurant.name}
          isSubmitting={mutation.isPending}
          isSuccess={mutation.isSuccess}
          error={errorMessage}
          onSubmit={handleSubmit}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}
    </div>
  );
}
