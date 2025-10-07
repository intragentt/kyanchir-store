// Местоположение: src/components/ProductDetails.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Prisma } from '@prisma/client';
import ArrowStep1 from '@/components/illustrations/ArrowStep1';
import DesktopActionButtons from '@/components/site/product/DesktopActionButtons';
import DesktopProductGallery from '@/components/site/product/DesktopProductGallery';
import MobileProductGallery from '@/components/site/product/MobileProductGallery';
import ProductActions from '@/components/site/product/ProductActions';
import ProductAttributes from '@/components/site/product/ProductAttributes';
import ProductHeader from '@/components/site/product/ProductHeader';
import SizeChart from '@/components/site/product/SizeChart';
import SizeGuideContent from '@/components/site/product/SizeGuideContent';
import SizeSelector from '@/components/site/product/SizeSelector';
import AddToCartButton from '@/components/site/product/AddToCartButton';
import BottomSheet from '@/components/shared/ui/BottomSheet';
import { CheckIcon, XMarkIcon } from '@/components/shared/icons';
import { useCartStore } from '@/store/useCartStore';
import { useAppStore } from '@/store/useAppStore';
import { createSlug } from '@/utils/createSlug';

// ... (компоненты CountdownTimer и MobileSizeGuideWithAccordion остаются без изменений) ...
const CountdownTimer = ({
  expiryDate,
}: {
  expiryDate: Date | null | undefined;
}) => {
  const calculateTimeLeft = () => {
    if (!expiryDate) return null;
    const difference = +new Date(expiryDate) - +new Date();
    let timeLeft: { [key: string]: number } = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (!expiryDate) return;
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  if (!timeLeft || Object.keys(timeLeft).length === 0) return null;

  const timerComponents = Object.entries(timeLeft)
    .map(([interval, value]) => {
      if (value < 0) return null;
      if (interval === 'days' && value === 0) return null;
      return (
        <span key={interval} className="font-mono text-base font-medium">
          {String(value).padStart(2, '0')}
        </span>
      );
    })
    .filter(Boolean)
    .reduce((prev: any, curr: any, index: number) => {
      if (!prev) return [curr];
      return [
        ...prev,
        <span key={`sep-${index}`} className="opacity-50">
          :
        </span>,
        curr,
      ];
    }, null);

  return (
    <div className="inline-flex items-center gap-x-1 rounded-md bg-[#272727] px-2.5 py-1.5 text-white">
      {timerComponents}
    </div>
  );
};

const MobileSizeGuideWithAccordion = () => {
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const sizeData = [
    { size: 'S', og: '80-86', opg: '70-77', ot: '60-66', ob: '90-94' },
    { size: 'M', og: '87-91', opg: '78-82', ot: '67-72', ob: '95-99' },
    { size: 'L', og: '92-100', opg: '83-86', ot: '73-78', ob: '99-106' },
    { size: 'XL', og: '100-103', opg: '87-90', ot: '79-81', ob: '107-108' },
  ];

  return (
    <>
      <div className="font-body text-base font-semibold text-gray-500">
        Таблица размеров
      </div>
      <div className="mt-4 font-body text-sm text-gray-800">
        <div className="grid grid-cols-5 gap-x-2 pb-2 text-xs font-semibold text-gray-400">
          <div />
          <div className="text-center">ОГ</div>
          <div className="text-center">ОПГ</div>
          <div className="text-center">ОТ</div>
          <div className="text-center">ОБ</div>
        </div>
        {sizeData.map(({ size, og, opg, ot, ob }) => (
          <div
            key={size}
            className="grid grid-cols-5 items-center gap-x-2 pt-3"
          >
            <div className="text-left font-semibold">{size}</div>
            <div className="text-center">{og}</div>
            <div className="text-center">{opg}</div>
            <div className="text-center">{ot}</div>
            <div className="text-center">{ob}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t border-gray-200 pt-4">
        <button
          onClick={() => setIsHowToOpen(!isHowToOpen)}
          className="flex w-full items-center justify-between font-body text-base font-semibold text-gray-800"
        >
          <span>Как определить размер?</span>
          <span
            className={`transform transition-transform ${isHowToOpen ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </button>
        {isHowToOpen && (
          <div className="animate-fade-in mt-4">
            <p className="whitespace-pre-line font-body text-base font-medium text-[#272727]">
              {`Узнай, как правильно определить свой размер 
нижнего белья — мы собрали простое и наглядное 
руководство, чтобы каждый комплект идеально 
подчёркивал твою фигуру и был удобным 
с первого дня`}
            </p>
            <div className="relative mt-4">
              <ArrowStep1 className="absolute left-[50px] top-[-10px] h-auto w-[120px]" />
              <Image
                src="/images/how-to-measure.png"
                width={345}
                height={200}
                alt="Как правильно снимать мерки"
                className="rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// --- НАЧАЛО ИЗМЕНЕНИЙ (1/4): Обновляем тип, чтобы он соответствовал данным из Prisma ---
type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    variants: {
      include: {
        images: true;
        sizes: {
          // <-- ИЗМЕНЕНО: inventory -> sizes
          include: {
            size: true;
          };
        };
      };
    };
    attributes: true;
    status: true;
  };
}>;
// --- КОНЕЦ ИЗМЕНЕНИЙ (1/4) ---

interface ProductInfoBlockProps {
  product: ProductWithDetails;
  selectedVariant: ProductWithDetails['variants'][0];
  isDiscountActive: boolean;
  quantity: number;
  handleAddToCart: () => void;
  handleIncrease: () => void;
  handleDecrease: () => void;
  isAddToCartDisabled: boolean;
  isIncreaseDisabled: boolean;
  selectedSize: string | null;
  handleSelectSize: (size: string) => void;
  setActiveSheet: (sheet: 'sizeSelector' | 'sizeChart' | null) => void;
}

const ProductInfoBlock = ({
  product,
  selectedVariant,
  isDiscountActive,
  quantity,
  handleAddToCart,
  handleIncrease,
  handleDecrease,
  isAddToCartDisabled,
  isIncreaseDisabled,
  selectedSize,
  handleSelectSize,
  setActiveSheet,
}: ProductInfoBlockProps) => {
  return (
    <>
      <ProductHeader
        name={product.name}
        price={selectedVariant.price}
        oldPrice={selectedVariant.oldPrice}
        bonusPoints={selectedVariant.bonusPoints}
        isDiscountActive={isDiscountActive}
      />

      <div className="mt-6 hidden lg:block">
        <AddToCartButton
          quantity={quantity}
          onAddToCart={handleAddToCart}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          isAddToCartDisabled={isAddToCartDisabled}
          isIncreaseDisabled={isIncreaseDisabled}
        />
      </div>

      <div className="mt-6">
        <div className="mb-4 font-body text-base font-medium text-text-primary">
          Размер
        </div>
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ (2/4): Передаем правильные данные в SizeSelector --- */}
        {/* Примечание: сам компонент SizeSelector тоже нужно будет обновить, чтобы он принимал prop 'sizes' вместо 'inventory' */}
        <SizeSelector
          inventory={selectedVariant.sizes} // <-- ИЗМЕНЕНО: inventory -> sizes
          selectedSize={selectedSize}
          onSelectSize={handleSelectSize}
        />
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ (2/4) --- */}
      </div>

      <div className="mt-6">
        <SizeChart onClick={() => setActiveSheet('sizeChart')} />
      </div>

      <div className="mt-4">
        <ProductAttributes attributes={product.attributes} />
      </div>
      <div className="mt-6">
        <ProductActions />
      </div>
    </>
  );
};

interface ProductDetailsProps {
  product: ProductWithDetails;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [activeSheet, setActiveSheet] = useState<
    'sizeSelector' | 'sizeChart' | null
  >(null);

  const addItemToCart = useCartStore((state) => state.addItem);
  const showNotification = useAppStore((state) => state.showNotification);

  const [isDiscountActive, setIsDiscountActive] = useState(() => {
    const hasOldPrice =
      selectedVariant.oldPrice &&
      selectedVariant.oldPrice > selectedVariant.price;
    if (!hasOldPrice) return false;

    if (selectedVariant.discountExpiresAt) {
      return +new Date(selectedVariant.discountExpiresAt) > Date.now();
    }
    return true;
  });

  useEffect(() => {
    if (!selectedVariant.discountExpiresAt) {
      return;
    }

    const checkExpiry = () => {
      const isStillActive =
        +new Date(selectedVariant.discountExpiresAt!) > Date.now();
      if (!isStillActive) {
        setIsDiscountActive(false);
        clearInterval(interval);
      }
    };

    const interval = setInterval(checkExpiry, 1000);
    checkExpiry();

    return () => clearInterval(interval);
  }, [selectedVariant.discountExpiresAt]);

  // --- НАЧАЛО ИЗМЕНЕНИЙ (3/4): Вычисляем сток на основе правильного поля 'sizes' ---
  const availableStock =
    selectedVariant.sizes.find(
      (sizeInfo) => sizeInfo.size.value === selectedSize,
    )?.stock ?? 0;
  // --- КОНЕЦ ИЗМЕНЕНИЙ (3/4) ---

  useEffect(() => {
    if (quantity > availableStock) {
      setQuantity(availableStock);
    }
  }, [selectedSize, availableStock, quantity]);

  const handleSelectSize = (sizeValue: string) => {
    const newSize = selectedSize === sizeValue ? null : sizeValue;
    setSelectedSize(newSize);

    if (activeSheet === 'sizeSelector' && newSize !== null) {
      setQuantity(1);
    }

    setActiveSheet(null);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      setActiveSheet('sizeSelector');
      return;
    }
    const sizeInfo = selectedVariant.sizes.find(
      (size) => size.size.value === selectedSize,
    );

    if (!sizeInfo || sizeInfo.stock <= 0) {
      showNotification(
        'Выбранный размер временно недоступен',
        'error',
        XMarkIcon,
      );
      return;
    }

    const quantityToAdd = quantity > 0 ? quantity : 1;
    const safeQuantity = Math.min(quantityToAdd, sizeInfo.stock);

    addItemToCart(
      {
        productId: product.id,
        productSlug: product.slug ?? createSlug(product.name),
        variantId: selectedVariant.id,
        productSizeId: sizeInfo.id,
        name: product.name,
        size: sizeInfo.size.value,
        color: selectedVariant.color,
        price: sizeInfo.price ?? selectedVariant.price,
        imageUrl: selectedVariant.images[0]?.url ?? null,
        maxQuantity: sizeInfo.stock,
      },
      safeQuantity,
    );

    setQuantity(safeQuantity);
    showNotification('Товар добавлен в корзину', 'success', CheckIcon);
  };

  const handleIncrease = () => {
    setQuantity((prev) => {
      if (!selectedSize) {
        return 0;
      }

      if (availableStock <= 0) {
        return 0;
      }

      const baseQuantity = prev <= 0 ? 1 : prev;
      return Math.min(baseQuantity + 1, availableStock);
    });
  };

  const handleDecrease = () => {
    setQuantity((prev) => {
      if (!selectedSize) {
        return 0;
      }

      if (prev <= 1) {
        return 1;
      }

      return prev - 1;
    });
  };

  const isAddToCartDisabled = !selectedSize || availableStock <= 0;
  const isIncreaseDisabled = quantity >= availableStock;

  if (!product || !selectedVariant) {
    return <h2>Товар не найден.</h2>;
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-[15px] lg:px-8 lg:pt-[95px]">
        <div className="pb-32 lg:hidden">
          <div className="mx-[-15px]">
            <MobileProductGallery
              images={selectedVariant.images}
              productName={product.name}
            />
          </div>
          <div className="mt-6">
            <ProductInfoBlock
              product={product}
              selectedVariant={selectedVariant}
              isDiscountActive={isDiscountActive}
              quantity={quantity}
              handleAddToCart={handleAddToCart}
              handleIncrease={handleIncrease}
              handleDecrease={handleDecrease}
              isAddToCartDisabled={isAddToCartDisabled}
              isIncreaseDisabled={isIncreaseDisabled}
              selectedSize={selectedSize}
              handleSelectSize={handleSelectSize}
              setActiveSheet={setActiveSheet}
            />
          </div>
        </div>

        <main className="hidden lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-4 xl:gap-x-8">
          <div className="col-span-1">
            <DesktopActionButtons />
          </div>
          <div className="col-span-5 xl:col-span-6">
            <DesktopProductGallery
              images={selectedVariant.images}
              productName={product.name}
            />
          </div>
          <div className="col-span-6 xl:col-span-5">
            <div className="max-w-lg">
              <ProductInfoBlock
                product={product}
                selectedVariant={selectedVariant}
                isDiscountActive={isDiscountActive}
                quantity={quantity}
                handleAddToCart={handleAddToCart}
                handleIncrease={handleIncrease}
                handleDecrease={handleDecrease}
                isAddToCartDisabled={isAddToCartDisabled}
                isIncreaseDisabled={isIncreaseDisabled}
                selectedSize={selectedSize}
                handleSelectSize={handleSelectSize}
                setActiveSheet={setActiveSheet}
              />
            </div>
          </div>
        </main>
      </div>

      <BottomSheet
        isOpen={activeSheet === 'sizeChart'}
        onClose={() => setActiveSheet(null)}
        title="Таблица размеров"
      >
        <SizeGuideContent />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'sizeSelector'}
        onClose={() => setActiveSheet(null)}
        title="Выберите размер"
      >
        <div className="flex h-full flex-col">
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 pb-4 pt-2">
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ (4/4): Передаем правильные данные и здесь --- */}
            <SizeSelector
              inventory={selectedVariant.sizes} // <-- ИЗМЕНЕНО: inventory -> sizes
              selectedSize={selectedSize}
              onSelectSize={handleSelectSize}
            />
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ (4/4) --- */}
          </div>
          <div className="flex-grow overflow-y-auto px-4 pb-4">
            <div className="mt-6">
              <MobileSizeGuideWithAccordion />
            </div>
          </div>
        </div>
      </BottomSheet>

      <div className="mobile-sticky-footer fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:hidden">
        {isDiscountActive && selectedVariant.discountExpiresAt && (
          <div className="flex items-center gap-x-2 border-t border-gray-200 px-4 pb-2 pt-3">
            <CountdownTimer expiryDate={selectedVariant.discountExpiresAt} />
            <span className="text-sm font-medium text-gray-600">
              до конца акции
            </span>
          </div>
        )}
        <div
          className={`pb-safe-or-4 px-4 pb-2 pt-4 ${!isDiscountActive || !selectedVariant.discountExpiresAt ? 'border-t border-gray-200' : ''}`}
        >
          <AddToCartButton
            quantity={quantity}
            onAddToCart={handleAddToCart}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            isAddToCartDisabled={false}
            isIncreaseDisabled={isIncreaseDisabled}
          />
        </div>
      </div>

      <div className="h-[200vh] bg-white" />
    </>
  );
}
