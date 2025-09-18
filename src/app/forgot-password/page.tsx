// Местоположение: /src/app/forgot-password/page.tsx
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-gray-800">Kyanchir</h1>
          </Link>
          <p className="mt-2 text-sm text-gray-600">
            Восстановление доступа к аккаунту
          </p>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <ForgotPasswordForm />
        </div>
        <div className="mt-6 text-center text-sm">
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Вспомнили пароль? Войти
          </Link>
        </div>
      </div>
    </main>
  );
}
