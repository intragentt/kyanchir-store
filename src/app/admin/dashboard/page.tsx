// Местоположение: src/app/admin/dashboard/page.tsx

import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export type ProductForTable = Prisma.ProductGetPayload<{
  include: {
    categories: true;
    tags: true;
    attributes: true;
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
  };
}>;

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const sortVariantsBySize = (variants: any[]) => {
  return variants.sort((a, b) => {
    const sizeA = a.inventory[0]?.size.value;
    const sizeB = b.inventory[0]?.size.value;
    const indexA = sizeA ? sizeOrder.indexOf(sizeA) : Infinity;
    const indexB = sizeB ? sizeOrder.indexOf(sizeB) : Infinity;
    return indexA - indexB;
  });
};

export default async function DashboardPage() {
  const [allProducts, allCategories, allTags, filterPresets] =
    await Promise.all([
      prisma.product.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          categories: true,
          tags: true,
          attributes: true,
          variants: {
            orderBy: { createdAt: 'asc' },
            include: {
              images: { orderBy: { order: 'asc' } },
              inventory: {
                include: {
                  size: true,
                },
              },
            },
          },
        },
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.tag.findMany({ orderBy: { name: 'asc' } }),
      prisma.filterPreset.findMany({
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: { category: true, tag: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

  allProducts.forEach((product) => {
    sortVariantsBySize(product.variants);
  });

  return (
    <main>
      <PageContainer className="py-12">
        <ProductTable
          products={allProducts}
          allCategories={allCategories}
          allTags={allTags}
          filterPresets={filterPresets as any}
        />
      </PageContainer>
    </main>
  );
}
