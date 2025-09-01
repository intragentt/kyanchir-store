// /src/app/api/admin/sync/products/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getMoySkladProducts } from '@/lib/moysklad-api';

// --- ИСПРАВЛЕНИЕ ОПЕЧАТКИ ЗДЕСЬ ---
interface MoySkladPrice {
  value: number;
  priceType: {
    name: string;
  };
}

interface MoySkladProduct {
  id: string;
  name: string;
  description?: string;
  productFolder?: {
    meta: {
      href: string;
    };
  };
  salePrices?: MoySkladPrice[];
}
// --- КОНЕЦ ИСПРАВЛЕНИЯ ---

function getUUIDFromHref(href: string): string {
  return href.split('/').pop() || '';
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    const moySkladResponse = await getMoySkladProducts();
    const moySkladProducts: MoySkladProduct[] = moySkladResponse.rows || [];

    if (moySkladProducts.length === 0) {
      return NextResponse.json({
        message: 'Товары в МойСклад не найдены.',
        synchronizedCount: 0,
      });
    }

    const allOurCategories = await prisma.category.findMany({
      select: { id: true, moyskladId: true },
    });
    const categoryMap = new Map<string, string>();
    allOurCategories.forEach(
      (cat) => cat.moyskladId && categoryMap.set(cat.moyskladId, cat.id),
    );

    const upsertPromises = moySkladProducts.map((product) => {
      const categoryMoySkladId = product.productFolder
        ? getUUIDFromHref(product.productFolder.meta.href)
        : null;

      const ourCategoryId = categoryMoySkladId
        ? categoryMap.get(categoryMoySkladId)
        : undefined;

      const salePriceObject = (product.salePrices || []).find(
        (p) => p.priceType.name === 'Цена продажи',
      );
      const price = salePriceObject ? Math.round(salePriceObject.value) : 0;

      return prisma.product.upsert({
        where: { moyskladId: product.id },
        update: {
          name: product.name,
          description: product.description || '',
          categories: ourCategoryId
            ? { connect: { id: ourCategoryId } }
            : undefined,
          variants: {
            updateMany: {
              where: {
                // Просто обновляем все варианты этого продукта, если их несколько.
                // Это упрощение, в идеале нужно матчить варианты по SKU или другому ID.
              },
              data: { price: price },
            },
          },
        },
        create: {
          name: product.name,
          description: product.description || '',
          moyskladId: product.id,
          categories: ourCategoryId
            ? { connect: { id: ourCategoryId } }
            : undefined,
          variants: {
            create: {
              price: price,
            },
          },
        },
      });
    });

    await prisma.$transaction(upsertPromises);

    return NextResponse.json({
      message: 'Синхронизация товаров успешно завершена.',
      synchronizedCount: moySkladProducts.length,
    });
  } catch (error) {
    console.error('[API SYNC PRODUCTS ERROR]:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Внутренняя ошибка сервера. Смотрите логи Vercel.',
      }),
      { status: 500 },
    );
  }
}
