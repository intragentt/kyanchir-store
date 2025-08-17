// Местоположение: src/app/admin/dashboard/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';
import { Prisma, Category, Tag } from '@prisma/client';

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

// --- НАЧАЛО ИЗМЕНЕНИЙ: "Умная" функция сортировки размеров ---
const sizeOrder = ['S', 'M', 'L', 'XL'];
const sortInventoryBySize = (inventory: any[]) => {
  return inventory.sort((a, b) => {
    const indexA = sizeOrder.indexOf(a.size.value);
    const indexB = sizeOrder.indexOf(b.size.value);
    return indexA - indexB;
  });
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default async function DashboardPage() {
  const [allVariants, allCategories, allTags] = await Promise.all([
    prisma.variant.findMany({
      orderBy: {
        product: {
          createdAt: 'desc',
        },
      },
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
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
    prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Применяем нашу новую функцию сортировки ---
  allVariants.forEach((variant) => {
    variant.product.variants.forEach((productVariant) => {
      // Сортируем inventory для каждого вложенного варианта
      sortInventoryBySize(productVariant.inventory);
    });
  });
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <main>
      <PageContainer className="py-12">
        <ProductTable
          variants={allVariants} // Теперь варианты содержат отсортированные inventory
          allCategories={allCategories}
          allTags={allTags}
        />
      </PageContainer>
    </main>
  );
}
