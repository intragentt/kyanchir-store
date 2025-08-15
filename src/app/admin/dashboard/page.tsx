// Местоположение: src/app/admin/dashboard/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';
import { Prisma, Category, Tag } from '@prisma/client'; // Импортируем типы Category и Tag

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

export default async function DashboardPage() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Загружаем варианты, категории и метки одновременно
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
      // <-- ДОБАВЛЕН ЗАПРОС ДЛЯ МЕТОК
      orderBy: {
        name: 'asc',
      },
    }),
  ]);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <main>
      <PageContainer className="py-12">
        {/* Передаем в таблицу все необходимые данные */}
        <ProductTable
          variants={allVariants}
          allCategories={allCategories}
          allTags={allTags} // <-- ПЕРЕДАЕМ МЕТКИ
        />
      </PageContainer>
    </main>
  );
}
