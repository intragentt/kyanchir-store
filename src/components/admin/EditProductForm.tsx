// Местоположение: src/components/admin/EditProductForm.tsx
'use client';

import { useState, useMemo } from 'react';
import { ProductWithDetails } from '@/app/admin/products/[id]/edit/page';
import { DropResult } from '@hello-pangea/dnd';
import {
  AlternativeName,
  Attribute,
  Image as PrismaImage,
  Size,
  Inventory,
  Category, // <-- ИЗМЕНЕНИЕ: Импортирован тип Category
} from '@prisma/client';

import DetailManager from './edit-product-form/DetailManager';
import AboutProductManager from './edit-product-form/AboutProductManager';
import DescriptionManager from './edit-product-form/DescriptionManager';
import SkuManager from './edit-product-form/SkuManager';
import ImageManager from './edit-product-form/ImageManager';
import PriceManager from './edit-product-form/PriceManager';
import SizeManager from './edit-product-form/SizeManager';

const SYSTEM_ATTRIBUTE_KEYS = ['Цвет', 'Состав, %'];

interface EditProductFormProps {
  product: ProductWithDetails;
  allSizes: Size[];
  allCategories: Category[]; // <-- ИЗМЕНЕНИЕ: Добавлено свойство allCategories
}

export default function EditProductForm({
  product,
  allSizes,
  allCategories, // <-- ИЗМЕНЕНИЕ: allCategories теперь принимается как параметр
}: EditProductFormProps) {
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

  const {
    systemAttributes,
    customAttributes,
    descriptionAttribute,
    articleAttribute,
  } = useMemo(() => {
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
    /* ... */
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const attributesToSave = attributes.filter(
      (attr) => attr.key.trim() !== '' && attr.value.trim() !== '',
    );
    let discountExpiresAt = null;
    if (discountTimerEnabled && (discountHours > 0 || discountMinutes > 0)) {
      const totalMilliseconds =
        discountHours * 60 * 60 * 1000 + discountMinutes * 60 * 1000;
      discountExpiresAt = new Date(Date.now() + totalMilliseconds);
    }
    const dataToSave = {
      name,
      alternativeNames,
      status,
      attributes: attributesToSave,
      sku,
      images,
      variantDetails: { ...variantDetails, discountExpiresAt },
      inventory,
    };
    console.log('Сохраняем данные:', dataToSave);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Данные сохранены!');
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
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
          <ImageManager
            images={images}
            onImageOrderChange={handleImageOrderChange}
            onImageAdd={handleImageAdd}
            onImageRemove={handleImageRemove}
          />
          <div className="rounded-lg border bg-white p-6">
            <div className="text-lg font-semibold text-gray-800">
              Публикация
            </div>
            <div className="mt-6">
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="hover:bg-opacity-80 w-full rounded-md bg-[#272727] py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              >
                {isSaving
                  ? 'Сохранение...'
                  : isUploading
                    ? 'Загрузка фото...'
                    : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
