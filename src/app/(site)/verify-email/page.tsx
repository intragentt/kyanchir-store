// Местоположение: src/app/verify-email/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/shared/icons';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('Проверяем вашу ссылку...');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Ссылка для верификации недействительна или отсутствует.');
        return;
      }

      try {
        // --- НАЧАЛО ИЗМЕНЕНИЙ ---
        // Заменяем имитацию на настоящий запрос к нашему "Охраннику"
        const res = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          // Если API вернуло ошибку, показываем ее
          throw new Error(data.error || 'Не удалось проверить ссылку.');
        }
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---

        setStatus('success');
        setMessage('Ваш email успешно подтвержден!');

        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Произошла ошибка при проверке.');
      }
    };

    verifyToken();
  }, [token, router]);

  const renderStatus = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
            <p className="mt-4 text-zinc-600">{message}</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold text-green-700">{message}</p>
            <p className="mt-2 text-zinc-600">
              Вы будете перенаправлены в личный кабинет...
            </p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold text-red-700">{message}</p>
            <Link
              href="/profile"
              className="mt-4 inline-block font-bold text-indigo-600"
            >
              Вернуться в профиль
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 pt-20 sm:pt-24">
      <div className="w-full max-w-sm">
        <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <Link
            href="/"
            className="mx-auto flex h-12 w-auto justify-center text-[#6B80C5] transition-transform hover:scale-105"
          >
            <div className="mt-2 scale-125 transform">
              <Logo />
            </div>
          </Link>
          <div className="font-body">{renderStatus()}</div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Загрузка...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
