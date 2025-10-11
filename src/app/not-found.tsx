import Link from 'next/link';
import { ShortLogo } from '@/components/shared/icons';
import NotFoundRedirect from '@/components/NotFoundRedirect';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center sm:px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <ShortLogo className="h-8 w-auto text-gray-300" aria-hidden />
      </div>
      <h1 className="mt-8 text-3xl font-bold text-gray-900 sm:text-4xl">
        Страница не найдена
      </h1>
      <p className="mt-3 max-w-xl text-base text-gray-600 sm:text-lg">
        Кажется, вы перешли по ссылке, которой не существует. Проверьте адрес или вернитесь на главную.
      </p>
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          На главную
        </Link>
      </div>
      <div className="mt-6">
        <NotFoundRedirect />
      </div>
    </main>
  );
}
