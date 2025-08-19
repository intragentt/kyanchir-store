// Местоположение: src/components/product-details/ProductActions.tsx
'use client';

import { useState } from 'react';
import HeartIcon from '../icons/HeartIcon';
import ShareIcon from '../icons/ShareIcon';

export default function ProductActions() {
  const [isLiked, setIsLiked] = useState(false);

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

  return (
    <div className="flex items-center gap-x-6">
      <button
        onClick={() => setIsLiked(!isLiked)}
        className="font-body text-text-primary flex items-center gap-x-2 text-base font-medium"
      >
        <HeartIcon
          filled={isLiked}
          className="h-6 w-6"
          style={{ color: isLiked ? '#D32F2F' : '#272727' }}
        />
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Добавлены классы для смещения текста --- */}
        <span className="relative top-[1px]">В избранное</span>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
      </button>
      <button
        onClick={handleShareClick}
        className="font-body text-text-primary flex items-center gap-x-2 text-base font-medium"
      >
        <ShareIcon className="h-6 w-6" />
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Добавлены классы для смещения текста --- */}
        <span className="relative top-[1px]">Поделиться</span>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
      </button>
    </div>
  );
}
