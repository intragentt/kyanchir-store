// Местоположение: src/app/admin/dashboard/page.tsx
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
      };
    };
  };
}>;

export default async function DashboardPage() {
  const allVariants: VariantWithProductInfo[] = await prisma.variant.findMany({
    orderBy: {
      product: {
        createdAt: 'desc', // <-- СКОБКА УБРАНА
      },
    },
    include: {
      images: true,
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
        },
      },
    },
  });

  return (
    <main>
      <PageContainer className="py-12">
        <ProductTable variants={allVariants} />
      </PageContainer>
    </main>
  );
}
