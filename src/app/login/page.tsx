// Местоположение: src/app/login/page.tsx
'use client';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { useState, useEffect, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import PageContainer from '@/components/layout/PageContainer';

// Кастомный хук-"наблюдатель". Он следит за "табло".
function useTokenStatus(
  token: string | null,
  isWaiting: boolean,
  onActivated: () => void,
) {
  useEffect(() => {
    // Начинаем следить только если у нас есть билет и мы находимся в режиме ожидания.
    if (!token || !isWaiting) return;

    // Проверяем статус каждые 3 секунды.
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/check-login-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (data.activated) {
          onActivated(); // Если табло показало "АКТИВИРОВАН", вызываем колбэк.
        }
      } catch (error) {
        console.error('Failed to check token status', error);
      }
    }, 3000);

    // Обязательно очищаем интервал, когда компонент размонтируется или режим ожидания закончится.
    return () => clearInterval(interval);
  }, [token, isWaiting, onActivated]);
}

const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  // ... (SVG код без изменений)
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
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  // Новые состояния для управления сложным процессом входа через Telegram
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<
    'IDLE' | 'GENERATING' | 'WAITING' | 'SIGNING_IN' | 'ERROR'
  >('GENERATING');

  // 1. При загрузке страницы, сразу идем в "кассу" за билетом.
  useEffect(() => {
    const createToken = async () => {
      try {
        const response = await fetch('/api/auth/create-login-token');
        const data = await response.json();
        if (data.token) {
          setLoginToken(data.token);
          setTelegramStatus('IDLE'); // Билет получен, готовы к нажатию кнопки
        } else {
          throw new Error('Token not received');
        }
      } catch (error) {
        console.error('Failed to create login token', error);
        setTelegramStatus('ERROR');
      }
    };
    createToken();
  }, []);

  // 3. Эта функция будет вызвана, когда "наблюдатель" увидит активацию билета.
  const onTokenActivated = useCallback(async () => {
    if (!loginToken) return;

    setTelegramStatus('SIGNING_IN');
    // Предъявляем активированный билет нашему "Пропускному Пункту".
    await signIn('telegram-credentials', {
      token: loginToken,
      callbackUrl: '/profile',
    });
  }, [loginToken]);

  // Запускаем нашего "наблюдателя".
  useTokenStatus(loginToken, telegramStatus === 'WAITING', onTokenActivated);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setIsEmailSubmitting(true);
    await signIn('email', { email, callbackUrl: '/profile' });
    setIsEmailSubmitting(false);
  };

  // 2. При клике, открываем портал в Telegram и переходим в режим ожидания.
  const handleTelegramLogin = () => {
    if (!loginToken) return;
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    window.open(`https://t.me/${botUsername}?start=${loginToken}`, '_blank');
    setTelegramStatus('WAITING'); // Переключаемся в режим "ожидания на табло".
  };

  // Вспомогательная функция для текста на кнопке.
  const getTelegramButtonText = () => {
    switch (telegramStatus) {
      case 'GENERATING':
        return 'Подготовка портала...';
      case 'WAITING':
        return 'Ожидание подтверждения...';
      case 'SIGNING_IN':
        return 'Вход...';
      case 'ERROR':
        return 'Ошибка. Перезагрузите';
      default:
        return 'Войти через Telegram';
    }
  };
  const isTelegramButtonDisabled =
    telegramStatus !== 'IDLE' && telegramStatus !== 'WAITING';

  return (
    <main>
      <PageContainer className="flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-10 shadow-sm">
          {/* ... (блок с заголовком без изменений) ... */}
          <form /* ... (форма для email без изменений) ... */>
            <p className="text-center text-sm text-gray-600">Через email</p>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={isEmailSubmitting}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {isEmailSubmitting ? 'Отправка...' : 'Отправить ссылку'}
            </button>
          </form>

          {/* ... (разделитель "ИЛИ" без изменений) ... */}

          <div className="space-y-6">
            <p className="text-center text-sm text-gray-600">Через Telegram</p>
            <button
              onClick={handleTelegramLogin}
              disabled={isTelegramButtonDisabled}
              className="group relative flex w-full items-center justify-center gap-x-2 rounded-md border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              <TelegramIcon />
              {getTelegramButtonText()}
            </button>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
