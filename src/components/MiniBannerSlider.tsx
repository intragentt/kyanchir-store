// Местоположение: src/components/MiniBannerSlider.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

export interface MiniBanner {
  id: string;
  imageUrl?: string;
  altText: string;
  linkHref: string;
  title: string;
  description: string;
  bgColor?: string;
  textColor?: string;
}

interface MiniBannerSliderProps {
  banners: MiniBanner[];
  autoplayDelay?: number;
  aspectRatioClass?: string;
  isDebugMode?: boolean;
  swiperSettings?: {
    slidesPerView?: number | 'auto';
    spaceBetween?: number;
    pagination?: boolean;
  };
  onSlideChange?: (index: number) => void;
  slidesOffsetBefore?: number;
  activeIndex?: number;
}

export default function MiniBannerSlider({
  banners,
  autoplayDelay = 5000,
  aspectRatioClass = 'aspect-[4/5]',
  isDebugMode = false,
  swiperSettings = {},
  onSlideChange,
  slidesOffsetBefore = 0,
  activeIndex = 0,
}: MiniBannerSliderProps) {
  const [currentWidth, setCurrentWidth] = useState<number>(0);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    function handleResize() {
      setCurrentWidth(window.innerWidth);
    }
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

  const getBreakpointName = useCallback((width: number): string => {
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  }, []);

  const debugSpecs = useMemo(() => {
    let safeZone = 'aspect-[4/3]';
    let dangerZone = 'aspect-[2/1]';
    let recommendedSize = 'N/A';
    let safeZoneSize = 'N/A';

    switch (aspectRatioClass) {
      case 'aspect-[4/5]':
        safeZone = 'aspect-[3/4]';
        dangerZone = 'aspect-[1/1]';
        recommendedSize = '1080x1350px (4:5)';
        safeZoneSize = '900x1200px (3:4)';
        break;
      case 'aspect-[16/9]':
        safeZone = 'aspect-[4/3]';
        dangerZone = 'aspect-[2/1]';
        recommendedSize = '1920x1080px (16:9)';
        safeZoneSize = '1440x1080px (4:3)';
        break;
      case 'aspect-[1/1]':
        safeZone = 'aspect-[4/3]';
        dangerZone = 'aspect-[2/1]';
        recommendedSize = '1080x1080px (1:1)';
        safeZoneSize = '960x960px (1:1)';
        break;
      default:
        safeZone = aspectRatioClass;
        dangerZone = aspectRatioClass;
        break;
    }

    return { safeZone, dangerZone, recommendedSize, safeZoneSize };
  }, [aspectRatioClass]);

  if (!banners || banners.length === 0) {
    return null;
  }

  const paginationEnabled = swiperSettings?.pagination ?? true;
  const isLookonlineStyle = swiperSettings.slidesPerView === 'auto';
  const effectiveDebugSpecs = isDebugMode ? debugSpecs : null;
  const paginationClassName = `swiper-pagination-custom-${banners[0]?.id || 'default'}`;

  return (
    <div className="relative w-full">
      <Swiper
        modules={paginationEnabled ? [Autoplay, Pagination] : [Autoplay]}
        slidesPerView={swiperSettings.slidesPerView ?? 1}
        spaceBetween={swiperSettings.spaceBetween ?? 0}
        slidesOffsetBefore={slidesOffsetBefore}
        // VVV--- ИСПРАВЛЕНИЕ 1: `disableOnInteraction` теперь `true` ---VVV
        // Автопрокрутка будет останавливаться, как только ты начнешь листать слайдер.
        autoplay={{ delay: autoplayDelay, disableOnInteraction: true }}
        loop={true}
        className="w-full"
        pagination={
          paginationEnabled
            ? {
                el: `.${paginationClassName}`,
                clickable: true,
                bulletClass: 'swiper-styled-pagination-bullet',
                bulletActiveClass: 'swiper-styled-pagination-bullet_active',
              }
            : false
        }
        onSlideChange={(swiper) => {
          if (onSlideChange) {
            onSlideChange(swiper.realIndex);
          }
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
      >
        {banners.map((banner) => (
          <SwiperSlide
            key={banner.id}
            className={`h-auto ${isLookonlineStyle ? 'w-[320px]' : 'w-full'}`}
          >
            <Link
              href={banner.linkHref}
              className="block h-full w-full"
              tabIndex={0}
            >
              <div
                className={`relative h-full w-full overflow-hidden ${aspectRatioClass} ${banner.bgColor || 'bg-gray-200'} ${banner.textColor || 'text-white'} flex items-center justify-center text-center`}
              >
                {banner.imageUrl ? (
                  <Image
                    src={banner.imageUrl}
                    alt={banner.altText}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <p className="font-heading text-clamp-banner-main mb-1 line-clamp-2 leading-tight text-balance uppercase">
                      {banner.title}
                    </p>
                    <p className="text-clamp-banner-info line-clamp-2 leading-tight text-balance">
                      {banner.description}
                    </p>
                  </div>
                )}
                {isDebugMode && currentWidth > 0 && effectiveDebugSpecs && (
                  <div className="absolute top-1 left-1 z-40 rounded bg-black/50 px-2 py-1 text-xs text-white">
                    <div>
                      <b>DEBUG:</b> {getBreakpointName(currentWidth)} (
                      {currentWidth}px)
                    </div>
                    <div>
                      Slide: {activeIndex + 1} / {banners.length}
                    </div>
                    <div>
                      <span className="font-bold">Aspect:</span>{' '}
                      {aspectRatioClass}
                    </div>
                    <div>
                      <span className="font-bold">Rec. Size:</span>{' '}
                      {effectiveDebugSpecs.recommendedSize}
                    </div>
                    <div>
                      <span className="font-bold">Safe Zone:</span>{' '}
                      {effectiveDebugSpecs.safeZoneSize}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
      <div
        className={`${paginationClassName} absolute right-0 bottom-2.5 left-0 z-10 w-full text-center`}
      ></div>
    </div>
  );
}
