// Местоположение: src/components/product-details/ProductGallery.tsx
'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Image as PrismaImage } from '@prisma/client';

interface ProductGalleryProps {
  images: PrismaImage[];
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  return (
    <div className="product-gallery-container pt-[10px] lg:pt-0">
      <Swiper
        modules={[Pagination]}
        spaceBetween={10}
        pagination={{
          el: '.product-pagination-container',
          clickable: true,
          bulletClass: 'swiper-styled-pagination-bullet',
          bulletActiveClass: 'swiper-styled-pagination-bullet_active',
        }}
        className="product-gallery"
        breakpoints={{
          320: {
            slidesPerView: 'auto',
            slidesOffsetBefore: 15,
            slidesOffsetAfter: 15,
          },
          1024: {
            slidesPerView: 2,
            slidesOffsetBefore: 0,
            slidesOffsetAfter: 0,
          },
        }}
      >
        {images && images.length > 0 ? (
          images.map((image, index) => (
            <SwiperSlide key={image.id} className="!w-[85%] lg:!w-auto">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md">
                <Image
                  src={image.url}
                  alt={`${productName} - фото ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 30vw, 85vw"
                  priority={index === 0}
                />
              </div>
            </SwiperSlide>
          ))
        ) : (
          <SwiperSlide className="!w-[85%] lg:!w-auto">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-gray-100"></div>
          </SwiperSlide>
        )}
      </Swiper>
      <div className="product-pagination-container mt-[5px] flex h-[10px] items-center justify-center lg:hidden"></div>
    </div>
  );
}
