import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, updateProfile, deleteProfile } from '@/api/profile';
import Spinner from '@/components/ui/Spinner';

const profileSchema = z.object({
  name: z
    .string()
    .min(1, '名前を入力してください')
    .max(255, '名前は255文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const deleteSchema = z.object({
  password: z.string().min(1, 'パスワードを入力してください'),
});

type DeleteFormData = z.infer<typeof deleteSchema>;

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteServerErrors, setDeleteServerErrors] = useState<Record<string, string[]>>({});
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile ? { name: profile.name, email: profile.email } : undefined,
  });

  const {
    register: registerDelete,
    handleSubmit: handleDeleteSubmit,
    formState: { errors: deleteErrors, isSubmitting: isDeleting },
  } = useForm<DeleteFormData>({
    resolver: zodResolver(deleteSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => updateProfile(data),
    onSuccess: async (updatedUser) => {
      setServerErrors({});
      setSuccessMessage('プロフィールを更新しました。');
      reset({ name: updatedUser.name, email: updatedUser.email });
      await refreshUser();
    },
    onError: (err) => {
      setSuccessMessage('');
      if (err instanceof AxiosError && err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      } else {
        setServerErrors({ name: ['更新に失敗しました。もう一度お試しください。'] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: DeleteFormData) => deleteProfile(data.password),
    onSuccess: () => {
      navigate('/');
      window.location.reload();
    },
    onError: (err) => {
      if (err instanceof AxiosError && err.response?.data?.errors) {
        setDeleteServerErrors(err.response.data.errors);
      } else if (err instanceof AxiosError && err.response?.data?.message) {
        setDeleteServerErrors({ password: [err.response.data.message] });
      } else {
        setDeleteServerErrors({ password: ['アカウントの削除に失敗しました。'] });
      }
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    setSuccessMessage('');
    setServerErrors({});
    updateMutation.mutate(data);
  };

  const onDeleteSubmit = (data: DeleteFormData) => {
    if (!window.confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) return;
    setDeleteServerErrors({});
    deleteMutation.mutate(data);
  };

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">プロフィール設定</h1>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Profile edit form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register('name')}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                errors.name || serverErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
            {serverErrors.name?.map((msg, i) => (
              <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
            ))}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                errors.email || serverErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
            {serverErrors.email?.map((msg, i) => (
              <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? '更新中...' : '更新する'}
          </button>
        </form>
      </div>

      {/* Delete account section */}
      <div className="bg-white rounded-lg shadow p-6 border border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-2">アカウント削除</h2>
        <p className="text-sm text-gray-600 mb-4">
          アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消すことができません。
        </p>

        {!showDeleteSection ? (
          <button
            type="button"
            onClick={() => setShowDeleteSection(true)}
            className="rounded-md bg-red-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            アカウントを削除する
          </button>
        ) : (
          <form onSubmit={handleDeleteSubmit(onDeleteSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="delete-password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワードを入力して確認
              </label>
              <input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                {...registerDelete('password')}
                className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 ${
                  deleteErrors.password || deleteServerErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {deleteErrors.password && (
                <p className="mt-1 text-sm text-red-600">{deleteErrors.password.message}</p>
              )}
              {deleteServerErrors.password?.map((msg, i) => (
                <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isDeleting || deleteMutation.isPending}
                className="rounded-md bg-red-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? '削除中...' : '削除を確定する'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteSection(false);
                  setDeleteServerErrors({});
                }}
                className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
