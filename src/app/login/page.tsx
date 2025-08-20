// Местоположение: src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import PageContainer from '@/components/layout/PageContainer';

// --- Иконка Telegram для красоты ---
const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
    {...props}
  >
    <path fill="#29b6f6" d="M24,4_A_20,20_0_1,0_44,24_20,20_0_0,0_24,4_Z" />
    <path
      fill="#fff"
      d="M34,15_l-13,11_c0,0-2.3,1.4-3.6,0_c-1.3-1.4,1-4.3,1-4.3_l3-13_c0,0,1-3-3-2_c-4,1-9,4-11,6_c-2,2-2,5-2,5_l4,1_c0,0,3,1,2,3_c-1,2-5,2-5,2_l-4,1_c0,0-2,0-2,2_s2,2,2,2_l5,2_c0,0,2-2,6,1_s5,4,5,4_l2,2_c0,0,2,2,4,0_s1-10,1-10_Z"
    />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем состояние для Telegram ID ---
  const [telegramId, setTelegramId] = useState('');
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    await signIn('email', { email });
    setIsSubmitting(false);
  };

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Новая функция для отправки Telegram ID ---
  const handleTelegramSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!telegramId) return;
    setIsSubmitting(true);

    // Вызываем signIn, но теперь с провайдером 'credentials'
    // и передаем ему наш telegramId.
    // `redirect: false` нужен, чтобы страница не перезагружалась.
    await signIn('credentials', { telegramId, redirect: false });

    // После успешной отправки, NextAuth сам перенаправит нас
    // на страницу /login/verify-request, так как мы ее указали в конфиге.
    // Поэтому здесь можно просто перенаправить пользователя вручную
    // или показать сообщение об успехе.
    window.location.href = '/login/verify-request';
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

          {/* --- ФОРМА ДЛЯ EMAIL --- */}
          <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
            <p className="text-center text-sm text-gray-600">Через email</p>
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                placeholder="Email"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
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

          {/* --- НАЧАЛО ИЗМЕНЕНИЙ: ФОРМА ДЛЯ TELEGRAM --- */}
          <form className="space-y-6" onSubmit={handleTelegramSubmit}>
            <p className="text-center text-sm text-gray-600">Через Telegram</p>
            <div>
              <input
                id="telegram-id"
                name="telegramId"
                type="text"
                required
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-sky-500 focus:ring-sky-500 focus:outline-none sm:text-sm"
                placeholder="Ваш Telegram ID"
              />
            </div>
            <p className="text-center text-xs text-gray-500">
              Чтобы узнать свой ID, напишите{' '}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:underline"
              >
                @userinfobot
              </a>
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-x-2 rounded-md border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              <TelegramIcon />
              {isSubmitting ? 'Отправка...' : 'Получить ссылку в Telegram'}
            </button>
          </form>
          {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
        </div>
      </PageContainer>
    </main>
  );
}
