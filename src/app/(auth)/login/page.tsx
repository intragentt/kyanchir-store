// Местоположение: src/app/(auth)/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/icons/Logo';
import Link from 'next/link';
import TelegramOfficialIcon from '@/components/icons/TelegramOfficialIcon';
import ClearIcon from '@/components/icons/ClearIcon';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Импортируем новые иконки ---
import { EyeIcon } from '@/components/icons/EyeIcon';
import { EyeOffIcon } from '@/components/icons/EyeOffIcon';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Новые состояния для UX ---
  const [rememberMe, setRememberMe] = useState(true); // "Запомнить меня" включено по умолчанию
  const [showPassword, setShowPassword] = useState(false); // Пароль по умолчанию скрыт
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Логика "Запомнить меня" ---
  useEffect(() => {
    // При загрузке страницы, проверяем, есть ли сохраненный email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      // Убираем галочку, если email был сохранен, но пользователь хочет его забыть
      setRememberMe(true);
    }
  }, []);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Управление localStorage при логине ---
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    try {
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
            className="space-y-4 text-left font-body"
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
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
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
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Поле пароля с "глазом" --- */}
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-16 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Пароль"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {password && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="mr-2"
                      aria-label={
                        showPassword ? 'Скрыть пароль' : 'Показать пароль'
                      }
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPassword('')}
                      aria-label="Очистить поле Пароль"
                    >
                      <ClearIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
            <div className="flex items-center justify-between">
              {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Управляемый чекбокс --- */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-zinc-700"
                >
                  Запомнить меня
                </label>
              </div>
              {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? 'Проверка...' : 'Войти'}
            </button>
            {error && (
              <p className="pt-2 text-center text-xs text-red-600">{error}</p>
            )}
          </form>
          <div className="text-center font-body">
            <Link
              href={
                email
                  ? `/forgot-password?email=${encodeURIComponent(email)}`
                  : '/forgot-password'
              }
              className="text-sm font-semibold text-[#6B80C5] hover:text-opacity-80"
            >
              Забыли пароль?
            </Link>
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
            className="flex w-full items-center justify-center gap-x-2 rounded-md border border-zinc-300 bg-white px-4 py-2 font-body text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <TelegramOfficialIcon className="h-6 w-6" />
            Войти через Telegram
          </button>
        </div>
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 text-center font-body text-sm">
          <p className="text-zinc-600">
            Нет аккаунта?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#6B80C5] hover:text-opacity-80"
            >
              Регистрация
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
