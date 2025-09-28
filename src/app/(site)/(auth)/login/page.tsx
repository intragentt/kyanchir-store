'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/icons/Logo';
import Link from 'next/link';
import TelegramOfficialIcon from '@/components/icons/TelegramOfficialIcon';
import ClearIcon from '@/components/icons/ClearIcon';
import { EyeIcon } from '@/components/icons/EyeIcon';
import { EyeOffIcon } from '@/components/icons/EyeOffIcon';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Единое состояние для логики входа по коду ---
  const [isCodeFlowActive, setIsCodeFlowActive] = useState(false);
  const [code, setCode] = useState('');
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('status') === 'registered') {
      setSuccessMessage('Аккаунт успешно создан! Теперь вы можете войти.');
    }
  }, [searchParams]);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Новая логика отправки и проверки кода ---

  // Шаг 1: Отправка кода на email
  const handleSendLoginCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError('Email обязателен для заполнения.');
      setIsLoading(false);
      return;
    }

    // Сохраняем или удаляем email в localStorage
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    try {
      // Вызываем ПРАВИЛЬНЫЙ API-маршрут
      const res = await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось отправить код.');
      }

      // Если код успешно отправлен, переключаемся на форму ввода кода
      setSuccessMessage(`Код отправлен на ${email}`);
      setIsCodeFlowActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  // Шаг 2: Вход с помощью полученного кода (логика из VerificationModal)
  const handleVerifyCodeSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    // ... здесь будет логика проверки кода и входа ...
    alert('Логика проверки кода в разработке. Перенаправляем на главную.');
    router.push('/');
  };

  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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

          {/* --- ИЗМЕНЕНИЕ: Динамически показываем одну из двух форм --- */}
          {!isCodeFlowActive ? (
            // Форма запроса кода
            <form
              className="space-y-4 text-left font-body"
              onSubmit={handleSendLoginCode}
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
                  placeholder="Email для входа"
                />
              </div>
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
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Отправка...' : 'Получить код для входа'}
              </button>
            </form>
          ) : (
            // Форма ввода кода
            <form
              className="space-y-4 text-left font-body"
              onSubmit={handleVerifyCodeSubmit}
              noValidate
            >
              {/* Здесь будет компонент CodeInput, пока простое поле */}
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-значный код"
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 text-center text-base tracking-[8px] placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isLoading || code.length < 6}
                className="w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Проверка...' : 'Войти'}
              </button>
            </form>
          )}

          {error && (
            <p className="pt-2 text-center text-xs text-red-600">{error}</p>
          )}

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
