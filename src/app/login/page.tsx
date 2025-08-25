// Местоположение: src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Вход / Регистрация');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setStatusMessage('Автоматический вход...');

      const exchangeTokenForSession = async () => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          if (response.ok) {
            router.push('/profile');
          } else {
            setStatusMessage('Ссылка для входа недействительна или устарела');
          }
        } catch (error) {
          console.error('Failed to exchange token', error);
          setStatusMessage('Произошла ошибка при входе');
        }
      };

      exchangeTokenForSession();
    }
  }, [searchParams, router]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setIsEmailSubmitting(true);
    setStatusMessage('Отправляем ссылку на почту...');
    await signIn('email', { email, callbackUrl: '/profile' });
  };

  return (
    <main>
      <PageContainer className="flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-10 shadow-sm">
          <div>
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
              {statusMessage}
            </h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
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
        </div>
      </PageContainer>
    </main>
  );
}
