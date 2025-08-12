// Местоположение: src/components/layout/ProductPageHeader.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CartIcon from '@/components/icons/CartIcon';
import HeartIcon from '@/components/icons/HeartIcon';

const BackArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M15 18L9 12L15 6"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.2}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

export default function ProductPageHeader() {
  const router = useRouter();

  const handleBackClick = () => {
    if (
      typeof window !== 'undefined' &&
      document.referrer.startsWith(window.location.origin)
    ) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <header className="relative z-10 bg-white lg:hidden">
      <div className="flex h-16 w-full items-center gap-x-3 px-4">
        <button
          onClick={handleBackClick}
          aria-label="Вернуться назад"
          className="text-text-primary flex-shrink-0 transition-opacity hover:opacity-70"
        >
          <BackArrowIcon className="h-7 w-7" />
        </button>

        <div className="relative flex-grow">
          <span className="absolute top-1/2 left-3 -translate-y-1/2">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="search"
            placeholder="Поиск"
            className="w-full rounded-lg border-none bg-gray-100 py-2.5 pr-4 pl-10 text-sm text-gray-900 focus:ring-2 focus:ring-gray-300 focus:outline-none"
          />
        </div>

        {/* --- ИЗМЕНЕНИЕ: Иконка корзины УДАЛЕНА --- */}
        <div className="flex flex-shrink-0 items-center gap-x-3">
          <Link href="/favorites" aria-label="Избранное">
            <HeartIcon className="h-6 w-6" />
          </Link>
          <button
            aria-label="Поделиться"
            className="transition-opacity hover:opacity-70"
          >
            <ShareIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
