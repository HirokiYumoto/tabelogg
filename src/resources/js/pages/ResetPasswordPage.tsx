import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { resetPassword } from '@/api/auth';

const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, 'メールアドレスを入力してください')
      .email('有効なメールアドレスを入力してください'),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください'),
    password_confirmation: z
      .string()
      .min(1, 'パスワード（確認）を入力してください'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'パスワードが一致しません',
    path: ['password_confirmation'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const emailFromQuery = searchParams.get('email') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromQuery,
      password: '',
      password_confirmation: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerErrors({ email: ['無効なリセットトークンです。'] });
      return;
    }

    try {
      setServerErrors({});
      await resetPassword({
        token,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      navigate('/login', { state: { message: 'パスワードがリセットされました。新しいパスワードでログインしてください。' } });
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      } else if (err instanceof AxiosError && err.response?.data?.message) {
        setServerErrors({ email: [err.response.data.message] });
      } else {
        setServerErrors({ email: ['パスワードリセットに失敗しました。もう一度お試しください。'] });
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">パスワードリセット</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 ${
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

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            新しいパスワード
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
              errors.password || serverErrors.password ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
          {serverErrors.password?.map((msg, i) => (
            <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
          ))}
        </div>

        {/* Password Confirmation */}
        <div>
          <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
            新しいパスワード（確認）
          </label>
          <input
            id="password_confirmation"
            type="password"
            autoComplete="new-password"
            {...register('password_confirmation')}
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
              errors.password_confirmation || serverErrors.password_confirmation
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          {errors.password_confirmation && (
            <p className="mt-1 text-sm text-red-600">{errors.password_confirmation.message}</p>
          )}
          {serverErrors.password_confirmation?.map((msg, i) => (
            <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-orange-500 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'リセット中...' : 'パスワードをリセット'}
        </button>
      </form>

      {/* Back to login */}
      <p className="mt-6 text-center text-sm text-gray-600">
        <Link to="/login" className="text-orange-500 hover:text-orange-600 hover:underline font-medium">
          ログインに戻る
        </Link>
      </p>
    </div>
  );
}
