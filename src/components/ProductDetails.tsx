// Местоположение: src/components/ProductDetails.tsx
'use client';

import { useState, useEffect } from 'react';
import { Prisma } from '@prisma/client';
import MobileProductGallery from './product-details/MobileProductGallery';
import DesktopProductGallery from './product-details/DesktopProductGallery';
import ProductHeader from './product-details/ProductHeader';
import AddToCartButton from './product-details/AddToCartButton';
import SizeSelector from './product-details/SizeSelector';
import SizeChart from './product-details/SizeChart';
import ProductAttributes from './product-details/ProductAttributes';
import BottomSheet from '@/components/ui/BottomSheet';
import SizeGuideContent from './product-details/SizeGuideContent';
import DesktopActionButtons from './product-details/DesktopActionButtons';

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

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    variants: {
      include: {
        images: true;
        inventory: {
          include: {
            size: true;
          };
        };
      };
    };
    attributes: true;
  };
}>;

interface ProductDetailsProps {
  product: ProductWithDetails;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавлена логика управления состоянием скидки ---
  const [isDiscountActive, setIsDiscountActive] = useState(
    () =>
      !!(
        selectedVariant.discountExpiresAt &&
        +new Date(selectedVariant.discountExpiresAt) > Date.now()
      ),
  );

  useEffect(() => {
    if (!selectedVariant.discountExpiresAt) {
      setIsDiscountActive(false);
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
    // Проверяем сразу при монтировании
    checkExpiry();

    return () => clearInterval(interval);
  }, [selectedVariant.discountExpiresAt]);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const handleSelectSize = (sizeValue: string) => {
    setSelectedSize((currentSize) =>
      currentSize === sizeValue ? null : sizeValue,
    );
  };

  if (!product || !selectedVariant) {
    return <h2>Товар не найден.</h2>;
  }

  const ProductInfoBlock = () => {
    return (
      <>
        <ProductHeader
          name={product.name}
          price={selectedVariant.price}
          oldPrice={selectedVariant.oldPrice}
          bonusPoints={selectedVariant.bonusPoints}
          // --- ИЗМЕНЕНИЕ: Передаем состояние скидки в дочерний компонент ---
          isDiscountActive={isDiscountActive}
        />

        {/* --- ИЗМЕНЕНИЕ: Отображение таймера теперь зависит от isDiscountActive --- */}
        {isDiscountActive && (
          <div className="mt-4 flex items-center gap-x-2">
            <CountdownTimer expiryDate={selectedVariant.discountExpiresAt} />
            <span className="text-sm font-medium text-gray-600">
              до конца акции
            </span>
          </div>
        )}

        <div className="mt-6">
          <AddToCartButton />
        </div>

        <div className="mt-6">
          <SizeSelector
            inventory={selectedVariant.inventory}
            selectedSize={selectedSize}
            onSelectSize={handleSelectSize}
          />
        </div>
        <div className="mt-3">
          <SizeChart onClick={() => setIsSizeChartOpen(true)} />
        </div>
        <div className="mt-4">
          <ProductAttributes attributes={product.attributes} />
        </div>
      </>
    );
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-[15px] lg:px-8 lg:pt-[95px]">
        <div className="lg:hidden">
          <div className="mx-[-15px]">
            <MobileProductGallery
              images={selectedVariant.images}
              productName={product.name}
            />
          </div>
          <div className="mt-[10px]">
            <ProductInfoBlock />
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
              <ProductInfoBlock />
            </div>
          </div>
        </main>
      </div>

      <BottomSheet
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        title="Таблица размеров"
      >
        <SizeGuideContent />
      </BottomSheet>

      <div className="h-[200vh] bg-white" />
    </>
  );
}
