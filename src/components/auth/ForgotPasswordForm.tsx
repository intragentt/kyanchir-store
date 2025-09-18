// Местоположение: /src/components/auth/ForgotPasswordForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Пожалуйста, введите ваш email.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Отправляем ссылку для сброса...');

    try {
      // API, который мы создадим на следующем шаге
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Произошла неизвестная ошибка');
      }

      toast.success('Ссылка отправлена! Проверьте вашу почту.', {
        id: toastId,
      });
      setIsSubmitted(true); // Показываем сообщение об успехе
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось отправить ссылку.',
        { id: toastId },
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Если форма успешно отправлена, показываем сообщение
  if (isSubmitted) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Проверьте вашу почту
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Мы отправили вам письмо с инструкциями по восстановлению пароля на
          адрес <span className="font-medium text-gray-900">{email}</span>.
        </p>
        <p className="mt-4 text-xs text-gray-500">
          (Если письмо не пришло, проверьте папку "Спам")
        </p>
      </div>
    );
  }

  // Основная форма
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email адрес
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {isLoading ? 'Отправка...' : 'Отправить ссылку для сброса'}
        </button>
      </div>
    </form>
  );
}
