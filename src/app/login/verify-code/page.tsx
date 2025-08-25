// Местоположение: src/app/login/verify-code/page.tsx
'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Logo from '@/components/icons/Logo';
import Link from 'next/link';

// Обертка для безопасного использования useSearchParams
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
  const [code, setCode] = useState(''); // Единое состояние для всего кода
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const inputRef = useRef<HTMLInputElement>(null); // Ссылка на одно невидимое поле

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Разрешаем только до 6 цифр
    if (/^[0-9]{0,6}$/.test(value)) {
      setCode(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (code.length !== 6) {
      setError('Код должен состоять из 6 цифр.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await signIn('email', {
        email,
        token: code,
        redirect: false, // Мы всегда управляем редиректом вручную
      });

      if (res?.ok && !res.error) {
        // Успех! Перенаправляем в профиль.
        router.push('/profile');
      } else {
        // Неудача! Показываем ошибку на этой же странице.
        setError('Неверный или устаревший код. Попробуйте еще раз.');
        setCode(''); // Очищаем поле для новой попытки
        inputRef.current?.focus(); // Возвращаем фокус на поле
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  // Клик по ячейкам ставит фокус на невидимое поле
  const focusInput = () => {
    inputRef.current?.focus();
  };

  if (!email) {
    // ... (эта часть без изменений)
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
              {/* Невидимое поле для ввода */}
              <input
                ref={inputRef}
                type="tel"
                value={code}
                onChange={handleInputChange}
                className="absolute h-full w-full opacity-0"
                maxLength={6}
                autoFocus
              />
              {/* Видимые ячейки для отображения */}
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`flex h-14 w-12 items-center justify-center rounded-md border text-2xl font-semibold transition-all ${
                    code[index] ? 'border-indigo-500' : 'border-zinc-300'
                  } ${
                    inputRef.current === document.activeElement &&
                    index === code.length
                      ? 'animate-pulse ring-2 ring-indigo-500'
                      : ''
                  } `}
                >
                  {code[index] || ''}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="hover:bg-opacity-90 w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? 'Проверка...' : 'Подтвердить'}
            </button>
            {error && (
              <p className="pt-2 text-center text-xs text-red-600">{error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
