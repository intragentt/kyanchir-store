// Местоположение: /src/components/auth/ResetPasswordForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Пожалуйста, заполните оба поля.');
      return;
    }
    if (password.length < 8) {
      toast.error('Пароль должен содержать не менее 8 символов.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Обновляем ваш пароль...');

    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Произошла неизвестная ошибка');
      }

      toast.success('Пароль успешно изменён!', { id: toastId });
      setIsSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось изменить пароль.',
        { id: toastId },
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-green-700">
          Пароль изменён!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Теперь вы можете войти в свой аккаунт с новым паролем.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Перенаправляем на страницу входа...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Новый пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="••••••••"
          disabled={isLoading}
        />
      </div>
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700"
        >
          Подтвердите новый пароль
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="••••••••"
          disabled={isLoading}
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
        >
          {isLoading ? 'Сохранение...' : 'Сохранить новый пароль'}
        </button>
      </div>
    </form>
  );
}
