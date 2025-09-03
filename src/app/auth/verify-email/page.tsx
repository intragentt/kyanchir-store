// Местоположение: src/app/auth/verify-email/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

export default function VerifyEmailPage() {
  const [message, setMessage] = useState('Подтверждаем ваш email...');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setMessage('Неверная ссылка для подтверждения.');
      return;
    }

    const verifyEmail = async () => {
      // Здесь мы должны вызвать API для подтверждения email.
      // Так как у нас нет такого API, мы можем "симулировать" его,
      // просто перенаправляя пользователя в профиль.
      // В реальном приложении здесь был бы fetch-запрос.
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token }),
        });

        if (res.ok) {
          setMessage('Email успешно подтвержден! Перенаправляем...');
          // После успешного подтверждения, перенаправляем в профиль
          router.push('/profile');
        } else {
          const data = await res.json();
          setMessage(data.error || 'Не удалось подтвердить email.');
        }
      } catch (error) {
        setMessage('Произошла ошибка.');
      }
    };

    verifyEmail();
  }, [token, email, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 h-12 w-auto">
          <Image
            src="/images/logo.svg"
            alt="Kyanchir"
            width={150}
            height={40}
          />
        </div>
        <p className="text-lg text-gray-700">{message}</p>
      </div>
    </div>
  );
}
