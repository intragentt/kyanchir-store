'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import CatalogContent from '@/components/CatalogContent';
import SmartStickyCategoryFilter from '@/components/SmartStickyCategoryFilter';
import { ProductWithInfo } from '@/lib/types';

type Category = {
  id: string;
  name: string;
};

interface HomePageClientProps {
  initialProducts: ProductWithInfo[];
  categories: Category[];
}

export default function HomePageClient({
  initialProducts,
  categories,
}: HomePageClientProps) {
  const [allProducts] = useState<ProductWithInfo[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] =
    useState<ProductWithInfo[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const scrollingToFilter = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const scrollListenerRef = useRef<EventListener | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      const handleTelegramLogin = async () => {
        const res = await signIn('telegram-credentials', {
          token,
          redirect: false,
        });
        if (res?.ok) {
          router.refresh();
        } else {
          console.error('Telegram login failed:', res?.error);
        }
      };
      handleTelegramLogin();
    }
  }, [searchParams, router]);

  useEffect(() => {
    let productsToFilter = [...allProducts];
    if (searchTerm.trim() !== '') {
      productsToFilter = productsToFilter.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (activeCategory !== 'all') {
      productsToFilter = productsToFilter.filter((product) =>
        product.categoryIds.includes(activeCategory),
      );
    }
    setFilteredProducts(productsToFilter);
    setIsCatalogLoading(false);
  }, [searchTerm, activeCategory, allProducts]);

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      if (activeCategory === categoryId || scrollingToFilter.current) return;

      setIsCatalogLoading(true);
      setActiveCategory(categoryId);

      const container = filterContainerRef.current;
      if (!container) {
        return;
      }

      const destination = container.offsetTop;
      scrollingToFilter.current = true;

      function removeScrollHandling() {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
          scrollTimeout.current = null;
        }
        if (scrollListenerRef.current) {
          window.removeEventListener('scroll', scrollListenerRef.current);
          scrollListenerRef.current = null;
        }
        scrollingToFilter.current = false;
      }

      const handleScrollEvent: EventListener = () => {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        scrollTimeout.current = setTimeout(removeScrollHandling, 100);
      };

      scrollListenerRef.current = handleScrollEvent;
      window.addEventListener('scroll', handleScrollEvent);
      window.scrollTo({ top: destination, behavior: 'smooth' });
      scrollTimeout.current = setTimeout(removeScrollHandling, 600);
    },
    [activeCategory],
  );

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      if (scrollListenerRef.current) {
        window.removeEventListener('scroll', scrollListenerRef.current);
        scrollListenerRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div ref={filterContainerRef}>
        <SmartStickyCategoryFilter
          onSelectCategory={handleSelectCategory}
          activeCategory={activeCategory}
          className="mb-4"
          workZoneRef={productGridRef}
          categories={categories}
        />
      </div>
      <div ref={productGridRef} className="relative min-h-[200vh]">
        <CatalogContent products={filteredProducts} isLoading={isCatalogLoading} />
      </div>
    </>
  );
}
