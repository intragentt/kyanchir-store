// Местоположение: src/app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- Важный импорт для редиректа

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter(); // <-- Хук для управления навигацией

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // УСПЕХ! Вместо alert() перенаправляем на админ-панель
        router.push('/admin/dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Произошла ошибка.');
      }
    } catch (err) {
      setError('Не удалось подключиться к серверу.');
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !email || !password || isLoading;

  return (
    <main className="bg-background-primary min-h-screen p-4 pt-24">
      <div className="bg-background-primary mx-auto w-full max-w-sm rounded-lg border border-gray-200 p-6">
        <div className="font-body text-body-sm text-text-primary text-center font-semibold">
          Авторизация
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="font-body text-body-sm text-text-primary block font-medium"
            >
              Логин (Email)
            </label>
            {/* VVV--- ИЗМЕНЕНИЕ 2: Добавлен фон bg-gray-50 ---VVV */}
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="focus:border-brand-lilac focus:ring-brand-lilac mt-1 block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-3 sm:text-sm"
              placeholder="admin@kyanchir.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="font-body text-body-sm text-text-primary block font-medium"
            >
              Пароль
            </label>
            {/* VVV--- ИЗМЕНЕНИЕ 2: Добавлен фон bg-gray-50 ---VVV */}
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus:border-brand-lilac focus:ring-brand-lilac mt-1 block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-3 sm:text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-body-sm text-feedback-error">{error}</p>}

          <div>
            {/* VVV--- ИЗМЕНЕНИЕ 1: Жирность текста кнопки изменена на font-medium ---VVV */}
            <button
              type="submit"
              disabled={isButtonDisabled}
              className="bg-text-primary text-body-sm hover:bg-text-primary/90 focus:ring-brand-lilac flex w-full justify-center rounded-md border border-transparent px-4 py-2.5 font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Войти'
              )}
            </button>
          </div>
        </form>

        <div className="text-body-sm mt-6 space-y-3 text-center">
          <div>
            <span className="text-gray-500">Нет аккаунта? </span>
            {/* VVV--- ИЗМЕНЕНИЕ 1: Жирность ссылок тоже изменена на font-medium для полной консистентности ---VVV */}
            <Link
              href="#"
              className="text-brand-lilac font-medium hover:underline"
            >
              Регистрация
            </Link>
          </div>
          <div>
            <Link
              href="#"
              className="text-brand-lilac font-medium hover:underline"
            >
              Забыли пароль?
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
