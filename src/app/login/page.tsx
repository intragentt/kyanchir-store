// Местоположение: src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import PageContainer from '@/components/layout/PageContainer';

const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
    {...props}
  >
    <path fill="#29b6f6" d="M24,4 A20,20 0 1,0 44,24 A20,20 0 0,0 24,4 Z" />
    <path
      fill="#fff"
      d="M34,15 l-13,11 c0,0-2.3,1.4-3.6,0 c-1.3-1.4,1-4.3,1-4.3 l3-13 c0,0,1-3-3-2 c-4,1-9,4-11,6 c-2,2-2,5-2,5 l4,1 c0,0,3,1,2,3 c-1,2-5,2-5,2 l-4,1 c0,0-2,0-2,2 s2,2,2,2 l5,2 c0,0,2-2,6,1 s5,4,5,4 l2,2 c0,0,2,2,4,0 s1-10,1-10 Z"
    />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    // Указываем, что после входа нужно вернуться на страницу профиля
    await signIn('email', { email, callbackUrl: '/profile' });
    setIsSubmitting(false);
  };

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Упрощенная функция для официального входа ---
  const handleTelegramLogin = () => {
    setIsSubmitting(true);
    // Просто вызываем signIn с id провайдера 'telegram'.
    // NextAuth и Telegram сделают всю магию за нас.
    signIn('telegram', { callbackUrl: '/profile' });
  };
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <main>
      <PageContainer className="flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-10 shadow-sm">
          <div>
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
              Вход / Регистрация
            </h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
            <p className="text-center text-sm text-gray-600">Через email</p>
            <div>
              <input /* ... */ />
            </div>
            <button /* ... */>
              {isSubmitting ? 'Отправка...' : 'Отправить ссылку'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">ИЛИ</span>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-center text-sm text-gray-600">Через Telegram</p>
            <button
              onClick={handleTelegramLogin}
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-x-2 rounded-md border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              <TelegramIcon />
              {isSubmitting ? 'Ожидание...' : 'Войти через Telegram'}
            </button>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
