// Местоположение: src/app/auth/verify/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  // Если email в URL не найден, это нештатная ситуация.
  // Возвращаем пользователя на страницу входа.
  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email) {
      setError('Email не найден. Пожалуйста, вернитесь на страницу входа.');
      setIsLoading(false);
      return;
    }

    // Используем наш провайдер 'email-code' для входа
    const res = await signIn('email-code', {
      redirect: false, // Мы сами управляем редиректом
      email,
      token: code,
    });

    if (res?.ok) {
      // Успех! Перенаправляем пользователя в его профиль.
      router.push('/profile');
    } else {
      // Ошибка
      setError('Неверный или устаревший код. Попробуйте еще раз.');
      setIsLoading(false);
    }
  };

  if (!email) {
    return null; // или показать индикатор загрузки
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-6 h-12 w-auto">
          <Image
            src="/images/logo.svg"
            alt="Kyanchir"
            width={150}
            height={40}
          />
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="mb-2 text-center text-2xl font-bold text-gray-800">
            Подтвердите ваш email
          </h2>
          <p className="mb-6 text-center text-sm text-gray-500">
            Мы отправили код на <span className="font-semibold">{email}</span>
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Введите 6-значный код"
              className="w-full rounded-lg border-gray-300 text-center text-lg tracking-[8px] focus:border-indigo-500 focus:ring-indigo-500"
              maxLength={6}
            />

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {isLoading ? 'Проверка...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
