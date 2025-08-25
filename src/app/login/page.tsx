// Местоположение: src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/icons/Logo';
import Link from 'next/link';
import TelegramOfficialIcon from '@/components/icons/TelegramOfficialIcon';

const validateEmail = (email: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!identifier) {
      setError('Поле Email не может быть пустым.');
      setIsLoading(false);
      return;
    }

    if (!validateEmail(identifier)) {
      setError('Пожалуйста, введите корректный Email.');
      setIsLoading(false);
      return;
    }

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

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  const redirectToTelegramBot = () => {
    window.location.href = 'https://t.me/kyanchir_store_bot';
  };
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 pt-20 sm:pt-24">
      <div className="w-full max-w-sm">
        <div className="space-y-5 rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          
          <Link href="/" className="mx-auto flex h-12 w-auto justify-center text-[#6B80C5] transition-transform hover:scale-105">
            <div className="transform scale-125 mt-2">
                <Logo />
            </div>
          </Link>

          <form className="space-y-4 text-left font-body" onSubmit={handleLoginSubmit} noValidate>
            <div>
              <input
                id="identifier"
                name="identifier"
                type="email"
                autoComplete="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Email"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Пароль"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-700">Запомнить меня</label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? 'Входим...' : 'Войти'}
            </button>
             {error && <p className="pt-2 text-center text-xs text-red-600">{error}</p>}
          </form>
          
          <div className="text-center font-body">
              <a href="#" className="text-sm font-semibold text-[#6B80C5] hover:text-opacity-80">
                  Забыли пароль?
              </a>
          </div>

          <div className="flex items-center gap-x-3">
            <div className="h-px w-full bg-zinc-200" />
            <div className="font-body text-sm font-medium text-zinc-400">ИЛИ</div>
            <div className="h-px w-full bg-zinc-200" />
          </div>

          <button
            onClick={redirectToTelegramBot}
            className="font-body flex w-full items-center justify-center gap-x-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <TelegramOfficialIcon className="h-6 w-6"/>
            Войти через Telegram
          </button>
        </div>

        <div className="font-body mt-6 rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm">
          <p className="text-zinc-600">
            Нет аккаунта?{' '}
            <a href="#" className="font-semibold text-[#6B80C5] hover:text-opacity-80">
              Регистрация
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}