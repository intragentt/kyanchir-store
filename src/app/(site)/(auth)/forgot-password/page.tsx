// Местоположение: /src/app/(auth)/forgot-password/page.tsx
import { ForgotPasswordForm } from '@/components/site/auth/ForgotPasswordForm';
import Link from 'next/link';
import { Logo } from '@/components/shared/icons';

export default function ForgotPasswordPage() {
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
          <div className="text-center font-body">
            {/* ИЗМЕНЕНИЕ: h2 заменен на div */}
            <div className="text-lg font-semibold text-zinc-800">
              Восстановление пароля
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Введите email, и мы отправим вам ссылку для сброса.
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 text-center font-body text-sm">
          <p className="text-zinc-600">
            Вспомнили пароль?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#6B80C5] hover:text-opacity-80"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
