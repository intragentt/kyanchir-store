// Местоположение: src/components/admin/edit-product-form/ImageManager.tsx
'use client';

import { Image as PrismaImage } from '@prisma/client';
import Image from 'next/image';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

interface ImageManagerProps {
  images: PrismaImage[];
  onImageOrderChange: (reorderedImages: PrismaImage[]) => void;
  onImageAdd: (files: FileList) => void;
  onImageRemove: (id: string) => void;
}

export default function ImageManager({
  images,
  onImageOrderChange,
  onImageAdd,
  onImageRemove,
}: ImageManagerProps) {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onImageOrderChange(items);
  };

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="text-lg font-semibold text-gray-800">Изображения</div>

      {/* VVV--- ИЗМЕНЕНИЕ: Разделяем контейнер для слайдера и пагинации ---VVV */}
      <div className="relative mt-4">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-gray-100">
          {images.length > 0 ? (
            <Swiper
              modules={[Pagination]}
              pagination={{
                clickable: true,
                el: '.swiper-custom-pagination',
                bulletClass: 'swiper-styled-pagination-bullet',
                bulletActiveClass: 'swiper-styled-pagination-bullet_active',
              }}
              spaceBetween={10}
              className="h-full w-full"
            >
              {images.map((image) => (
                <SwiperSlide key={image.id}>
                  <Image
                    src={image.url}
                    alt={`Предпросмотр ${image.id}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-gray-400">Нет изображений</span>
            </div>
          )}
        </div>
        {/* VVV--- ИЗМЕНЕНИЕ: Контейнер пагинации вынесен за пределы overflow-hidden ---VVV */}
        <div className="swiper-custom-pagination absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 transform"></div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="product-images" direction="vertical">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="mt-6 space-y-2" // Добавил отступ сверху
            >
              {images.map((image, index) => (
                <Draggable key={image.id} draggableId={image.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-center gap-x-4 rounded-md border bg-white p-2"
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab text-gray-400"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={image.url}
                          alt={`Изображение ${index + 1}`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <span className="truncate text-sm text-gray-500">{`...${image.url.slice(-20)}`}</span>
                      <button
                        type="button"
                        onClick={() => onImageRemove(image.id)}
                        className="ml-auto rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-4">
        <label
          htmlFor="image-upload"
          className="block w-full cursor-pointer rounded-md border-2 border-dashed border-gray-300 bg-gray-50 py-4 text-center text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          + Добавить изображения
        </label>
        <input
          id="image-upload"
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && onImageAdd(e.target.files)}
        />
      </div>
    </div>
  );
}
