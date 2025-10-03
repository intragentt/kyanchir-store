// Местоположение: src/components/ProductCard.tsx

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatPrice, PriceParts } from '@/utils/formatPrice';
import ImagePlaceholder from './ImagePlaceholder';
import { HeartIcon } from '@/components/shared/icons'; // ОБНОВЛЕННЫЙ ИМПОРТ
import { ProductWithInfo } from '@/lib/types';

interface ProductCardProps {
  product: ProductWithInfo;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  // ИЗМЕНЕНИЕ 1: Теперь нам нужно отслеживать ошибки только для 2-х картинок
  const [imageErrors, setImageErrors] = useState([false, false]);

  useEffect(() => {
    const savedLiked = localStorage.getItem(`liked-${product.id}`);
    if (savedLiked === 'true') {
      setIsLiked(true);
    }
  }, [product.id]);

  useEffect(() => {
    localStorage.setItem(`liked-${product.id}`, String(isLiked));
  }, [isLiked, product.id]);

  // ИЗМЕНЕНИЕ 2: Получаем ссылки только на 2 первых изображения
  const imageUrls = [product.imageUrls?.[0], product.imageUrls?.[1]];

  const hasDiscount = product.oldPrice && product.oldPrice > 0;
  const currentPrice: PriceParts | null = formatPrice(product.price);
  const oldPrice: PriceParts | null = hasDiscount
    ? formatPrice(product.oldPrice)
    : null;

  const handleImageError = (index: number) => {
    setImageErrors((prevErrors) => {
      const newErrors = [...prevErrors];
      newErrors[index] = true;
      return newErrors;
    });
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group mx-auto flex w-full flex-col text-text-primary md:max-w-[330px]"
    >
      {/* ИЗМЕНЕНИЕ 3: Сетка теперь состоит только из 2-х колонок, без рядов */}
      <div className="relative z-10 grid grid-cols-2 gap-x-2.5">
        {/* ИЗМЕНЕНИЕ 4: Используем `map` для рендеринга 2-х изображений */}
        {imageUrls.map((url, index) => (
          <div
            key={index}
            className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-gray-200"
          >
            <ImagePlaceholder />
            {url && !imageErrors[index] && (
              <Image
                src={url}
                alt={`${product.name} - фото ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover"
                onError={() => handleImageError(index)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="relative z-0 mx-auto mt-[-12px] flex w-[calc(100%-10px)] flex-grow flex-col justify-between rounded-b-md border-x border-b border-gray-200 bg-white px-3 pb-2 pt-5">
        <div>
          <div className="mt-0.5 font-body text-base font-semibold text-text-primary">
            {product.name}
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="flex items-baseline gap-x-2">
              {currentPrice && (
                <p className="font-body text-base font-semibold text-text-primary">
                  {`${currentPrice.value} ${currentPrice.currency}`}
                </p>
              )}
              {hasDiscount && oldPrice && (
                <p className="font-body text-base font-semibold text-gray-400">
                  <span className="line-through">{oldPrice.value}</span>
                  <span> {oldPrice.currency}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-1 right-1 overflow-visible sm:bottom-2 sm:right-2">
          <button
            aria-label="Добавить в избранное"
            className="flex h-10 w-10 items-center justify-center transition-all duration-300 ease-in-out"
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
          >
            <HeartIcon
              filled={isLiked}
              className="h-6 w-6"
              style={{ color: isLiked ? '#D32F2F' : '#272727' }}
            />
          </button>
        </div>
      </div>
    </Link>
  );
}
