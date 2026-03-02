import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { forgotPassword } from '@/api/auth';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setServerErrors({});
      setSuccessMessage('');
      const result = await forgotPassword(data.email);
      setSuccessMessage(result.message || 'パスワードリセットリンクを送信しました。メールをご確認ください。');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      } else if (err instanceof AxiosError && err.response?.data?.message) {
        setServerErrors({ email: [err.response.data.message] });
      } else {
        setServerErrors({ email: ['送信に失敗しました。もう一度お試しください。'] });
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">パスワードをお忘れですか？</h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
      </p>

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

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

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-orange-500 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '送信中...' : 'リセットリンクを送信'}
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
