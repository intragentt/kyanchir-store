// Местоположение: src/components/admin/EditProductForm.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UpdateProductPayload } from '@/lib/types';
import { ProductWithDetails } from '@/app/admin/products/[id]/edit/page';
import { DropResult } from '@hello-pangea/dnd';
import {
  AlternativeName,
  Attribute,
  Image as PrismaImage,
  Size,
  Inventory,
  Category,
  Tag, // <-- ИМПОРТИРУЕМ ТИП TAG
  Prisma,
} from '@prisma/client';

import DetailManager from './edit-product-form/DetailManager';
import AboutProductManager from './edit-product-form/AboutProductManager';
import DescriptionManager from './edit-product-form/DescriptionManager';
import SkuManager from './edit-product-form/SkuManager';
import ImageManager from './edit-product-form/ImageManager';
import PriceManager from './edit-product-form/PriceManager';
import SizeManager from './edit-product-form/SizeManager';
import CategoryManager from './edit-product-form/CategoryManager';

type ProductStatus = Prisma.ProductGetPayload<{}>['status'];
const SYSTEM_ATTRIBUTE_KEYS = ['Цвет', 'Состав, %'];

interface EditProductFormProps {
  product: ProductWithDetails;
  allSizes: Size[];
  allCategories: Category[];
  allTags: Tag[]; // <-- ДОБАВЛЯЕМ ТЕГИ В ПРОПСЫ
}

