// Местоположение: src/app/login/verify-request/page.tsx
// Метафора: "Приемная", где пользователь ожидает письмо-пропуск.

import PageContainer from '@/components/layout/PageContainer';
import React from 'react';

// Простая иконка конверта для наглядности.
const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </svg>
);

// Это простой серверный компонент, так как здесь нет никакой интерактивности.
export default function VerifyRequestPage() {
  return (
    <main>
      <PageContainer className="flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto h-12 w-12 text-indigo-600">
            <MailIcon />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Проверьте вашу почту
          </h2>
          <p className="text-gray-600">
            Мы отправили ссылку для входа на ваш email адрес. Пожалуйста,
            откройте письмо и перейдите по ссылке, чтобы завершить авторизацию.
          </p>
        </div>
      </PageContainer>
    </main>
  );
}
