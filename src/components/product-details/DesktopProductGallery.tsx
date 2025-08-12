// Местоположение: src/components/product-details/DesktopProductGallery.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperCore } from 'swiper';
import { A11y, Navigation, Thumbs } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

import { Image as PrismaImage } from '@prisma/client';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface GalleryProps {
  images: PrismaImage[];
  productName: string;
}

export default function DesktopProductGallery({
  images,
  productName,
}: GalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);

  return (
    <div>
      <div className="relative">
        <Swiper
          modules={[Navigation, Thumbs, A11y]}
          spaceBetween={10}
          navigation={{
            nextEl: '.swiper-button-next-desktop',
            prevEl: '.swiper-button-prev-desktop',
          }}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          className="mb-2.5 rounded-lg"
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id}>
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={image.url}
                  alt={`${productName} - фото ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 45vw"
                  priority={index < 2}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="swiper-button-prev-desktop absolute top-1/2 left-2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/80 p-2 shadow-md transition-opacity hover:bg-white">
          <ChevronLeftIcon className="h-6 w-6 text-gray-800" />
        </div>
        <div className="swiper-button-next-desktop absolute top-1/2 right-2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/80 p-2 shadow-md transition-opacity hover:bg-white">
          <ChevronRightIcon className="h-6 w-6 text-gray-800" />
        </div>
      </div>

      <Swiper
        onSwiper={setThumbsSwiper}
        modules={[Thumbs, A11y]}
        spaceBetween={10}
        slidesPerView={images.length < 5 ? images.length : 5}
        watchSlidesProgress={true}
        className="thumbs-swiper"
      >
        {images.map((image, index) => (
          <SwiperSlide key={image.id}>
            {/* 
              ИЗМЕНЕНИЕ: Заменили 'aspect-square' на 'aspect-[4/5]'.
              Теперь миниатюры имеют такую же форму, как и большое изображение.
            */}
            <div className="thumbnail-wrapper relative aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-md">
              <Image
                src={image.url}
                alt={`Миниатюра ${index + 1}`}
                fill
                // Возвращаем 'object-cover', т.к. теперь форма контейнера и картинки совпадают
                className="object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
