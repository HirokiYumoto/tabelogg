import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerErrors({});
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      } else if (err instanceof AxiosError && err.response?.data?.message) {
        setServerErrors({ email: [err.response.data.message] });
      } else {
        setServerErrors({ email: ['ログインに失敗しました。もう一度お試しください。'] });
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">ログイン</h1>

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

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
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

        {/* Forgot password link */}
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-orange-500 hover:text-orange-600 hover:underline"
          >
            パスワードをお忘れですか？
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-orange-500 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-gray-600">
        アカウントをお持ちでないですか？{' '}
        <Link to="/register" className="text-orange-500 hover:text-orange-600 hover:underline font-medium">
          新規登録
        </Link>
      </p>
    </div>
  );
}
