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
  const loaderStartTimeRef = useRef<number | null>(null);
  const loaderMinDelayRef = useRef<NodeJS.Timeout | null>(null);
  const loaderMaxDelayRef = useRef<NodeJS.Timeout | null>(null);

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

    if (isCatalogLoading) {
      const MIN_LOADER_DURATION = 1000;

      if (loaderMinDelayRef.current) {
        clearTimeout(loaderMinDelayRef.current);
        loaderMinDelayRef.current = null;
      }

      const startedAt = loaderStartTimeRef.current;
      if (startedAt === null) {
        setIsCatalogLoading(false);
        loaderStartTimeRef.current = null;
        if (loaderMaxDelayRef.current) {
          clearTimeout(loaderMaxDelayRef.current);
          loaderMaxDelayRef.current = null;
        }
      } else {
        const elapsed = Date.now() - startedAt;

        if (elapsed >= MIN_LOADER_DURATION) {
          setIsCatalogLoading(false);
          loaderStartTimeRef.current = null;
          loaderMinDelayRef.current = null;
          if (loaderMaxDelayRef.current) {
            clearTimeout(loaderMaxDelayRef.current);
            loaderMaxDelayRef.current = null;
          }
        } else {
          loaderMinDelayRef.current = setTimeout(() => {
            setIsCatalogLoading(false);
            loaderStartTimeRef.current = null;
            loaderMinDelayRef.current = null;
            if (loaderMaxDelayRef.current) {
              clearTimeout(loaderMaxDelayRef.current);
              loaderMaxDelayRef.current = null;
            }
          }, MIN_LOADER_DURATION - elapsed);
        }
      }
    }
  }, [
    searchTerm,
    activeCategory,
    allProducts,
    isCatalogLoading,
  ]);

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      if (activeCategory === categoryId || scrollingToFilter.current) return;

      if (loaderMinDelayRef.current) {
        clearTimeout(loaderMinDelayRef.current);
        loaderMinDelayRef.current = null;
      }
      if (loaderMaxDelayRef.current) {
        clearTimeout(loaderMaxDelayRef.current);
        loaderMaxDelayRef.current = null;
      }

      loaderStartTimeRef.current = Date.now();
      setIsCatalogLoading(true);
      loaderMaxDelayRef.current = setTimeout(() => {
        setIsCatalogLoading(false);
        loaderStartTimeRef.current = null;
        if (loaderMinDelayRef.current) {
          clearTimeout(loaderMinDelayRef.current);
          loaderMinDelayRef.current = null;
        }
        loaderMaxDelayRef.current = null;
      }, 3000);
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
      if (loaderMinDelayRef.current) {
        clearTimeout(loaderMinDelayRef.current);
        loaderMinDelayRef.current = null;
      }
      if (loaderMaxDelayRef.current) {
        clearTimeout(loaderMaxDelayRef.current);
        loaderMaxDelayRef.current = null;
      }
      loaderStartTimeRef.current = null;
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
