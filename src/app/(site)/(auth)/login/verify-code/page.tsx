'use client';

import { signIn } from 'next-auth/react';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/shared/icons';

export default function VerifyCodePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Загрузка...
        </div>
      }
    >
      <VerifyCodePage />
    </Suspense>
  );
}

function VerifyCodePage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[0-9]{0,6}$/.test(value)) {
      setCode(value);
    }
  };

  const handleResendCode = async () => {
    if (!email || isLoading || resendCooldown > 0) return;
    setIsLoading(true);
    setError(null);
    try {
      // ИЗМЕНЕНО: Вызываем ПРАВИЛЬНЫЙ API для отправки кода при логине
      await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setCode('');
      setResendCooldown(60);
      setError('Мы отправили новый код на вашу почту.'); // Используем поле error для информационных сообщений
    } catch (err) {
      setError('Не удалось отправить новый код.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью новая, правильная логика входа ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || code.length !== 6) {
      setError('Код должен состоять из 6 цифр.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Шаг 1: Отправляем email и код на наш новый API-маршрут для проверки.
      const verifyRes = await fetch('/api/auth/verify-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: code }),
      });
      const userData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(userData.error || 'Неверный или устаревший код.');
      }

      // Шаг 2: Если код верный, наш API вернул полные данные пользователя.
      // Теперь мы используем специальный провайдер 'credentials',
      // чтобы просто "сказать" next-auth: "Вот данные, создай сессию".
      const signInRes = await signIn('credentials', {
        redirect: false,
        ...userData, // Передаем все данные пользователя, полученные с бэкенда
      });

      if (signInRes?.error) {
        throw new Error(signInRes.error || 'Не удалось создать сессию.');
      }

      if (signInRes?.ok) {
        router.push('/profile'); // Успех! Перенаправляем в профиль.
      } else {
        throw new Error('Произошла неизвестная ошибка при входе.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка.');
      setCode('');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const focusInput = () => inputRef.current?.focus();

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 text-center">
        <div>
          <p>Email не найден. Пожалуйста, вернитесь на страницу входа.</p>
          <Link
            href="/login"
            className="mt-4 inline-block font-bold text-indigo-600"
          >
            Назад
          </Link>
        </div>
      </div>
    );
  }

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

          <div className="font-body">
            <div className="text-xl font-semibold text-zinc-800">
              Введите код подтверждения
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              Мы отправили 6-значный код на{' '}
              <span className="font-bold">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className="relative flex justify-center gap-x-2"
              onClick={focusInput}
            >
              <input
                ref={inputRef}
                type="tel"
                value={code}
                onChange={handleInputChange}
                className="absolute h-full w-full opacity-0"
                maxLength={6}
                autoFocus
              />
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`flex h-14 w-12 items-center justify-center rounded-md border text-2xl font-semibold transition-all ${code[index] ? 'border-indigo-500' : 'border-zinc-300'} ${inputRef.current === document.activeElement && index === code.length ? 'animate-pulse ring-2 ring-indigo-500' : ''}`}
                >
                  {code[index] || ''}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? 'Проверка...' : 'Подтвердить и войти'}
            </button>
            {error && (
              <p className="pt-2 text-center text-xs text-red-600">{error}</p>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading || resendCooldown > 0}
                className="text-xs font-semibold text-[#6B80C5] hover:text-opacity-80 disabled:cursor-not-allowed disabled:text-zinc-400"
              >
                {resendCooldown > 0
                  ? `Отправить снова через ${resendCooldown}с`
                  : 'Отправить код еще раз'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
