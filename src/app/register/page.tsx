// Местоположение: src/app/register/page.tsx
'use client';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// 1. Импортируем signIn для автоматического входа.
import { signIn } from 'next-auth/react';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/icons/Logo';
import Link from 'next/link';
import TelegramOfficialIcon from '@/components/icons/TelegramOfficialIcon';
import ClearIcon from '@/components/icons/ClearIcon';

const validateEmail = (email: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export default function RegisterPage() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // 2. Добавляем state для новых полей.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // 3. Добавляем новую, более строгую валидацию.
    if (!name || !email || !password || !confirmPassword) {
      setError('Все поля обязательны для заполнения.');
      setIsLoading(false);
      return;
    }
    if (!validateEmail(email)) {
      setError('Пожалуйста, введите корректный Email.');
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов.');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      setIsLoading(false);
      return;
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    try {
      // Этап 1: Регистрация (отправка данных на "Кухню")
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 4. Отправляем все данные, включая имя.
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        // Если регистрация не удалась (например, email занят)
        const data = await res.json();
        setError(data.error || 'Не удалось завершить регистрацию.');
        setIsLoading(false); // Важно остановить загрузку здесь
        return;
      }

      // --- НАЧАЛО ИЗМЕНЕНИЙ ---
      // Этап 2: Мгновенный Вход (вызов "Швейцара")
      // Если регистрация прошла успешно, сразу же пытаемся войти.
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false, // Мы сами управляем перенаправлением
      });

      if (signInResult?.error) {
        // Этот случай маловероятен, но лучше его обработать.
        // Означает, что аккаунт создан, но войти не удалось.
        setError(
          'Аккаунт создан, но не удалось войти. Попробуйте на странице входа.',
        );
        // Перенаправляем на страницу входа с сообщением
        router.push('/login?message=registration_success');
      } else {
        // Успех! Пользователь зарегистрирован и вошел. Перенаправляем на главную.
        router.push('/');
      }
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    } catch (err) {
      setError('Произошла непредвиденная ошибка.');
      setIsLoading(false);
    }
    // Убираем finally, так как isLoading управляется внутри логики
  };

  const redirectToTelegramBot = () => {
    window.location.href = 'https://t.me/kyanchir_store_bot';
  };

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
          <form
            className="font-body space-y-4 text-left"
            onSubmit={handleRegisterSubmit}
            noValidate
          >
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
            {/* 5. Добавляем новые поля в JSX. */}
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Имя"
              />
              {name && (
                <button
                  type="button"
                  onClick={() => setName('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <ClearIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                </button>
              )}
            </div>
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Email"
              />
              {email && (
                <button
                  type="button"
                  onClick={() => setEmail('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <ClearIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Пароль (мин. 8 символов)"
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setPassword('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <ClearIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                </button>
              )}
            </div>

            {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-md border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-base placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Подтвердите пароль"
              />
              {confirmPassword && (
                <button
                  type="button"
                  onClick={() => setConfirmPassword('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <ClearIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                </button>
              )}
            </div>
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

            <button
              type="submit"
              disabled={isLoading}
              className="hover:bg-opacity-90 w-full rounded-md bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? 'Создание...' : 'Создать аккаунт'}
            </button>
            {error && (
              <p className="pt-2 text-center text-xs text-red-600">{error}</p>
            )}
          </form>
          <div className="flex items-center gap-x-3">
            <div className="h-px w-full bg-zinc-200" />
            <div className="font-body text-sm font-medium text-zinc-400">
              ИЛИ
            </div>
            <div className="h-px w-full bg-zinc-200" />
          </div>
          <button
            onClick={redirectToTelegramBot}
            className="font-body flex w-full items-center justify-center gap-x-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <TelegramOfficialIcon className="h-6 w-6" />
            Войти через Telegram
          </button>
        </div>
        <div className="font-body mt-6 rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm">
          <p className="text-zinc-600">
            Уже есть аккаунт?{' '}
            <Link
              href="/login"
              className="hover:text-opacity-80 font-semibold text-[#6B80C5]"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
