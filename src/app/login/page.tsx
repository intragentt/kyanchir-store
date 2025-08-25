// Местоположение: src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import Logo from '@/components/icons/Logo';

const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="22"
    height="22"
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
  const [identifier, setIdentifier] = useState(''); // Поле для email/username/phone
  const [password, setPassword] = useState(''); // Поле для пароля (пока визуальное)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identifier) return;
    setIsLoading(true);
    setError(null);

    // ВРЕМЕННАЯ ЛОГИКА: Используем identifier как email для беспарольного входа
    try {
      const res = await signIn('email', {
        email: identifier,
        redirect: false,
        callbackUrl: '/profile',
      });

      if (res?.ok && !res.error) {
        router.push('/login/verify-request');
      } else {
        setError(res?.error || 'Не удалось отправить ссылку для входа.');
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToTelegramBot = () => {
    window.location.href = 'https://t.me/kyanchir_bot';
  };

  return (
    <main>
      <PageContainer className="flex min-h-[80vh] items-center justify-center bg-zinc-50 py-12">
        <div className="w-full max-w-sm">
          <div className="space-y-5 rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-12 w-auto text-indigo-600">
              <Logo />
            </div>

            <form className="space-y-4 text-left" onSubmit={handleLoginSubmit}>
              <div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Email, телефон или имя пользователя"
                />
              </div>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Пароль"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-xs text-zinc-700"
                  >
                    Сохранить вход
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {isLoading ? 'Входим...' : 'Войти'}
              </button>
              {error && (
                <p className="pt-2 text-center text-xs text-red-600">{error}</p>
              )}
            </form>

            <div className="text-center">
              <a
                href="#"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Забыли пароль?
              </a>
            </div>

            <div className="flex items-center gap-x-3">
              <div className="h-px w-full bg-zinc-200" />
              <div className="text-xs font-medium text-zinc-400">ИЛИ</div>
              <div className="h-px w-full bg-zinc-200" />
            </div>

            <button
              onClick={redirectToTelegramBot}
              className="flex w-full items-center justify-center gap-x-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              <TelegramIcon className="text-sky-500" />
              Войти через Telegram
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm">
            <p className="text-zinc-600">
              Нет аккаунта?{' '}
              <a
                href="#"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Регистрация
              </a>
            </p>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
