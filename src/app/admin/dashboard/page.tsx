// Местоположение: src/app/admin/dashboard/page.tsx
// ФИНАЛЬНАЯ, КОРРЕКТНАЯ ВЕРСИЯ

import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export type VariantWithProductInfo = Prisma.VariantGetPayload<{
  include: {
    images: true;
    product: {
      include: {
        variants: {
          include: {
            inventory: {
              include: {
                size: true;
              };
            };
          };
        };
        categories: true;
        attributes: true;
        tags: true;
      };
    };
  };
}>;

const sizeOrder = ['S', 'M', 'L', 'XL'];
const sortInventoryBySize = (inventory: any[]) => {
  return inventory.sort((a, b) => {
    const indexA = sizeOrder.indexOf(a.size.value);
    const indexB = sizeOrder.indexOf(b.size.value);
    return indexA - indexB;
  });
};

export default async function DashboardPage() {
  const [allVariants, allCategories, allTags, filterPresets] =
    await Promise.all([
      prisma.variant.findMany({
        orderBy: {
          product: {
            createdAt: 'desc',
          },
        },
        include: {
          images: { orderBy: { order: 'asc' } },
          product: {
            include: {
              variants: {
                include: {
                  inventory: {
                    include: {
                      size: true,
                    },
                  },
                },
              },
              categories: true,
              attributes: true,
              tags: true,
            },
          },
        },
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.tag.findMany({ orderBy: { name: 'asc' } }),
      prisma.filterPreset.findMany({
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: {
              category: true,
              tag: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

  // Применяем сортировку к inventory каждого варианта.
  allVariants.forEach((variant) => {
    // ВАЖНО: Мы сортируем инвентарь во *вложенных* вариантах продукта
    variant.product.variants.forEach((productVariant) => {
      sortInventoryBySize(productVariant.inventory);
    });
  });

  return (
    <main>
      <PageContainer className="py-12">
        <ProductTable
          variants={allVariants}
          allCategories={allCategories}
          allTags={allTags}
          filterPresets={filterPresets}
        />
      </PageContainer>
    </main>
  );
}
