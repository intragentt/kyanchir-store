// Местоположение: src/components/product-details/MobileProductGallery.tsx
'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y } from 'swiper/modules'; // --- ИЗМЕНЕНИЕ 1: Добавляем A11y
import 'swiper/css';
import 'swiper/css/pagination';
import { Image as PrismaImage } from '@prisma/client';

interface GalleryProps {
  images: PrismaImage[];
  productName: string;
}

export default function MobileProductGallery({
  images,
  productName,
}: GalleryProps) {
  return (
    <div className="pt-[10px]">
      <Swiper
        modules={[Pagination, A11y]}
        slidesPerView={'auto'}
        spaceBetween={10}
        // --- ИЗМЕНЕНИЕ 2: Включаем режим центрирования ---
        centeredSlides={true}
        // --- ИЗМЕНЕНИЕ 3: Заставляем первый и последний слайды прижиматься к краям ---
        centeredSlidesBounds={true}
        pagination={{
          el: '.product-pagination-container',
          clickable: true,
          bulletClass: 'swiper-styled-pagination-bullet',
          bulletActiveClass: 'swiper-styled-pagination-bullet_active',
        }}
        // --- ИЗМЕНЕНИЕ 4: Убираем JS-отступы, теперь они не нужны ---
        // slidesOffsetBefore={15}
        // slidesOffsetAfter={15}
        // --- ИЗМЕНЕНИЕ 5: Добавляем отступы через CSS, чтобы задать "границы" для слайдов ---
        className="!px-4" // ~16px отступы по бокам
      >
        {images.map((image, index) => (
          <SwiperSlide key={image.id} className="!w-[85%]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md">
              <Image
                src={image.url}
                alt={`${productName} - фото ${index + 1}`}
                fill
                className="object-cover"
                sizes="85vw"
                priority={index === 0}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="product-pagination-container mt-[5px] flex h-[10px] items-center justify-center"></div>
    </div>
  );
}
