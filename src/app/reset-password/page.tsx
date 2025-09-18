// Местоположение: /src/app/reset-password/page.tsx
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import Link from 'next/link';
import prisma from '@/lib/prisma';

// Компонент для отображения сообщений (ошибка или успех)
const MessageDisplay = ({
  title,
  children,
  linkHref,
  linkText,
}: {
  title: string;
  children: React.ReactNode;
  linkHref: string;
  linkText: string;
}) => (
  <div className="rounded-lg bg-white p-8 text-center shadow-lg">
    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    <div className="mt-2 text-sm text-gray-600">{children}</div>
    <div className="mt-6">
      <Link
        href={linkHref}
        className="font-medium text-indigo-600 hover:text-indigo-500"
      >
        {linkText}
      </Link>
    </div>
  </div>
);

async function validateToken(token: string) {
  if (!token) return { isValid: false, error: 'Токен не предоставлен.' };

  const passwordResetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!passwordResetToken) {
    return { isValid: false, error: 'Ссылка недействительна.' };
  }

  if (passwordResetToken.expires < new Date()) {
    return { isValid: false, error: 'Срок действия ссылки истёк.' };
  }

  return { isValid: true, error: null };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token || '';
  const { isValid, error } = await validateToken(token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-gray-800">Kyanchir</h1>
          </Link>
          <p className="mt-2 text-sm text-gray-600">Установка нового пароля</p>
        </div>

        {!isValid ? (
          <MessageDisplay
            title="Ошибка восстановления"
            linkHref="/forgot-password"
            linkText="Запросить новую ссылку"
          >
            <p>{error}</p>
          </MessageDisplay>
        ) : (
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <ResetPasswordForm token={token} />
          </div>
        )}
      </div>
    </main>
  );
}