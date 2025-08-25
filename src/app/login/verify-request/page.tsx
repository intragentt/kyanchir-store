// Местоположение: src/app/login/verify-request/page.tsx
import EmailIcon from '@/components/icons/EmailIcon';
import Link from 'next/link';

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
          <EmailIcon className="h-8 w-8 text-indigo-600" />
        </div>
        <div className="mt-6">
          <div className="font-heading text-3xl font-bold tracking-tight text-zinc-900">
            Добро пожаловать!
          </div>
          <p className="font-body mt-4 text-base text-zinc-600">
            Мы отправили ссылку для подтверждения на ваш email. Это необходимо
            сделать в течение 24 часов, чтобы активировать аккаунт.
          </p>
          <p className="font-body mt-2 text-base text-zinc-600">
            А пока — можно начать знакомство с магазином!
          </p>
        </div>
        <div className="mt-8">
          <Link
            href="/"
            className="hover:bg-opacity-90 w-full rounded-md bg-[#6B80C5] px-8 py-3 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            За покупками
          </Link>
        </div>
      </div>
    </div>
  );
}
