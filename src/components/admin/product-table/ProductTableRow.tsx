// Местоположение: src/components/admin/product-table/ProductTableRow.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ShortLogo from '@/components/icons/ShortLogo';
import { EditableCountdownTimer } from './EditableCountdownTimer';
import type { VariantWithProductInfo } from '@/app/admin/dashboard/page';
import type { Prisma, Category, Tag } from '@prisma/client';

type ProductStatus = Prisma.ProductGetPayload<{}>['status'];

const statusConfig: {
  [key in 'DRAFT' | 'PUBLISHED']: { dotClassName: string; tooltip: string };
} = {
  DRAFT: { dotClassName: 'bg-yellow-400', tooltip: 'Черновик' },
  PUBLISHED: { dotClassName: 'bg-green-400', tooltip: 'Опубликован' },
};

const formatNumberForInput = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const CategorySelect = ({
  options,
  value,
  placeholder,
  onChange,
  className,
}: {
  options: Category[];
  value: Category | undefined;
  placeholder: string;
  onChange: (id: string | null) => void;
  className: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = Math.min(options.length + 1, 5) * 30 + 10;
      const dropUp = spaceBelow < menuHeight;

      setMenuStyle({
        position: 'fixed',
        top: dropUp ? 'auto' : `${rect.bottom + 4}px`,
        bottom: dropUp ? `${window.innerHeight - rect.top + 4}px` : 'auto',
        left: `${rect.left}px`,
        minWidth: `${rect.width}px`,
      });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, options.length]);

  const handleSelect = (id: string | null) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full appearance-none rounded-md px-3 py-1.5 text-left text-xs font-medium ${className}`}
      >
        {value ? value.name : placeholder}
      </button>
      {isOpen && (
        <div
          style={menuStyle}
          className="z-10 w-max rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          <button
            onClick={() => handleSelect(null)}
            className="block w-full px-3 py-1 text-left text-xs text-gray-400 hover:bg-gray-100"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className="block w-full px-3 py-1 text-left text-xs text-gray-700 hover:bg-gray-100"
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ProductTableRowProps {
  variant: VariantWithProductInfo;
  variantIdx: number;
  isSelected: boolean;
  isEdited: boolean;
  allCategories: Category[];
  allTags: Tag[];
  onSelectOne: (variantId: string, isSelected: boolean) => void;
  onCopy: (id: string) => void;
  onStatusToggle: (currentStatus: ProductStatus, productId: string) => void;
  onNumericInputChange: (
    variantId: string,
    field: keyof VariantWithProductInfo,
    inputValue: string,
  ) => void;
  onDiscountChange: (
    variant: VariantWithProductInfo,
    newPercentStr: string,
  ) => void;
  onVariantChange: (
    variantId: string,
    field: keyof VariantWithProductInfo,
    value: any,
  ) => void;
  onInventoryChange: (
    variantId: string,
    inventoryId: string,
    inputValue: string,
  ) => void;
  onCategoryChange: (productId: string, newCategories: Category[]) => void;
  onTagsChange: (productId: string, selectedTagIds: string[]) => void;
}

const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M7 3a1 1 0 011-1h6a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 01-.707.293H3a1 1 0 01-1-1V4a1 1 0 011-1h4z" />
    <path d="M6 5v7h4.586l6.414-6.414V5H6z" />
  </svg>
);

export const ProductTableRow = ({
  variant,
  variantIdx,
  isSelected,
  isEdited,
  allCategories,
  allTags,
  onSelectOne,
  onCopy,
  onStatusToggle,
  onNumericInputChange,
  onDiscountChange,
  onVariantChange,
  onInventoryChange,
  onCategoryChange,
  onTagsChange,
}: ProductTableRowProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSkuCopied, setIsSkuCopied] = useState(false);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [tagMenuStyle, setTagMenuStyle] = useState({});
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const tagButtonRef = useRef<HTMLButtonElement>(null);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем состояние для отслеживания времени ---
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    // Если у варианта есть дата окончания скидки, запускаем таймер
    if (variant.discountExpiresAt) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now()); // Каждую секунду обновляем "текущее время"
      }, 1000);
      return () => clearInterval(interval); // Очищаем интервал при размонтировании
    }
  }, [variant.discountExpiresAt]);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const currentTagIds = new Set(variant.product.tags.map((t) => t.id));
  const availableTags = allTags.filter(
    (t) => !currentTagIds.has(t.id) && t.name.toLowerCase() !== 'скидка',
  );

  useEffect(() => {
    if (isTagMenuOpen && tagButtonRef.current) {
      const rect = tagButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = Math.min(availableTags.length, 5) * 30 + 10;
      const dropUp = spaceBelow < menuHeight;
      setTagMenuStyle({
        position: 'fixed',
        top: dropUp ? 'auto' : `${rect.bottom + 4}px`,
        bottom: dropUp ? `${window.innerHeight - rect.top + 4}px` : 'auto',
        left: `${rect.left}px`,
      });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagMenuRef.current &&
        !tagMenuRef.current.contains(event.target as Node)
      ) {
        setIsTagMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTagMenuOpen, availableTags.length]);

  const handleCopySku = () => {
    if (!variant.product.sku) return;
    navigator.clipboard.writeText(variant.product.sku);
    setIsSkuCopied(true);
    setTimeout(() => setIsSkuCopied(false), 2000);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(
      (prevIndex) => (prevIndex + 1) % variant.images.length,
    );
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(
      (prevIndex) =>
        (prevIndex - 1 + variant.images.length) % variant.images.length,
    );
  };

  const hasDiscount =
    variant.oldPrice != null && variant.oldPrice > variant.price;

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Логика теперь использует `currentTime` ---
  const isDiscountCurrentlyActive =
    hasDiscount &&
    (!variant.discountExpiresAt ||
      new Date(variant.discountExpiresAt).getTime() > currentTime);

  const finalDisplayPrice = isDiscountCurrentlyActive
    ? variant.price
    : variant.oldPrice || variant.price;
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const discountPercent =
    hasDiscount && variant.oldPrice
      ? Math.round(
          ((variant.oldPrice - variant.price) / variant.oldPrice) * 100,
        )
      : 0;

  const currentVariantData = variant.product.variants.find(
    (v) => v.id === variant.id,
  );
  const inventoryForCurrentVariant = currentVariantData
    ? currentVariantData.inventory
    : [];

  const colorAttribute = variant.product.attributes?.find(
    (attr) => attr.key === 'Цвет',
  );
  const displayColor = colorAttribute ? colorAttribute.value : variant.color;

  const rowClassName = isEdited
    ? 'bg-yellow-50'
    : variant.product.status === 'PUBLISHED'
      ? 'bg-green-50'
      : '';

  const { selectedType, selectedCategory, selectedSubCategory } = (() => {
    let type: Category | undefined;
    let category: Category | undefined;
    let subCategory: Category | undefined;

    const productCategories = variant.product.categories;
    if (productCategories.length === 0) {
      return {
        selectedType: type,
        selectedCategory: category,
        selectedSubCategory: subCategory,
      };
    }

    const deepestCat = productCategories.reduce(
      (deepest, current) => {
        const isParent = productCategories.some(
          (c) => c.parentId === current.id,
        );
        if (!isParent) {
          const getDepth = (cat: Category, depth = 0): number => {
            if (!cat.parentId) return depth;
            const parent = allCategories.find((p) => p.id === cat.parentId);
            if (!parent) return depth;
            return getDepth(parent, depth + 1);
          };
          if (!deepest || getDepth(current) > getDepth(deepest)) {
            return current;
          }
        }
        return deepest;
      },
      null as Category | null,
    );

    if (!deepestCat)
      return {
        selectedType: type,
        selectedCategory: category,
        selectedSubCategory: subCategory,
      };

    const parent = allCategories.find((p) => p.id === deepestCat.parentId);
    if (!parent) {
      type = deepestCat;
    } else {
      const grandParent = allCategories.find((gp) => gp.id === parent.parentId);
      if (!grandParent) {
        type = parent;
        category = deepestCat;
      } else {
        type = grandParent;
        category = parent;
        subCategory = deepestCat;
      }
    }
    return {
      selectedType: type,
      selectedCategory: category,
      selectedSubCategory: subCategory,
    };
  })();

  const availableTypes = allCategories.filter((c) => c.parentId === null);
  const availableCategories = selectedType
    ? allCategories.filter((c) => c.parentId === selectedType.id)
    : [];
  const availableSubCategories = selectedCategory
    ? allCategories.filter((c) => c.parentId === selectedCategory.id)
    : [];

  const handleTypeSelect = (typeId: string | null) => {
    if (!typeId) {
      onCategoryChange(variant.product.id, []);
    } else {
      const type = allCategories.find((c) => c.id === typeId);
      if (type) onCategoryChange(variant.product.id, [type]);
    }
  };

  const handleCategorySelect = (categoryId: string | null) => {
    if (!selectedType) return;
    if (!categoryId) {
      onCategoryChange(variant.product.id, [selectedType]);
    } else {
      const category = allCategories.find((c) => c.id === categoryId);
      if (category)
        onCategoryChange(variant.product.id, [selectedType, category]);
    }
  };

  const handleSubCategorySelect = (subCategoryId: string | null) => {
    if (!selectedType || !selectedCategory) return;
    if (!subCategoryId) {
      onCategoryChange(variant.product.id, [selectedType, selectedCategory]);
    } else {
      const subCategory = allCategories.find((c) => c.id === subCategoryId);
      if (subCategory)
        onCategoryChange(variant.product.id, [
          selectedType,
          selectedCategory,
          subCategory,
        ]);
    }
  };

  const handleAddTag = (tagIdToAdd: string) => {
    const newTagIds = [...currentTagIds, tagIdToAdd];
    onTagsChange(variant.product.id, newTagIds as string[]);
  };

  const handleRemoveTag = (tagIdToRemove: string) => {
    const newTagIds = variant.product.tags
      .map((t) => t.id)
      .filter((id) => id !== tagIdToRemove);
    onTagsChange(variant.product.id, newTagIds);
  };

  const handleTimerUpdate = (
    field: keyof VariantWithProductInfo,
    value: any,
  ) => {
    onVariantChange(variant.id, field, value);
  };

  const sortedTags = [...variant.product.tags].sort((a, b) => {
    if (a.name.toLowerCase() === 'скидка') return -1;
    if (b.name.toLowerCase() === 'скидка') return 1;
    return 0;
  });

  const typeClasses = selectedType
    ? 'bg-gray-100 text-gray-800'
    : 'border border-dashed border-gray-400 bg-white text-gray-500';

  const categoryClasses = selectedCategory
    ? 'bg-indigo-100 text-indigo-800'
    : 'border border-dashed border-gray-400 bg-white text-gray-500';

  const subCategoryClasses = selectedSubCategory
    ? 'bg-purple-100 text-purple-800'
    : 'border border-dashed border-gray-400 bg-white text-gray-500';

  return (
    <tr className={rowClassName}>
      <td className="relative px-6 py-4 text-sm whitespace-nowrap text-gray-500">
        <div className="flex items-center gap-x-4">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={isSelected}
            onChange={(e) => onSelectOne(variant.id, e.target.checked)}
          />
          <div className="inline-flex items-stretch rounded-md border border-gray-200 bg-white shadow-sm">
            <Link
              href={`/admin/products/${variant.productId}/edit`}
              className="flex items-center rounded-l-md px-2 py-1 text-indigo-600 hover:bg-gray-50"
            >
              Ред.
            </Link>
            <div className="relative border-l border-gray-200">
              <button
                onClick={() =>
                  onStatusToggle(variant.product.status, variant.product.id)
                }
                className="flex h-full w-8 items-center justify-center rounded-r-md transition-colors hover:bg-gray-50"
                title={`Статус: ${variant.product.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}. Нажмите для изменения.`}
              >
                {variant.product.status !== 'ARCHIVED' && (
                  <span
                    className={`block h-2.5 w-2.5 rounded-full ${statusConfig[variant.product.status].dotClassName}`}
                  ></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap">
        <div className="flex flex-col gap-1.5" style={{ maxWidth: '150px' }}>
          <CategorySelect
            options={availableTypes}
            value={selectedType}
            placeholder="Тип"
            onChange={handleTypeSelect}
            className={typeClasses}
          />

          {selectedType && (
            <CategorySelect
              options={availableCategories}
              value={selectedCategory}
              placeholder="Категория"
              onChange={handleCategorySelect}
              className={categoryClasses}
            />
          )}

          {selectedCategory && (
            <CategorySelect
              options={availableSubCategories}
              value={selectedSubCategory}
              placeholder="Подкатегория"
              onChange={handleSubCategorySelect}
              className={subCategoryClasses}
            />
          )}
        </div>
      </td>
      <td className="px-6 py-4 align-middle text-sm font-medium whitespace-nowrap text-gray-900">
        <div className="flex items-center">
          <div className="flex w-16 flex-shrink-0 flex-col items-center">
            <div className="group relative aspect-[4/5] w-16">
              <Image
                src={
                  variant.images[currentImageIndex]?.url || '/placeholder.png'
                }
                alt={variant.product.name}
                fill
                sizes="64px"
                className="rounded-md object-cover"
              />
              {variant.images.length > 1 && (
                <div className="absolute inset-0 z-10 flex flex-col opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 rounded-md bg-black/30" />
                  <div className="relative z-20 flex h-full items-center justify-between">
                    <button
                      onClick={handlePrevImage}
                      className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {variant.images.length > 1 && (
              <div className="mt-1.5 w-full text-center">
                <span className="font-mono text-xs text-gray-500">
                  {currentImageIndex + 1} / {variant.images.length}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="truncate" style={{ maxWidth: '250px' }}>
              {variant.product.name} ({displayColor})
            </div>
            <div className="flex items-center gap-x-2">
              <span className="font-mono text-xs text-gray-500">
                {variant.product.sku}
              </span>
              <button
                onClick={handleCopySku}
                className="relative text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                title="Копировать артикул"
                disabled={isSkuCopied}
              >
                {isSkuCopied ? (
                  <span className="text-xs font-semibold text-indigo-600">
                    ✓
                  </span>
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {inventoryForCurrentVariant.map((inv) => (
                <div
                  key={inv.id}
                  className="inline-flex h-6 items-center gap-x-1 rounded-md bg-gray-100 px-1.5"
                >
                  <span className="font-mono text-xs font-semibold text-gray-600">
                    {inv.size.value}:
                  </span>
                  <input
                    type="text"
                    value={inv.stock}
                    onChange={(e) =>
                      onInventoryChange(variant.id, inv.id, e.target.value)
                    }
                    className="w-4 border-none bg-transparent p-0 text-center font-mono text-xs text-gray-800 focus:ring-0"
                  />
                </div>
              ))}
            </div>
            <div className="mt-2">
              <div className="flex flex-wrap items-center gap-1">
                {sortedTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center rounded-md bg-pink-100 py-1 text-pink-800"
                  >
                    <span
                      className={
                        tag.name.toLowerCase() !== 'скидка'
                          ? 'pr-1 pl-2'
                          : 'px-2'
                      }
                    >
                      {tag.name}
                    </span>
                    {tag.name.toLowerCase() !== 'скидка' && (
                      <button
                        onClick={() => handleRemoveTag(tag.id)}
                        className="mr-1 ml-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-pink-500 hover:bg-pink-200 hover:text-pink-600"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                {availableTags.length > 0 && (
                  <div className="relative" ref={tagMenuRef}>
                    <button
                      ref={tagButtonRef}
                      onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                      className="w-auto appearance-none rounded-md border border-dashed border-gray-400 bg-white px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
                    >
                      + Метка
                    </button>
                    {isTagMenuOpen && (
                      <div
                        style={tagMenuStyle}
                        className="z-10 w-max rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                      >
                        {availableTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleAddTag(tag.id)}
                            className="block w-full px-3 py-1 text-left text-xs text-gray-700 hover:bg-gray-100"
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
        <div className="inline-flex h-6 items-center gap-x-1 rounded-md bg-[#6B80C5]/10 px-1.5 py-0.5">
          <input
            type="text"
            value={formatNumberForInput(variant.bonusPoints) || '0'}
            onChange={(e) =>
              onNumericInputChange(variant.id, 'bonusPoints', e.target.value)
            }
            className="w-12 border-none bg-transparent p-0 text-center text-sm font-bold text-[#6B80C5] focus:ring-0"
          />
          <ShortLogo
            className="h-4 w-4 flex-shrink-0"
            style={{ color: '#6B80C5' }}
          />
        </div>
      </td>
      <td className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-800">
        <div className="inline-flex h-6 items-center gap-x-1 rounded-md bg-gray-100 px-1.5 py-0.5">
          <input
            type="text"
            placeholder="Цена"
            value={formatNumberForInput(variant.oldPrice ?? variant.price)}
            onChange={(e) =>
              onNumericInputChange(variant.id, 'oldPrice', e.target.value)
            }
            className={`w-16 border-none bg-transparent p-0 text-center text-sm focus:ring-0 ${
              hasDiscount ? 'text-gray-500 line-through' : ''
            }`}
          />
          <span className="font-semibold text-gray-500">RUB</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
        <div
          className={`inline-flex h-6 min-w-[5ch] items-center justify-center gap-x-1 rounded-md px-1.5 ${
            discountPercent > 0 ? 'bg-red-100' : 'bg-gray-100'
          }`}
        >
          <input
            type="number"
            value={discountPercent}
            onChange={(e) => onDiscountChange(variant, e.target.value)}
            className={`w-8 border-none bg-transparent p-0 text-center text-sm focus:ring-0 ${
              discountPercent > 0 ? 'font-bold text-red-800' : 'text-gray-700'
            }`}
          />
          <span
            className={`font-semibold ${
              discountPercent > 0 ? 'text-red-800' : 'text-gray-700'
            }`}
          >
            %
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
        <EditableCountdownTimer
          variant={variant}
          hasDiscount={hasDiscount}
          onUpdate={handleTimerUpdate}
        />
      </td>
      <td className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-800">
        <div
          className={`inline-flex h-6 items-center gap-x-1 rounded-md px-1.5 py-0.5 ${
            isDiscountCurrentlyActive ? 'bg-green-50' : 'bg-gray-100'
          }`}
        >
          <input
            type="text"
            value={formatNumberForInput(finalDisplayPrice)}
            onChange={(e) =>
              onNumericInputChange(variant.id, 'price', e.target.value)
            }
            className={`w-16 border-none bg-transparent p-0 text-center text-sm font-bold focus:ring-0 ${
              isDiscountCurrentlyActive ? 'text-green-800' : 'text-gray-800'
            }`}
          />
          <span
            className={`font-semibold ${
              isDiscountCurrentlyActive ? 'text-green-800' : 'text-gray-800'
            }`}
          >
            RUB
          </span>
        </div>
      </td>
    </tr>
  );
};
