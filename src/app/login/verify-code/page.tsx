// Местоположение: src/app/login/verify-code/page.tsx
'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Logo from '@/components/icons/Logo';
import Link from 'next/link';

// Обернем основной компонент в Suspense, чтобы безопасно использовать useSearchParams
export default function VerifyCodePageWrapper() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <VerifyCodePage />
    </Suspense>
  );
}

function VerifyCodePage() {
  const [code, setCode] = useState(new Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const { value } = e.target;
    if (!/^[0-9]$/.test(value) && value !== '') return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const finalCode = code.join('');

    if (finalCode.length !== 6) {
      setError('Код должен состоять из 6 цифр.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await signIn('email', {
        email,
        token: finalCode, // Отправляем код как токен
        redirect: false,
        callbackUrl: '/profile',
      });

      if (res?.ok && !res.error) {
        // Успешный вход, перенаправляем. Убедимся, что res.url не null.
        router.push(res.url || '/profile');
      } else {
        setError('Неверный или устаревший код. Попробуйте еще раз.');
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="flex justify-center gap-x-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
                  // Исправляем типизацию ref
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="h-14 w-12 rounded-md border border-zinc-300 bg-zinc-50 text-center text-2xl font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || code.join('').length !== 6}
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
