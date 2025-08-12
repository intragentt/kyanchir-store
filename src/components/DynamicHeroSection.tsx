// Местоположение: src/components/DynamicHeroSection.tsx
'use client';

import dynamic from 'next/dynamic';

// Эта обертка динамически загружает HeroSection и отключает его обработку на сервере.
// Мы также добавляем заглушку на время загрузки.
const HeroSection = dynamic(() => import('@/components/HeroSection'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[4/5] w-full bg-gray-200 lg:aspect-[16/9]" />
  ),
});

export default HeroSection;
