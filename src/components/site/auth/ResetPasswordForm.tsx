// Местоположение: /src/components/auth/ResetPasswordForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ClearIcon } from '@/components/shared/icons';

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
      if (!response.ok) throw new Error(data.error || 'Произошла ошибка');

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
      <div className="space-y-4 text-center font-body">
        {/* ИЗМЕНЕНИЕ: h2 заменен на div */}
        <div className="text-base font-semibold text-green-700">
          Пароль изменён!
        </div>
        <p className="text-sm text-zinc-600">
          Перенаправляем на страницу входа...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left font-body">
      <div className="relative">
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          placeholder="Новый пароль"
          disabled={isLoading}
        />
        {password && (
          <button
            type="button"
            onClick={() => setPassword('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <ClearIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
          </button>
        )}
      </div>
      <div className="relative">
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          placeholder="Подтвердите пароль"
          disabled={isLoading}
        />
        {confirmPassword && (
          <button
            type="button"
            onClick={() => setConfirmPassword('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <ClearIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
      >
        {isLoading ? 'Сохранение...' : 'Сохранить новый пароль'}
      </button>
    </form>
  );
}
