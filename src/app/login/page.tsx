// Местоположение: src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
// --- НАЧАЛО ИЗМЕНЕНИЙ (TypeScript) ---
// Исправляем импорт на 'default'
import Logo from '@/components/icons/Logo';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.9999 8.00001L8.49992 11.5C7.99992 11.7 7.99992 12.3 8.49992 12.5L10.4999 13.2C10.7999 13.3 11.0999 13.6 11.1999 13.9L11.8999 15.9C12.0999 16.4 12.6999 16.4 12.8999 15.9L16.9999 8.00001Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setIsEmailSubmitting(true);
    setError(null);

    try {
      const res = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/profile',
      });

      if (res?.ok && !res.error) {
        router.push('/login/verify-request');
      } else {
        setError(res?.error || 'Не удалось отправить ссылку.');
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка.');
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const redirectToTelegramBot = () => {
    window.location.href = 'https://t.me/kyanchir_bot'; // Указываем реальное имя бота
  };

  return (
    <main>
      <PageContainer className="flex min-h-[80vh] items-center justify-center bg-zinc-50 py-12">
        <div className="w-full max-w-sm">
          <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-12 w-auto text-indigo-600">
              <Logo />
            </div>

            <form className="space-y-4" onSubmit={handleEmailSubmit}>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 text-center text-sm placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Введите ваш email"
                />
              </div>

              {/* --- НАЧАЛО ИЗМЕНЕНИЙ (Tailwind) --- */}
              <button
                type="submit"
                disabled={isEmailSubmitting}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {isEmailSubmitting
                  ? 'Отправка...'
                  : 'Получить ссылку для входа'}
              </button>
              {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
              {error && <p className="text-xs text-red-600">{error}</p>}
            </form>

            <div className="flex items-center gap-x-3">
              <div className="h-px w-full bg-zinc-200" />
              <div className="text-xs font-medium text-zinc-400">ИЛИ</div>
              <div className="h-px w-full bg-zinc-200" />
            </div>

            {/* --- НАЧАЛО ИЗМЕНЕНИЙ (Tailwind) --- */}
            <button
              onClick={redirectToTelegramBot}
              className="flex w-full items-center justify-center gap-x-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              <TelegramIcon />
              Войти через Telegram
            </button>
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
          </div>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm">
            <p className="text-zinc-600">
              Нет аккаунта?{' '}
              <span className="font-semibold text-indigo-600">
                Вход и регистрация происходят автоматически.
              </span>
            </p>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
