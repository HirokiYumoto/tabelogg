import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, '名前を入力してください')
      .max(255, '名前は255文字以内で入力してください'),
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
    register_as_owner: z.preprocess(
      (v) => v === true || v === 'true',
      z.boolean()
    ),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'パスワードが一致しません',
    path: ['password_confirmation'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      register_as_owner: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerErrors({});
      await authRegister(data);
      navigate('/');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      } else if (err instanceof AxiosError && err.response?.data?.message) {
        setServerErrors({ email: [err.response.data.message] });
      } else {
        setServerErrors({ email: ['登録に失敗しました。もう一度お試しください。'] });
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">新規登録</h1>

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

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
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
            パスワード（確認）
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

        {/* Role Selection */}
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">会員種別</span>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="false"
                {...register('register_as_owner')}
                defaultChecked
                className="h-4 w-4 text-orange-500 border-gray-300 focus:ring-orange-400"
              />
              <span className="text-sm text-gray-700">一般ユーザー</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="true"
                {...register('register_as_owner')}
                className="h-4 w-4 text-orange-500 border-gray-300 focus:ring-orange-400"
              />
              <span className="text-sm text-gray-700">店舗代表者</span>
            </label>
          </div>
          {errors.register_as_owner && (
            <p className="mt-1 text-sm text-red-600">{errors.register_as_owner.message}</p>
          )}
          {serverErrors.register_as_owner?.map((msg, i) => (
            <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-orange-500 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '登録中...' : '登録する'}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-gray-600">
        すでにアカウントをお持ちですか？{' '}
        <Link to="/login" className="text-orange-500 hover:text-orange-600 hover:underline font-medium">
          ログイン
        </Link>
      </p>
    </div>
  );
}
