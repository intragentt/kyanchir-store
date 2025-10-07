// Местоположение: src/components/product-details/DesktopActionButtons.tsx
'use client';

// Убираем ненужные хуки для отслеживания скролла
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartIcon } from '@/components/shared/icons';

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
      strokeWidth="1.5"
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
    strokeWidth={1.5}
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

export default function DesktopActionButtons() {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);

  // Вся логика для скрытия/показа при скролле удалена

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

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Ошибка при попытке поделиться:', error);
      }
    } else {
      alert('Ваш браузер не поддерживает эту функцию.');
    }
  };

  // Убрали fixed, bottom, left. Добавили sticky и top.
  // Теперь компонент готов к тому, чтобы его разместили в нужном месте.
  return (
    <div className="sticky top-[105px] hidden h-fit flex-col gap-y-3 lg:flex">
      <button
        onClick={handleBackClick}
        aria-label="Вернуться назад"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md"
      >
        <BackArrowIcon className="h-6 w-6 text-gray-800" />
      </button>

      <button
        onClick={() => setIsLiked(!isLiked)}
        aria-label="Добавить в избранное"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md"
      >
        <HeartIcon
          filled={isLiked}
          className="h-6 w-6"
          style={{ color: isLiked ? '#D32F2F' : '#272727' }}
        />
      </button>

      <button
        onClick={handleShareClick}
        aria-label="Поделиться"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md"
      >
        <ShareIcon className="h-6 w-6 text-gray-800" />
      </button>
    </div>
  );
}