export default function EditProductForm({
  product,
  allSizes,
  allCategories,
  allTags, // <-- ПОЛУЧАЕМ ТЕГИ
}: EditProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [alternativeNames, setAlternativeNames] = useState<AlternativeName[]>(
    product.alternativeNames,
  );
  const [status, setStatus] = useState(product.status);
  const [attributes, setAttributes] = useState<Attribute[]>(product.attributes);
  const [sku, setSku] = useState(product.sku);
  const [images, setImages] = useState<PrismaImage[]>(
    product.variants[0]?.images || [],
  );
  const [variantDetails, setVariantDetails] = useState({
    price: product.variants[0]?.price || 0,
    oldPrice: product.variants[0]?.oldPrice || null,
    bonusPoints: product.variants[0]?.bonusPoints || null,
  });
  const [discountTimerEnabled, setDiscountTimerEnabled] = useState(
    !!product.variants[0]?.discountExpiresAt,
  );
  const [discountHours, setDiscountHours] = useState(24);
  const [discountMinutes, setDiscountMinutes] = useState(0);
  const [inventory, setInventory] = useState<Inventory[]>(
    product.variants[0]?.inventory || [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    product.categories,
  );
  // --- ИЗМЕНЕНИЕ: Новое состояние для тегов ---
  const [selectedTags, setSelectedTags] = useState<Tag[]>(product.tags);

  const {
    systemAttributes,
    customAttributes,
    descriptionAttribute,
    articleAttribute,
  } = useMemo(() => {
    // ... (этот блок без изменений)
    const sysAttrs = SYSTEM_ATTRIBUTE_KEYS.map(
      (key) =>
        attributes.find((attr) => attr.key === key) || {
          id: `new_${key.replace(/, |%/g, '')}`,
          productId: product.id,
          key: key,
          value: '',
          isMain: true,
        },
    );
    const descAttr = attributes.find((attr) => attr.key === 'Описание') || {
      id: `new_desc`,
      value: '',
      key: 'Описание',
      isMain: true,
      productId: product.id,
    };
    const artAttr = attributes.find(
      (attr) => attr.key.toLowerCase() === 'артикул',
    );
    const custAttrs = attributes.filter(
      (attr) =>
        !SYSTEM_ATTRIBUTE_KEYS.includes(attr.key) &&
        attr.key !== 'Описание' &&
        attr.key.toLowerCase() !== 'артикул',
    );
    return {
      systemAttributes: sysAttrs,
      customAttributes: custAttrs,
      descriptionAttribute: descAttr,
      articleAttribute: artAttr,
    };
  }, [attributes, product.id]);
  const [customArticle, setCustomArticle] = useState(
    articleAttribute?.value || '',
  );
  const handleImageOrderChange = (reorderedImages: PrismaImage[]) => {
    setImages(reorderedImages);
  };
  const handleImageAdd = async (files: FileList) => {
    if (!files) return;
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        return response.json();
      });
      const results = await Promise.all(uploadPromises);
      const newImages: PrismaImage[] = results.map((result, index) => ({
        id: `new_${Date.now()}_${index}`,
        url: result.url,
        order: images.length + index,
        variantId: product.variants[0]?.id || '',
      }));
      setImages((prevImages) => [...prevImages, ...newImages]);
    } catch (error) {
      console.error(error);
      alert('Ошибка при загрузке изображений');
    } finally {
      setIsUploading(false);
    }
  };
  const handleImageRemove = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };
  const addCustomAttributeGroup = () => {
    const newAttribute: Attribute = {
      id: `new_${Date.now()}`,
      productId: product.id,
      key: '',
      value: '',
      isMain: false,
    };
    setAttributes((prev) => [...prev, newAttribute]);
  };
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(customAttributes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const currentDescAttr = attributes.find((a) => a.key === 'Описание');
    const currentArtAttr = attributes.find(
      (a) => a.key.toLowerCase() === 'артикул',
    );
    setAttributes([
      ...systemAttributes,
      ...items,
      ...(currentDescAttr ? [currentDescAttr] : []),
      ...(currentArtAttr ? [currentArtAttr] : []),
    ]);
  };
  const handleAttributeChange = (
    id: string,
    newKey: string,
    newValue: string,
    newIsMain?: boolean,
  ) => {
    setAttributes((prev) => {
      const attrExists = prev.some((attr) => attr.id === id);
      if (attrExists) {
        return prev.map((attr) =>
          attr.id === id
            ? {
                ...attr,
                key: newKey,
                value: newValue,
                isMain: newIsMain ?? attr.isMain,
              }
            : attr,
        );
      } else {
        return [
          ...prev,
          {
            id,
            key: newKey,
            value: newValue,
            isMain: newIsMain ?? true,
            productId: product.id,
          },
        ];
      }
    });
  };
  const removeCustomAttributeGroup = (id: string) => {
    setAttributes((prev) => prev.filter((attr) => attr.id !== id));
  };
  const handleDescriptionChange = (newValue: string) => {
    handleAttributeChange(descriptionAttribute.id, 'Описание', newValue, true);
  };
  const handleCustomArticleChange = (newValue: string) => {
    setCustomArticle(newValue);
    const artAttr = articleAttribute || {
      id: `new_art_${Date.now()}`,
      productId: product.id,
      key: 'Артикул',
      isMain: true,
      value: '',
    };
    handleAttributeChange(artAttr.id, 'Артикул', newValue, true);
  };
  const handlePriceChange = (field: string, value: number | null) => {
    setVariantDetails((prev) => ({ ...prev, [field]: value }));
  };
  const handleInventoryChange = (sizeId: string, stock: number) => {
    setInventory((prev) => {
      const existingItem = prev.find((item) => item.sizeId === sizeId);
      if (existingItem) {
        return prev.map((item) =>
          item.sizeId === sizeId ? { ...item, stock } : item,
        );
      } else {
        return [
          ...prev,
          {
            id: `new_${sizeId}`,
            variantId: product.variants[0]?.id || '',
            sizeId,
            stock,
          },
        ];
      }
    });
  };
  const handleSaveAsTemplate = () => {};
  const handleAddFromTemplate = () => {};
  const generateSku = () => {
    const newSku = `KYA-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setSku(newSku);
  };

  const handleSave = async (newStatus?: ProductStatus) => {
    // ... (этот блок без изменений)
    setIsSaving(true);
    const finalStatus = newStatus || status;
    const attributesToSave = attributes.filter(
      (attr) => attr.key.trim() !== '' && attr.value.trim() !== '',
    );
    let discountExpiresAt = null;
    if (discountTimerEnabled && (discountHours > 0 || discountMinutes > 0)) {
      const totalMilliseconds =
        discountHours * 60 * 60 * 1000 + discountMinutes * 60 * 1000;
      discountExpiresAt = new Date(Date.now() + totalMilliseconds);
    }

    // --- ИЗМЕНЕНИЕ: Добавляем теги в payload для сохранения ---
    const payload: UpdateProductPayload = {
      name,
      status: finalStatus,
      sku,
      variantDetails: { ...variantDetails, discountExpiresAt },
      alternativeNames,
      attributes: attributesToSave,
      images,
      inventory,
      categories: selectedCategories,
      tags: selectedTags, // <-- ДОБАВЛЕНО
    };

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Ошибка сохранения: ${errorData}`);
      }
      setStatus(finalStatus);
      alert('Сохранено успешно!');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : 'Произошла неизвестная ошибка',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <DetailManager
            name={name}
            setName={setName}
            alternativeNames={alternativeNames}
            setAlternativeNames={setAlternativeNames}
          />
          <PriceManager
            price={variantDetails.price}
            oldPrice={variantDetails.oldPrice}
            bonusPoints={variantDetails.bonusPoints}
            onPriceChange={handlePriceChange}
            discountTimerEnabled={discountTimerEnabled}
            onDiscountTimerToggle={setDiscountTimerEnabled}
            discountHours={discountHours}
            onDiscountHoursChange={setDiscountHours}
            discountMinutes={discountMinutes}
            onDiscountMinutesChange={setDiscountMinutes}
          />
          <SizeManager
            allSizes={allSizes}
            inventory={inventory}
            onInventoryChange={handleInventoryChange}
          />
          <AboutProductManager
            systemAttributes={systemAttributes}
            customAttributes={customAttributes}
            onAttributeChange={handleAttributeChange}
            onDragEnd={onDragEnd}
            onSaveAsTemplate={handleSaveAsTemplate}
            onRemoveCustomGroup={removeCustomAttributeGroup}
            onAddCustomGroup={addCustomAttributeGroup}
            onAddFromTemplate={handleAddFromTemplate}
          />
          <DescriptionManager
            value={descriptionAttribute.value}
            onChange={handleDescriptionChange}
          />
          <SkuManager
            sku={sku}
            customArticle={customArticle}
            onCustomArticleChange={handleCustomArticleChange}
            onGenerateSku={generateSku}
          />
        </div>
        <div className="space-y-8 lg:col-span-1">
          {/* --- ИЗМЕНЕНИЕ: Передаем все необходимые данные --- */}
          <CategoryManager
            allCategories={allCategories}
            allTags={allTags}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />
          <ImageManager
            images={images}
            onImageOrderChange={handleImageOrderChange}
            onImageAdd={handleImageAdd}
            onImageRemove={handleImageRemove}
          />
          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-800">
                Публикация
              </div>
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status === 'PUBLISHED' ? 'bg-green-50 text-green-700 ring-green-600/20' : status === 'ARCHIVED' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'}`}
              >
                {status === 'PUBLISHED'
                  ? 'Опубликован'
                  : status === 'ARCHIVED'
                    ? 'В архиве'
                    : 'Черновик'}
              </span>
            </div>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving || isUploading}
                className="hover:bg-opacity-80 w-full rounded-md bg-[#272727] py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              >
                {isSaving
                  ? 'Сохранение...'
                  : isUploading
                    ? 'Загрузка фото...'
                    : 'Сохранить изменения'}
              </button>
              {status !== 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => handleSave('PUBLISHED')}
                  disabled={isSaving || isUploading}
                  className="w-full rounded-md bg-green-600 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                >
                  Опубликовать
                </button>
              )}
              {status === 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => handleSave('DRAFT')}
                  disabled={isSaving || isUploading}
                  className="w-full rounded-md bg-yellow-500 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-400 disabled:opacity-50"
                >
                  Снять с публикации (в черновик)
                </button>
              )}
              {status !== 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => handleSave('ARCHIVED')}
                  disabled={isSaving || isUploading}
                  className="w-full rounded-md bg-gray-200 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 disabled:opacity-50"
                >
                  Переместить в архив
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
