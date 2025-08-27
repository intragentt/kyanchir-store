// Местоположение: src/app/login/verify-code/page.tsx
'use client';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// 1. Импортируем "официанта" - функцию signIn из next-auth.
import { signIn } from 'next-auth/react';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/icons/Logo';
import Link from 'next/link';

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
  // Убираем state для attemptsLeft, так как эта логика теперь полностью на сервере
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
    if (!email || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      // Логика переотправки кода остается прежней, так как она связана с другим API
      await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setCode('');
      setResendCooldown(60); // Блокируем кнопку на 60 секунд
      setError('Мы отправили новый код на вашу почту.');
    } catch (err) {
      setError('Не удалось отправить новый код.');
    } finally {
      setIsLoading(false);
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

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // 2. Заменяем старый fetch на вызов signIn.
    try {
      // Мы вызываем нашего "специалиста" с id 'email-code'.
      const result = await signIn('email-code', {
        // Передаем ему "ингредиенты", которые он ожидает.
        email,
        token: code,
        // Говорим ему не перезагружать страницу после ответа. Мы сами решим, что делать.
        redirect: false,
      });

      // 3. Анализируем ответ от "официанта".
      if (result?.error) {
        // Если next-auth вернул ошибку (например, authorize вернул null), показываем ее.
        setError('Неверный или просроченный код. Попробуйте еще раз.');
        setCode(''); // Очищаем поле для новой попытки
        inputRef.current?.focus();
      } else if (result?.ok) {
        // Если все прошло успешно (authorize вернул пользователя), перенаправляем в профиль.
        router.push('/profile');
      } else {
        // На случай непредвиденных ответов.
        setError('Произошла неизвестная ошибка.');
      }
    } catch (err) {
      setError('Произошла ошибка при подключении к серверу.');
    } finally {
      setIsLoading(false);
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  };

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
              className="hover:bg-opacity-90 w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? 'Проверка...' : 'Подтвердить'}
            </button>
            {error && (
              <p className="pt-2 text-center text-xs text-red-600">{error}</p>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading || resendCooldown > 0}
                className="hover:text-opacity-80 text-xs font-semibold text-[#6B80C5] disabled:cursor-not-allowed disabled:text-zinc-400"
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
