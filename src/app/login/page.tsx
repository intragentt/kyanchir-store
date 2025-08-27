// Местоположение: src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/icons/Logo';
import Link from 'next/link';
import TelegramOfficialIcon from '@/components/icons/TelegramOfficialIcon';
import ClearIcon from '@/components/icons/ClearIcon';

const validateEmail = (email: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('status') === 'registered') {
      setSuccessMessage('Аккаунт успешно создан! Теперь вы можете войти.');
    }
  }, [searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('Все поля обязательны для заполнения.');
      setIsLoading(false);
      return;
    }

    try {
      // --- НАЧАЛО ИЗМЕНЕНИЙ ---
      // Этап 1: Проверяем учетные данные
      const validateRes = await fetch('/api/auth/validate-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!validateRes.ok) {
        const data = await validateRes.json();
        setError(data.error || 'Неверные учетные данные.');
        setIsLoading(false);
        return;
      }

      // Этап 2: Если все верно, отправляем код
      const sendCodeRes = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (sendCodeRes.ok) {
        router.push(`/login/verify-code?email=${encodeURIComponent(email)}`);
      } else {
        setError('Не удалось отправить код подтверждения.');
      }
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    } catch (err) {
      setError('Произошла непредвиденная ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToTelegramBot = () => {
    window.location.href = 'https://t.me/kyanchir_store_bot';
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 pt-20 sm:pt-24">
      <div className="w-full max-w-sm">
        <div className="space-y-5 rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <Link
            href="/"
            className="mx-auto flex h-12 w-auto justify-center text-[#6B80C5] transition-transform hover:scale-105"
          >
            <div className="mt-2 scale-125 transform">
              <Logo />
            </div>
          </Link>
          {successMessage && (
            <p className="pt-2 text-center text-sm text-green-600">
              {successMessage}
            </p>
          )}
          <form
            className="font-body space-y-4 text-left"
            onSubmit={handleLoginSubmit}
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
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Email"
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
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Пароль"
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setPassword('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  aria-label="Очистить поле Пароль"
                >
                  <ClearIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-zinc-700"
                >
                  Запомнить меня
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="hover:bg-opacity-90 w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? 'Проверка...' : 'Войти'}
            </button>
            {error && (
              <p className="pt-2 text-center text-xs text-red-600">{error}</p>
            )}
          </form>
          <div className="font-body text-center">
            <a
              href="#"
              className="hover:text-opacity-80 text-sm font-semibold text-[#6B80C5]"
            >
              Забыли пароль?
            </a>
          </div>
          <div className="flex items-center gap-x-3">
            <div className="h-px w-full bg-zinc-200" />
            <div className="font-body text-sm font-medium text-zinc-400">
              ИЛИ
            </div>
            <div className="h-px w-full bg-zinc-200" />
          </div>
          <button
            onClick={redirectToTelegramBot}
            className="font-body flex w-full items-center justify-center gap-x-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <TelegramOfficialIcon className="h-6 w-6" />
            Войти через Telegram
          </button>
        </div>
        <div className="font-body mt-6 rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm">
          <p className="text-zinc-600">
            Нет аккаунта?{' '}
            <Link
              href="/register"
              className="hover:text-opacity-80 font-semibold text-[#6B80C5]"
            >
              Регистрация
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
