// Местоположение: src/components/product-details/DesktopProductGallery.tsx
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperCore } from 'swiper';
import { A11y, Navigation, Thumbs } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

import { Image as PrismaImage } from '@prisma/client';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ImagePlaceholder from '@/components/ImagePlaceholder';

type GalleryItem =
  | { type: 'image'; image: PrismaImage }
  | { type: 'placeholder'; key: string };

function useGalleryItems(images: PrismaImage[]): GalleryItem[] {
  return useMemo(() => {
    const actualItems: GalleryItem[] = images.map((image) => ({
      type: 'image',
      image,
    }));

    const placeholdersNeeded = Math.max(0, 2 - actualItems.length);
    const placeholderItems: GalleryItem[] = Array.from(
      { length: placeholdersNeeded },
      (_, index) => ({
        type: 'placeholder' as const,
        key: `placeholder-${index}`,
      }),
    );

    return [...actualItems, ...placeholderItems];
  }, [images]);
}

interface GalleryProps {
  images: PrismaImage[];
  productName: string;
}

export default function DesktopProductGallery({
  images,
  productName,
}: GalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);
  const galleryItems = useGalleryItems(images);

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
          {galleryItems.map((item, index) => (
            <SwiperSlide
              key={item.type === 'image' ? item.image.id : item.key}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-100">
                {item.type === 'image' ? (
                  <Image
                    src={item.image.url}
                    alt={`${productName} - фото ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 45vw"
                    priority={index < 2}
                  />
                ) : (
                  <ImagePlaceholder />
                )}
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
        slidesPerView={galleryItems.length < 5 ? galleryItems.length : 5}
        watchSlidesProgress={true}
        className="thumbs-swiper"
      >
        {galleryItems.map((item, index) => (
          <SwiperSlide
            key={item.type === 'image' ? item.image.id : `thumb-${item.key}`}
          >
            <div className="thumbnail-wrapper relative aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-md bg-gray-100">
              {item.type === 'image' ? (
                <Image
                  src={item.image.url}
                  alt={`Миниатюра ${index + 1}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <ImagePlaceholder />
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
