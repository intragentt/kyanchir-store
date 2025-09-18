// Местоположение: /src/components/auth/ForgotPasswordForm.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ClearIcon from '@/components/icons/ClearIcon'; // Импортируем иконку

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: "Подхватываем" email из URL ---
  useEffect(() => {
    const emailFromParams = searchParams.get('email');
    if (emailFromParams) {
      setEmail(emailFromParams);
    }
  }, [searchParams]);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Пожалуйста, введите ваш email.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Отправляем ссылку для сброса...');

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Произошла неизвестная ошибка');
      }

      toast.success('Ссылка отправлена! Проверьте вашу почту.', {
        id: toastId,
      });
      setIsSubmitted(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось отправить ссылку.',
        { id: toastId },
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Редизайн сообщения об успехе ---
  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center font-body">
        <h2 className="text-base font-semibold text-zinc-800">
          Проверьте вашу почту
        </h2>
        <p className="text-sm text-zinc-600">
          Мы отправили письмо с инструкциями на адрес{' '}
          <span className="font-medium text-zinc-900">{email}</span>.
        </p>
      </div>
    );
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Полный редизайн формы ---
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 text-left font-body"
      noValidate
    >
      <div className="relative">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          placeholder="Email"
          disabled={isLoading}
        />
        {email && (
          <button
            type="button"
            onClick={() => setEmail('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            aria-label="Очистить поле Email"
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
        {isLoading ? 'Отправка...' : 'Отправить ссылку'}
      </button>
    </form>
  );
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}
