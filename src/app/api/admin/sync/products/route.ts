// /src/app/api/admin/sync/products/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getMoySkladProducts } from '@/lib/moysklad-api';

// Интерфейсы для типизации ответа от МойСклад
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

// Вспомогательная функция для извлечения ID из URL-ссылки
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

    // Создаем карту существующих категорий для быстрой связки
    const allOurCategories = await prisma.category.findMany({
      select: { id: true, moyskladId: true },
    });
    const categoryMap = new Map<string, string>();
    allOurCategories.forEach(
      (cat) => cat.moyskladId && categoryMap.set(cat.moyskladId, cat.id),
    );

    // Готовим массив "обещаний" для всех операций upsert
    const upsertPromises = moySkladProducts.map((product) => {
      const categoryMoySkladId = product.productFolder
        ? getUUIDFromHref(product.productFolder.meta.href)
        : null;

      const ourCategoryId = categoryMoySkladId
        ? categoryMap.get(categoryMoySkladId)
        : undefined;

      // Ищем цену с типом "Цена продажи" и переводим её в копейки
      const salePriceObject = (product.salePrices || []).find(
        (p) => p.priceType.name === 'Цена продажи',
      );
      const priceInCents = salePriceObject
        ? Math.round(salePriceObject.value * 100)
        : 0;

      return prisma.product.upsert({
        where: { moyskladId: product.id },
        update: {
          name: product.name,
          description: product.description || '',
          categories: ourCategoryId
            ? { connect: { id: ourCategoryId } }
            : undefined,
          // Можно добавить и обновление цены варианта, если нужно
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
              price: priceInCents, // цена в копейках
            },
          },
        },
      });
    });

    // Выполняем все операции в одной транзакции для надежности
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
