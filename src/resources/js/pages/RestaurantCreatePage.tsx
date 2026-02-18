import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storeRestaurant, getPrefectures, getCities, lookupPostalCode, resolveCity, reversePostalCode } from '@/api/restaurants';
import Spinner from '@/components/ui/Spinner';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { Prefecture } from '@/types/restaurant';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土', '毎日'];

const STAY_MINUTES_OPTIONS = [30, 60, 90, 120];

const restaurantSchema = z.object({
  name: z.string().min(1, '店舗名を入力してください').max(255, '店舗名は255文字以内で入力してください'),
  description: z.string().min(1, '説明を入力してください'),
  postal_code: z.string().regex(/^\d{7}$/, '7桁の数字で入力してください'),
  prefecture_id: z.string().min(1, '都道府県を選択してください'),
  city_id: z.string().min(1, '市区町村を選択してください'),
  address: z.string().min(1, '住所を入力してください').max(255, '住所は255文字以内で入力してください'),
  nearest_station: z.string().max(255, '最寄り駅は255文字以内で入力してください').optional().or(z.literal('')),
  menu_info: z.string().optional().or(z.literal('')),
  max_party_size: z.string().optional().or(z.literal('')),
  seat_types: z
    .array(
      z.object({
        type: z.enum(['counter', 'table'], { error: '座席タイプを選択してください' }),
        seats_per_unit: z.coerce.number().min(1, '1以上を入力してください'),
        capacity: z.coerce.number().min(1, '1以上を入力してください'),
      })
    )
    .min(1, '座席タイプを1つ以上追加してください'),
  time_settings: z
    .array(
      z.object({
        day_of_week: z.coerce.number().min(0).max(7),
        start_time: z.string().min(1, '開始時刻を入力してください'),
        end_time: z.string().min(1, '終了時刻を入力してください'),
        stay_minutes: z.coerce.number().min(30, '滞在時間を選択してください'),
      })
    )
    .min(1, '営業時間を1つ以上追加してください'),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

export default function RestaurantCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [postalLoading, setPostalLoading] = useState(false);
  const [reversePostalLoading, setReversePostalLoading] = useState(false);
  const [postalError, setPostalError] = useState('');
  const [pendingCityId, setPendingCityId] = useState<string | null>(null);

  const { data: prefectures, isLoading: prefLoading } = useQuery({
    queryKey: ['prefectures'],
    queryFn: getPrefectures,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      postal_code: '',
      prefecture_id: '',
      city_id: '',
      address: '',
      nearest_station: '',
      menu_info: '',
      max_party_size: '',
      seat_types: [{ type: 'table', seats_per_unit: 4, capacity: 1 }],
      time_settings: [{ day_of_week: 7, start_time: '11:00', end_time: '22:00', stay_minutes: 60 }],
    },
  });

  const {
    fields: seatFields,
    append: appendSeat,
    remove: removeSeat,
  } = useFieldArray({ control, name: 'seat_types' });

  const {
    fields: timeFields,
    append: appendTime,
    remove: removeTime,
  } = useFieldArray({ control, name: 'time_settings' });

  const selectedPrefectureId = watch('prefecture_id');

  const { data: cities = [] } = useQuery({
    queryKey: ['cities', selectedPrefectureId],
    queryFn: () => getCities(Number(selectedPrefectureId)),
    enabled: !!selectedPrefectureId,
    staleTime: 10 * 60 * 1000,
  });

  // Apply pending city selection once cities are loaded
  useEffect(() => {
    if (pendingCityId && cities.length > 0 && cities.some((c) => String(c.id) === pendingCityId)) {
      setValue('city_id', pendingCityId);
      setPendingCityId(null);
    }
  }, [cities, pendingCityId, setValue]);

  const handlePostalLookup = async () => {
    const code = watch('postal_code');
    if (!code || !/^\d{7}$/.test(code)) {
      setPostalError('7桁の数字で入力してください');
      return;
    }
    setPostalLoading(true);
    setPostalError('');
    try {
      const result = await lookupPostalCode(code);
      if (!result) {
        setPostalError('該当する住所が見つかりませんでした');
        return;
      }
      // Find matching prefecture
      const matchedPref = prefectures?.find((p: Prefecture) => p.name === result.prefecture);
      if (!matchedPref) {
        setPostalError('都道府県のマッチに失敗しました');
        return;
      }
      // Resolve city (create if not exists)
      const city = await resolveCity(matchedPref.id, result.city);
      // Pre-populate cities cache so the select has the option immediately
      const citiesKey = ['cities', String(matchedPref.id)];
      const cached = queryClient.getQueryData<{ id: number; name: string; prefecture_id: number }[]>(citiesKey);
      if (cached) {
        if (!cached.some((c) => c.id === city.id)) {
          queryClient.setQueryData(citiesKey, [...cached, { id: city.id, name: city.name, prefecture_id: city.prefecture_id }]);
        }
      } else {
        queryClient.setQueryData(citiesKey, [{ id: city.id, name: city.name, prefecture_id: city.prefecture_id }]);
      }
      setValue('prefecture_id', String(matchedPref.id));
      setPendingCityId(String(city.id));
      setValue('address', result.town);
    } catch {
      setPostalError('住所の検索に失敗しました');
    } finally {
      setPostalLoading(false);
    }
  };

  const handleReversePostalLookup = async () => {
    const prefId = watch('prefecture_id');
    const cId = watch('city_id');
    const addr = watch('address');
    if (!prefId || !cId) {
      setPostalError('都道府県と市区町村を先に選択してください');
      return;
    }
    setReversePostalLoading(true);
    setPostalError('');
    try {
      const code = await reversePostalCode(Number(prefId), Number(cId), addr || '');
      if (code) {
        setValue('postal_code', code, { shouldValidate: true });
      } else {
        setPostalError('該当する郵便番号が見つかりませんでした');
      }
    } catch {
      setPostalError('郵便番号の検索に失敗しました');
    } finally {
      setReversePostalLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: RestaurantFormData) => {
    try {
      setIsSubmittingForm(true);
      setServerErrors({});

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('city_id', data.city_id);
      formData.append('postal_code', data.postal_code);
      formData.append('address', data.address);
      if (data.nearest_station) formData.append('nearest_station', data.nearest_station);
      if (data.menu_info) formData.append('menu_info', data.menu_info);
      if (data.max_party_size) formData.append('max_party_size', data.max_party_size);

      data.seat_types.forEach((seat, i) => {
        formData.append(`seat_types[${i}][type]`, seat.type);
        formData.append(`seat_types[${i}][seats_per_unit]`, String(seat.type === 'counter' ? 1 : seat.seats_per_unit));
        formData.append(`seat_types[${i}][capacity]`, String(seat.capacity));
      });

      data.time_settings.forEach((ts, i) => {
        formData.append(`time_settings[${i}][day_of_week]`, String(ts.day_of_week));
        formData.append(`time_settings[${i}][start_time]`, ts.start_time);
        formData.append(`time_settings[${i}][end_time]`, ts.end_time);
        formData.append(`time_settings[${i}][stay_minutes]`, String(ts.stay_minutes));
      });

      imageFiles.forEach((file) => {
        formData.append('images[]', file);
      });

      const result = await storeRestaurant(formData);

      // Optimistic update: add to dashboard owned_restaurants
      queryClient.setQueryData<import('@/api/dashboard').DashboardData>(['dashboard'], (old) => {
        if (!old) return old;
        const newRestaurant: import('@/api/dashboard').OwnedRestaurant = {
          id: result.id,
          name: result.name,
          image: result.images?.[0] ? `/storage/${result.images[0].image_path}` : null,
          city: result.city ? {
            name: result.city.name,
            prefecture: result.city.prefecture ? { name: result.city.prefecture.name } : null,
          } : null,
        };
        return {
          ...old,
          owned_restaurants: [...(old.owned_restaurants ?? []), newRestaurant],
        };
      });

      // Invalidate restaurant list so it refetches
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });

      navigate(`/restaurants/${result.id}`);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      } else {
        setServerErrors({ name: ['店舗の登録に失敗しました。もう一度お試しください。'] });
      }
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (prefLoading) {
    return <Spinner className="py-20" />;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">店舗登録</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {/* Basic info */}
        <div className="bg-white rounded-lg shadow p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">基本情報</h2>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              店舗名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                errors.name || serverErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            {serverErrors.name?.map((msg, i) => (
              <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
            ))}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                errors.description || serverErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            {serverErrors.description?.map((msg, i) => (
              <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
            ))}
          </div>

          {/* Postal code */}
          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
              郵便番号 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="postal_code"
                type="text"
                maxLength={7}
                placeholder="1000001"
                {...register('postal_code')}
                className={`w-40 rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                  errors.postal_code || serverErrors.postal_code ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={handlePostalLookup}
                disabled={postalLoading}
                className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {postalLoading ? '検索中...' : '住所を検索'}
              </button>
              <button
                type="button"
                onClick={handleReversePostalLookup}
                disabled={reversePostalLoading}
                className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reversePostalLoading ? '検索中...' : '住所から逆引き'}
              </button>
            </div>
            {errors.postal_code && <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>}
            {serverErrors.postal_code?.map((msg, i) => (
              <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
            ))}
            {postalError && <p className="mt-1 text-sm text-red-600">{postalError}</p>}
          </div>

          {/* Prefecture / City cascade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                都道府県 <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                value={watch('prefecture_id')}
                onChange={(val) => {
                  setValue('prefecture_id', val, { shouldValidate: true });
                  setValue('city_id', '');
                }}
                placeholder="選択してください"
                error={!!errors.prefecture_id}
                options={
                  prefectures?.map((pref) => ({
                    value: String(pref.id),
                    label: pref.name,
                    reading: pref.reading,
                  })) ?? []
                }
              />
              {errors.prefecture_id && (
                <p className="mt-1 text-sm text-red-600">{errors.prefecture_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                市区町村 <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                value={watch('city_id')}
                onChange={(val) => setValue('city_id', val, { shouldValidate: true })}
                placeholder="選択してください"
                disabled={!selectedPrefectureId}
                error={!!errors.city_id}
                options={
                  cities.map((city) => ({
                    value: String(city.id),
                    label: city.name,
                    reading: city.reading,
                  }))
                }
              />
              {errors.city_id && <p className="mt-1 text-sm text-red-600">{errors.city_id.message}</p>}
              {serverErrors.city_id?.map((msg, i) => (
                <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              住所 <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              type="text"
              {...register('address')}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                errors.address || serverErrors.address ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
            {serverErrors.address?.map((msg, i) => (
              <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
            ))}
          </div>

          {/* Nearest station */}
          <div>
            <label htmlFor="nearest_station" className="block text-sm font-medium text-gray-700 mb-1">
              最寄り駅
            </label>
            <input
              id="nearest_station"
              type="text"
              {...register('nearest_station')}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                errors.nearest_station || serverErrors.nearest_station ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.nearest_station && (
              <p className="mt-1 text-sm text-red-600">{errors.nearest_station.message}</p>
            )}
          </div>

          {/* Menu info */}
          <div>
            <label htmlFor="menu_info" className="block text-sm font-medium text-gray-700 mb-1">
              メニュー情報
            </label>
            <textarea
              id="menu_info"
              rows={3}
              {...register('menu_info')}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                errors.menu_info || serverErrors.menu_info ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.menu_info && <p className="mt-1 text-sm text-red-600">{errors.menu_info.message}</p>}
          </div>

          {/* Max party size */}
          <div>
            <label htmlFor="max_party_size" className="block text-sm font-medium text-gray-700 mb-1">
              最大予約人数
            </label>
            <input
              id="max_party_size"
              type="number"
              min={1}
              {...register('max_party_size')}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                errors.max_party_size || serverErrors.max_party_size ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.max_party_size && (
              <p className="mt-1 text-sm text-red-600">{errors.max_party_size.message}</p>
            )}
          </div>
        </div>

        {/* Seat types */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">座席タイプ</h2>
            <button
              type="button"
              onClick={() => appendSeat({ type: 'table', seats_per_unit: 4, capacity: 1 })}
              className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
            >
              + 追加
            </button>
          </div>
          {errors.seat_types?.root && (
            <p className="mb-3 text-sm text-red-600">{errors.seat_types.root.message}</p>
          )}
          {serverErrors.seat_types?.map((msg, i) => (
            <p key={i} className="mb-3 text-sm text-red-600">{msg}</p>
          ))}

          <div className="space-y-4">
            {seatFields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-600">座席 {index + 1}</span>
                  {seatFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSeat(index)}
                      className="text-red-500 hover:text-red-600 text-xs font-medium"
                    >
                      削除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">タイプ</label>
                    <select
                      {...register(`seat_types.${index}.type`)}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                        errors.seat_types?.[index]?.type ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="counter">カウンター</option>
                      <option value="table">テーブル</option>
                    </select>
                    {errors.seat_types?.[index]?.type && (
                      <p className="mt-1 text-xs text-red-600">{errors.seat_types[index].type?.message}</p>
                    )}
                  </div>
                  {watch(`seat_types.${index}.type`) === 'table' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">何人掛け</label>
                      <input
                        type="number"
                        min={1}
                        {...register(`seat_types.${index}.seats_per_unit`)}
                        className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                          errors.seat_types?.[index]?.seats_per_unit ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.seat_types?.[index]?.seats_per_unit && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.seat_types[index].seats_per_unit?.message}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {watch(`seat_types.${index}.type`) === 'counter' ? '席数' : '卓数'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      {...register(`seat_types.${index}.capacity`)}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                        errors.seat_types?.[index]?.capacity ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.seat_types?.[index]?.capacity && (
                      <p className="mt-1 text-xs text-red-600">{errors.seat_types[index].capacity?.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">営業時間</h2>
            <button
              type="button"
              onClick={() =>
                appendTime({ day_of_week: 7, start_time: '11:00', end_time: '22:00', stay_minutes: 60 })
              }
              className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
            >
              + 追加
            </button>
          </div>
          {errors.time_settings?.root && (
            <p className="mb-3 text-sm text-red-600">{errors.time_settings.root.message}</p>
          )}
          {serverErrors.time_settings?.map((msg, i) => (
            <p key={i} className="mb-3 text-sm text-red-600">{msg}</p>
          ))}

          <div className="space-y-4">
            {timeFields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-600">時間帯 {index + 1}</span>
                  {timeFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTime(index)}
                      className="text-red-500 hover:text-red-600 text-xs font-medium"
                    >
                      削除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">曜日</label>
                    <select
                      {...register(`time_settings.${index}.day_of_week`)}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                        errors.time_settings?.[index]?.day_of_week ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {DAY_LABELS.map((label, dayIdx) => (
                        <option key={dayIdx} value={dayIdx}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">滞在時間</label>
                    <select
                      {...register(`time_settings.${index}.stay_minutes`)}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                        errors.time_settings?.[index]?.stay_minutes ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {STAY_MINUTES_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}分
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">開始時刻</label>
                    <input
                      type="time"
                      {...register(`time_settings.${index}.start_time`)}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                        errors.time_settings?.[index]?.start_time ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.time_settings?.[index]?.start_time && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.time_settings[index].start_time?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">終了時刻</label>
                    <input
                      type="time"
                      {...register(`time_settings.${index}.end_time`)}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                        errors.time_settings?.[index]?.end_time ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.time_settings?.[index]?.end_time && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.time_settings[index].end_time?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">画像</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              店舗画像をアップロード
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
            />
            {serverErrors.images?.map((msg, i) => (
              <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
            ))}
            {serverErrors['images.0']?.map((msg, i) => (
              <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
            ))}
          </div>

          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {imagePreviews.map((src, index) => (
                <div key={index} className="relative group">
                  <img
                    src={src}
                    alt={`プレビュー ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmittingForm}
            className="rounded-md bg-orange-500 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingForm ? '登録中...' : '店舗を登録する'}
          </button>
        </div>
      </form>
    </div>
  );
}
