'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ClearIcon, EyeIcon, EyeOffIcon, Logo, TelegramOfficialIcon } from '@/components/shared/icons';
import { LoadingButton, ToastViewport } from '@/components/shared/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // --- ВОССТАНОВЛЕНО: Возвращаем все состояния, как было ---
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const validateEmail = (value: string) => {
    const isValid = /\S+@\S+\.\S+/.test(value);
    console.log('🔄 LoginPage: проверка email', { value, isValid });
    return isValid;
  };

  const validatePassword = (value: string) => {
    const isValid = value.length >= 8;
    console.log('🔄 LoginPage: проверка пароля', { length: value.length, isValid });
    return isValid;
  };

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

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

  useEffect(() => {
    if (isEmailTouched) {
      setEmailError(
        validateEmail(email) ? null : 'Введите корректный email.',
      );
    }
  }, [email, isEmailTouched]);

  useEffect(() => {
    if (isPasswordTouched) {
      setPasswordError(
        validatePassword(password)
          ? null
          : 'Пароль должен содержать минимум 8 символов.',
      );
    }
  }, [password, isPasswordTouched]);

  // --- ВОССТАНОВЛЕНО: Возвращаем оригинальную логику с одним исправлением ---
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    let hasClientError = false;
    if (!validateEmail(email)) {
      setEmailError('Введите корректный email.');
      setIsEmailTouched(true);
      hasClientError = true;
      emailInputRef.current?.focus();
    }

    if (!validatePassword(password)) {
      setPasswordError('Пароль должен содержать минимум 8 символов.');
      setIsPasswordTouched(true);
      if (!hasClientError) {
        passwordInputRef.current?.focus();
      }
      hasClientError = true;
    }

    if (hasClientError) {
      console.log('❌ LoginPage: локальная валидация не пройдена');
      setIsLoading(false);
      return;
    }

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    try {
      // Шаг 1: Проверяем пару email + пароль. Этот шаг остается без изменений.
      const validateRes = await fetch('/api/auth/validate-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!validateRes.ok) {
        const data = await validateRes.json();
        throw new Error(data.error || 'Неверные учетные данные.');
      }

      // Шаг 2: Отправляем код.
      // ИЗМЕНЕНО: Вызываем ПРАВИЛЬНЫЙ API-маршрут, который не требует сессии.
      const sendCodeRes = await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!sendCodeRes.ok) {
        const data = await sendCodeRes.json();
        throw new Error(
          data.error || 'Не удалось отправить код подтверждения.',
        );
      }

      // Если все успешно, перенаправляем на страницу ввода кода.
      router.push(`/login/verify-code?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Произошла непредвиденная ошибка.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramRedirect = useCallback(() => {
    const botUsername =
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'kyanchir_store_bot';
    const deepLink = `https://t.me/${botUsername}`;
    const popup = window.open(deepLink, '_blank', 'noopener,noreferrer');
    if (!popup) {
      window.location.href = deepLink;
    }
  }, []);

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 pt-20 sm:pt-24">
      <ToastViewport />
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
                ref={emailInputRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setIsEmailTouched(true);
                  setEmail(e.target.value);
                }}
                onBlur={() => setIsEmailTouched(true)}
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Email"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
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
              {emailError && (
                <p
                  id="email-error"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {emailError}
                </p>
              )}
            </div>

            <div className="relative">
              <input
                ref={passwordInputRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setIsPasswordTouched(true);
                  setPassword(e.target.value);
                }}
                onBlur={() => setIsPasswordTouched(true)}
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-16 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Пароль"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'password-error' : undefined}
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
              {passwordError && (
                <p
                  id="password-error"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
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
            </div>
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              className="w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              spinnerSrText="Происходит проверка учётных данных"
            >
              Войти
            </LoadingButton>
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
            onClick={handleTelegramRedirect}
            className="flex w-full items-center justify-center gap-x-2 rounded-md border border-zinc-300 bg-white px-4 py-2 font-body text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            <TelegramOfficialIcon className="h-6 w-6" />
            Авторизоваться через телеграмм
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
