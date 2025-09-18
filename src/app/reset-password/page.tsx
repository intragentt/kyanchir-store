// Местоположение: /src/app/reset-password/page.tsx
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import Logo from '@/components/icons/Logo';

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
  <div className="space-y-4 text-center font-body">
    <h2 className="text-lg font-semibold text-zinc-800">{title}</h2>
    <div className="text-sm text-zinc-600">{children}</div>
    <div className="pt-2">
      <Link
        href={linkHref}
        className="font-semibold text-[#6B80C5] hover:text-opacity-80"
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
  if (!passwordResetToken)
    return { isValid: false, error: 'Ссылка недействительна.' };
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

          {!isValid ? (
            <MessageDisplay
              title="Ошибка восстановления"
              linkHref="/forgot-password"
              linkText="Запросить новую ссылку"
            >
              <p>{error}</p>
            </MessageDisplay>
          ) : (
            <>
              <div className="text-center font-body">
                <h2 className="text-lg font-semibold text-zinc-800">
                  Установка нового пароля
                </h2>
              </div>
              <ResetPasswordForm token={token} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
