// Местоположение: src/components/ProductDetails.tsx
'use client';

// --- ИЗМЕНЕНИЕ: `useEffect` и `useRef` здесь больше не нужны ---
import { useState } from 'react';
import { Prisma } from '@prisma/client';
import MobileProductGallery from './product-details/MobileProductGallery';
import DesktopProductGallery from './product-details/DesktopProductGallery';
import ProductHeader from './product-details/ProductHeader';
import AddToCartButton from './product-details/AddToCartButton';
import SizeSelector from './product-details/SizeSelector';
import SizeChart from './product-details/SizeChart';
import ProductAttributes from './product-details/ProductAttributes';
// Возвращаем импорт вашего оригинального BottomSheet
import BottomSheet from '@/components/ui/BottomSheet';
import SizeGuideContent from './product-details/SizeGuideContent';
import DesktopActionButtons from './product-details/DesktopActionButtons';

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

  const handleSelectSize = (sizeValue: string) => {
    setSelectedSize((currentSize) =>
      currentSize === sizeValue ? null : sizeValue,
    );
  };

  // --- ИЗМЕНЕНИЕ: Весь useEffect для блокировки скролла отсюда УДАЛЕН ---
  // Теперь за это полностью отвечает компонент BottomSheet.

  if (!product || !selectedVariant) {
    return <h2>Товар не найден.</h2>;
  }

  const ProductInfoBlock = () => (
    <>
      <ProductHeader
        name={product.name}
        price={selectedVariant.price}
        oldPrice={selectedVariant.oldPrice}
      />
      <div className="mt-[15px]">
        <AddToCartButton />
      </div>
      <div className="mt-6">
        <SizeSelector
          inventory={selectedVariant.inventory}
          selectedSize={selectedSize}
          onSelectSize={handleSelectSize}
        />
      </div>
      <div className="mt-4">
        <SizeChart onClick={() => setIsSizeChartOpen(true)} />
      </div>
      <div>
        <ProductAttributes attributes={product.attributes} />
      </div>
    </>
  );

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

      {/* Вызов вашего оригинального BottomSheet, который теперь работает правильно */}
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
