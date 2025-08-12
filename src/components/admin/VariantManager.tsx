// Местоположение: src/components/admin/VariantManager.tsx
'use client';

import { useState } from 'react';
import { ProductVariant } from '@prisma/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatPrice } from '@/utils/formatPrice';
// VVV--- ИСПРАВЛЕНИЕ: ДОБАВЛЕН ЭТОТ ИМПОРТ ---VVV
import Link from 'next/link';

interface VariantManagerProps {
  initialVariants: ProductVariant[];
  productId: string;
}

// --- Компонент для загрузки фото ---
function ImageUploader({
  onUploadSuccess,
  isUploading,
  setIsUploading,
}: {
  onUploadSuccess: (url: string) => void;
  isUploading: boolean;
  setIsUploading: (val: boolean) => void;
}) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'kyanchir_unsigned');

    try {
      const CLOUD_NAME = 'dknswd0u8';
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) throw new Error('Ошибка загрузки изображения');

      const data = await response.json();
      onUploadSuccess(data.secure_url);
    } catch (error) {
      console.error(error);
      alert('Не удалось загрузить изображение.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label
        htmlFor="image-upload"
        className={`cursor-pointer rounded-md border px-3 py-2 text-sm font-medium ${isUploading ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-gray-50'}`}
      >
        {isUploading ? 'Загрузка...' : '+ Фото'}
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}

// --- Форма добавления нового варианта ---
function AddVariantForm({
  productId,
  onVariantAdded,
}: {
  productId: string;
  onVariantAdded: () => void;
}) {
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUploaded = (url: string) => {
    setImageUrls((prev) => [...prev, url]);
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrls.length < 2) {
      alert('Пожалуйста, загрузите минимум 2 изображения.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId,
          color: color,
          price: price,
          images: imageUrls,
        }),
      });
      if (!response.ok) throw new Error('Ошибка при создании варианта');
      onVariantAdded();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 rounded-lg border bg-slate-50 p-4"
    >
      <h3 className="text-lg font-medium">Добавить новый вариант</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="Цвет (напр., 'Бежевый')"
          required
          className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Цена в копейках"
          required
          className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Изображения (минимум 2)
        </label>
        <div className="flex items-center gap-4">
          {imageUrls.map((url, index) => (
            <div key={url} className="relative">
              <Image
                src={url}
                alt="thumbnail"
                width={64}
                height={64}
                className="h-16 w-16 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
              >
                ×
              </button>
            </div>
          ))}
          <ImageUploader
            onUploadSuccess={handleImageUploaded}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Сохранение...' : 'Сохранить вариант'}
        </button>
      </div>
    </form>
  );
}

// --- Основной компонент-менеджер ---
export default function VariantManager({
  initialVariants,
  productId,
}: VariantManagerProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleVariantAdded = () => {
    setShowAddForm(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {initialVariants.map((variant) => (
        <div
          key={variant.id}
          className="flex items-center justify-between rounded-md border bg-white p-4"
        >
          <div className="flex items-center gap-4">
            <Image
              src={variant.images[0] || '/placeholder.png'}
              alt={variant.color || ''}
              width={40}
              height={40}
              className="h-10 w-10 rounded bg-gray-100 object-cover"
            />
            <div>
              <p className="font-medium">{variant.color}</p>
              <p className="text-sm text-gray-500">
                {formatPrice(variant.price)?.value} ₽
              </p>
            </div>
          </div>
          <Link
            href={`/admin/variants/${variant.id}/edit`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          >
            Редактировать
          </Link>
        </div>
      ))}
      {initialVariants.length === 0 && (
        <div className="rounded-md border-2 border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm text-gray-500">
            У этого товара еще нет вариантов.
          </p>
        </div>
      )}
      {showAddForm ? (
        <AddVariantForm
          productId={productId}
          onVariantAdded={handleVariantAdded}
        />
      ) : (
        <div className="mt-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full rounded-md border-2 border-dashed border-gray-300 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
          >
            + Добавить вариант
          </button>
        </div>
      )}
    </div>
  );
}
