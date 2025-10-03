// Местоположение: src/components/layout/ProductPageHeader.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HeartIcon from '@/components/icons/HeartIcon';
import ShareIcon from '@/components/icons/ShareIcon';

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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: "Мозг" (логика 'Поделиться') скопирован сюда ---
  const handleShareClick = async () => {
    // Проверяем, поддерживает ли браузер Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title, // Заголовок страницы
          url: window.location.href, // URL текущей страницы
        });
      } catch (error) {
        console.error('Ошибка при попытке поделиться:', error);
      }
    } else {
      // Запасной вариант для старых браузеров
      alert('Ваш браузер не поддерживает эту функцию.');
    }
  };
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
            className="w-full rounded-lg border-none bg-gray-100 py-2.5 pr-4 pl-10 text-sm text-gray-900 focus:text-base focus:ring-2 focus:ring-gray-300 focus:outline-none"
          />
        </div>

        <div className="flex flex-shrink-0 items-center gap-x-3">
          <Link href="/favorites" aria-label="Избранное">
            <HeartIcon className="h-6 w-6" />
          </Link>
          {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Подключаем "мозг" к кнопке --- */}
          <button
            onClick={handleShareClick}
            aria-label="Поделиться"
            className="transition-opacity hover:opacity-70"
          >
            <ShareIcon className="h-6 w-6" />
          </button>
          {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
        </div>
      </div>
    </header>
  );
}
