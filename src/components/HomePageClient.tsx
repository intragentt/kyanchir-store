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
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const scrollingToFilter = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

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
  }, [searchTerm, activeCategory, allProducts]);

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      if (activeCategory === categoryId || scrollingToFilter.current) return;
      if (filterContainerRef.current) {
        const destination = filterContainerRef.current.offsetTop;
        scrollingToFilter.current = true;
        window.scrollTo({ top: destination, behavior: 'smooth' });

        const scrollEndListener = () => {
          if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
          scrollTimeout.current = setTimeout(() => {
            window.removeEventListener('scroll', scrollEndListener);
            scrollingToFilter.current = false;
            setActiveCategory(categoryId);
          }, 100);
        };
        window.addEventListener('scroll', scrollEndListener);
      } else {
        setActiveCategory(categoryId);
      }
    },
    [activeCategory],
  );

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  return (
    <>
      <div ref={filterContainerRef}>
        <SmartStickyCategoryFilter
          onSelectCategory={handleSelectCategory}
          initialCategory={activeCategory}
          className="mb-4"
          workZoneRef={productGridRef}
          categories={categories}
        />
      </div>
      <div ref={productGridRef} className="relative min-h-[200vh]">
        <CatalogContent products={filteredProducts} isLoading={false} />
      </div>
    </>
  );
}
