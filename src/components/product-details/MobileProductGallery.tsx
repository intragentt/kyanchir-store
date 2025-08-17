// Местоположение: src/components/product-details/MobileProductGallery.tsx
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Zoom } from 'swiper/modules'; // Убираем Pagination, он больше не нужен
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import 'swiper/css/zoom';
import { Image as PrismaImage } from '@prisma/client';

interface GalleryProps {
  images: PrismaImage[];
  productName: string;
}

export default function MobileProductGallery({
  images,
  productName,
}: GalleryProps) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperInstance | null>(
    null,
  );
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const zoomedSlideRef = useRef<HTMLElement | null>(null);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Состояния для нашей кастомной пагинации ---
  const [slideCount, setSlideCount] = useState(images.length);
  const [activeIndex, setActiveIndex] = useState(0);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const handleGalleryClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!galleryRef.current || !swiperInstance) return;
    if (swiperInstance.zoom.scale !== 1) {
      swiperInstance.zoom.out();
      return;
    }
    const rect = galleryRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    if (event.clientX > centerX) {
      swiperInstance.slideNext();
    } else {
      swiperInstance.slidePrev();
    }
  };

  return (
    <div className="pt-[10px]" ref={galleryRef} onClick={handleGalleryClick}>
      <Swiper
        onSwiper={setSwiperInstance}
        // --- ИЗМЕНЕНИЕ: Обновляем activeIndex при смене слайда ---
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        modules={[A11y, Zoom]} // Pagination убран
        slidesPerView={'auto'}
        spaceBetween={10}
        centeredSlides={true}
        centeredSlidesBounds={true}
        zoom={true}
        onTouchEnd={(swiper) => {
          setTimeout(() => {
            if (swiper.zoom.scale !== 1) swiper.zoom.out();
          }, 300);
        }}
        onZoomChange={(swiper, scale, imageEl, slideEl) => {
          const swiperContainer = swiper.el as HTMLElement;
          if (scale > 1) {
            if (zoomedSlideRef.current)
              zoomedSlideRef.current.style.zIndex = '';
            swiperContainer.style.overflow = 'visible';
            slideEl.style.zIndex = '50';
            zoomedSlideRef.current = slideEl;
          } else {
            swiperContainer.style.overflow = 'hidden';
            if (zoomedSlideRef.current) {
              zoomedSlideRef.current.style.zIndex = '';
              zoomedSlideRef.current = null;
            }
          }
        }}
        // --- ИЗМЕНЕНИЕ: Опция pagination полностью удалена ---
        className="!px-4"
      >
        {images.map((image, index) => (
          <SwiperSlide key={image.id} className="!w-[85%]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md">
              <div className="swiper-zoom-container">
                <Image
                  src={image.url}
                  alt={`${productName} - фото ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="85vw"
                  priority={index === 0}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Наша собственная, полностью управляемая пагинация --- */}
      <div className="mt-[15px] flex h-[10px] items-center justify-center gap-x-2">
        {Array.from({ length: slideCount }).map((_, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation(); // Предотвращаем клик по галерее
                swiperInstance?.slideTo(index);
              }}
              aria-label={`Перейти к слайду ${index + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                isActive ? 'w-5 bg-[#272727]' : 'w-1.5 bg-gray-300'
              }`}
            />
          );
        })}
      </div>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </div>
  );
}
