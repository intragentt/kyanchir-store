'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MiniBannerSlider, { MiniBanner } from './MiniBannerSlider';

const DUMMY_MAIN_BANNERS: MiniBanner[] = [
  {
    id: 'main1',
    imageUrl: '',
    altText: 'Основной баннер 1',
    linkHref: '/catalog',
    title: 'ВЕСЕННЯЯ НЕЖНОСТЬ УЖЕ ЗДЕСЬ!',
    description: 'Откройте новые образы для легких и воздушных дней.',
    bgColor: 'bg-indigo-300',
  },
  {
    id: 'main2',
    imageUrl: '',
    altText: 'Основной баннер 2',
    linkHref: '/new',
    title: 'СКИДКИ ДО 50%!',
    description: 'Успейте приобрести любимые комплекты.',
    bgColor: 'bg-purple-300',
  },
  {
    id: 'main3',
    imageUrl: '',
    altText: 'Основной баннер 3',
    linkHref: '/brands',
    title: 'НОВЫЕ БРЕНДЫ',
    description: 'Погрузитесь в мир стиля и комфорта.',
    bgColor: 'bg-green-300',
  },
  {
    id: 'main4',
    imageUrl: '',
    altText: 'Основной баннер 4',
    linkHref: '/sales',
    title: 'ФИНАЛЬНАЯ РАСПРОДАЖА',
    description: 'Последний шанс забрать лучшее.',
    bgColor: 'bg-red-300',
  },
];

export default function HeroSection() {
  const [currentWidth, setCurrentWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setCurrentWidth(window.innerWidth);
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const isDesktop = currentWidth >= 1024;

  const getAspectRatio = useCallback((width: number): string => {
    if (width >= 1280) return 'aspect-[21/9]';
    if (width >= 1024) return 'aspect-[16/9]';
    if (width >= 768) return 'aspect-[1/1]';
    return 'aspect-[4/5]';
  }, []);

  const mainBannerAspectRatio = getAspectRatio(currentWidth);

  const mobileTabletSwiperSettings = {
    slidesPerView: 'auto' as const,
    spaceBetween: 0,
    pagination: true,
  };

  const desktopSwiperSettings = {
    slidesPerView: 1,
    spaceBetween: 0,
    pagination: true,
  };

  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Убираем лишний отступ pt-4 ---
    <div className="w-full">
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
      <div className="w-full overflow-x-hidden">
        <MiniBannerSlider
          key={isDesktop ? 'desktop' : 'mobile'}
          banners={DUMMY_MAIN_BANNERS}
          autoplayDelay={5000}
          aspectRatioClass={mainBannerAspectRatio}
          swiperSettings={
            isDesktop ? desktopSwiperSettings : mobileTabletSwiperSettings
          }
          isDebugMode={true}
        />
      </div>
    </div>
  );
}
