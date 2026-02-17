import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getRestaurant, updateRestaurant, getPrefectures } from '@/api/restaurants';
import Spinner from '@/components/ui/Spinner';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土', '毎日'];

const STAY_MINUTES_OPTIONS = [30, 60, 90, 120];

const restaurantSchema = z.object({
  name: z.string().min(1, '店舗名を入力してください').max(255, '店舗名は255文字以内で入力してください'),
  description: z.string().min(1, '説明を入力してください'),
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
        name: z.string().min(1, '座席名を入力してください'),
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

export default function RestaurantEditPage() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: number; image_path: string }[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => getRestaurant(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: prefectures, isLoading: prefLoading } = useQuery({
    queryKey: ['prefectures'],
    queryFn: getPrefectures,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      prefecture_id: '',
      city_id: '',
      address: '',
      nearest_station: '',
      menu_info: '',
      max_party_size: '',
      seat_types: [],
      time_settings: [],
    },
  });

  // Populate form when restaurant data loads
  useEffect(() => {
    if (restaurant) {
      setExistingImages(restaurant.images);
      reset({
        name: restaurant.name,
        description: restaurant.description,
        prefecture_id: restaurant.city?.prefecture?.id ? String(restaurant.city.prefecture.id) : '',
        city_id: restaurant.city?.id ? String(restaurant.city.id) : '',
        address: restaurant.address,
        nearest_station: restaurant.nearest_station ?? '',
        menu_info: restaurant.menu_info ?? '',
        max_party_size: restaurant.max_party_size !== null ? String(restaurant.max_party_size) : '',
        seat_types: restaurant.seat_types.map((s) => ({
          type: s.type,
          name: s.name,
          seats_per_unit: s.seats_per_unit,
          capacity: s.capacity,
        })),
        time_settings: restaurant.time_settings.map((t) => ({
          day_of_week: t.day_of_week,
          start_time: t.start_time.slice(0, 5),
          end_time: t.end_time.slice(0, 5),
          stay_minutes: t.stay_minutes,
        })),
      });
    }
  }, [restaurant, reset]);

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

  const cities = useMemo(() => {
    if (!prefectures || !selectedPrefectureId) return [];
    const pref = prefectures.find((p) => p.id === Number(selectedPrefectureId));
    return pref?.cities ?? [];
  }, [prefectures, selectedPrefectureId]);

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

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setDeletedImageIds((prev) => [...prev, imageId]);
  };

  const onSubmit = async (data: RestaurantFormData) => {
    try {
      setIsSubmittingForm(true);
      setServerErrors({});

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('city_id', data.city_id);
      formData.append('address', data.address);
      if (data.nearest_station) formData.append('nearest_station', data.nearest_station);
      if (data.menu_info) formData.append('menu_info', data.menu_info);
      if (data.max_party_size) formData.append('max_party_size', data.max_party_size);

      data.seat_types.forEach((seat, i) => {
        formData.append(`seat_types[${i}][type]`, seat.type);
        formData.append(`seat_types[${i}][name]`, seat.name);
        formData.append(`seat_types[${i}][seats_per_unit]`, String(seat.seats_per_unit));
        formData.append(`seat_types[${i}][capacity]`, String(seat.capacity));
      });

      data.time_settings.forEach((ts, i) => {
        formData.append(`time_settings[${i}][day_of_week]`, String(ts.day_of_week));
        formData.append(`time_settings[${i}][start_time]`, ts.start_time);
        formData.append(`time_settings[${i}][end_time]`, ts.end_time);
        formData.append(`time_settings[${i}][stay_minutes]`, String(ts.stay_minutes));
      });

      deletedImageIds.forEach((imgId) => {
        formData.append('delete_image_ids[]', String(imgId));
      });

      imageFiles.forEach((file) => {
        formData.append('images[]', file);
      });

      const result = await updateRestaurant(restaurantId, formData);
      navigate(`/restaurants/${result.id}`);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      } else {
        setServerErrors({ name: ['店舗情報の更新に失敗しました。もう一度お試しください。'] });
      }
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (restaurantLoading || prefLoading) {
    return <Spinner className="py-20" />;
  }

  if (!restaurant) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <p className="text-gray-500">店舗が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">店舗情報を編集</h1>

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

          {/* Prefecture / City cascade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prefecture_id" className="block text-sm font-medium text-gray-700 mb-1">
                都道府県 <span className="text-red-500">*</span>
              </label>
              <select
                id="prefecture_id"
                {...register('prefecture_id')}
                className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                  errors.prefecture_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                {prefectures?.map((pref) => (
                  <option key={pref.id} value={pref.id}>
                    {pref.name}
                  </option>
                ))}
              </select>
              {errors.prefecture_id && (
                <p className="mt-1 text-sm text-red-600">{errors.prefecture_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="city_id" className="block text-sm font-medium text-gray-700 mb-1">
                市区町村 <span className="text-red-500">*</span>
              </label>
              <select
                id="city_id"
                {...register('city_id')}
                disabled={!selectedPrefectureId}
                className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.city_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
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
              onClick={() => appendSeat({ type: 'table', name: '', seats_per_unit: 4, capacity: 1 })}
              className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
            >
              + 追加
            </button>
          </div>
          {errors.seat_types?.root && (
            <p className="mb-3 text-sm text-red-600">{errors.seat_types.root.message}</p>
          )}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">座席名</label>
                    <input
                      type="text"
                      {...register(`seat_types.${index}.name`)}
                      placeholder="例: テーブル席A"
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                        errors.seat_types?.[index]?.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.seat_types?.[index]?.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.seat_types[index].name?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">1席あたりの人数</label>
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
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">席数</label>
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

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">登録済みの画像</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={`/storage/${img.image_path}`}
                      alt="店舗画像"
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新しい画像を追加
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
                    onClick={() => removeNewImage(index)}
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
            {isSubmittingForm ? '更新中...' : '店舗情報を更新する'}
          </button>
        </div>
      </form>
    </div>
  );
}
