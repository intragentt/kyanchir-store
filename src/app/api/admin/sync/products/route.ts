// /src/app/api/admin/sync/products/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getMoySkladProducts } from '@/lib/moysklad-api';

// --- ИЗМЕНЕНЫ ИНТЕРФЕЙСЫ И ДОБАВЛЕНО ЛОГИРОВАНИЕ ---

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

function getUUIDFromHref(href: string): string {
  return href.split('/').pop() || '';
}

export async function POST() {
  console.log('[SYNC PRODUCTS] === Начат процесс синхронизации товаров ===');

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    console.error(
      '[SYNC PRODUCTS] Ошибка: Доступ запрещен (нет сессии или прав).',
    );
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  console.log(
    '[SYNC PRODUCTS] Права доступа проверены, пользователь:',
    session.user.email,
  );

  try {
    console.log('[SYNC PRODUCTS] 1. Получение данных из МойСклад...');
    const moySkladResponse = await getMoySkladProducts();
    const moySkladProducts: MoySkladProduct[] = moySkladResponse.rows || [];

    console.log(
      `[SYNC PRODUCTS] ...получено ${moySkladProducts.length} товаров из МойСклад.`,
    );

    if (moySkladProducts.length === 0) {
      console.log('[SYNC PRODUCTS] Товары в МойСклад не найдены. Завершение.');
      return NextResponse.json({
        message: 'Товары в МойСклад не найдены.',
        synchronizedCount: 0,
      });
    }

    // --- ВРЕМЕННОЕ ОГРАНИЧЕНИЕ ДЛЯ ДЕБАГА ---
    const productToSync = moySkladProducts[0]; // Берем только первый товар для теста
    console.log(
      `[SYNC PRODUCTS] Тестируем синхронизацию на одном товаре: ${productToSync.name} (ID: ${productToSync.id})`,
    );

    // 2. Создаем карту категорий
    console.log('[SYNC PRODUCTS] 2. Создание карты категорий...');
    const allOurCategories = await prisma.category.findMany({
      select: { id: true, moyskladId: true },
    });
    const categoryMap = new Map<string, string>();
    allOurCategories.forEach(
      (cat) => cat.moyskladId && categoryMap.set(cat.moyskladId, cat.id),
    );
    console.log(
      `[SYNC PRODUCTS] ...карта категорий создана, найдено ${categoryMap.size} категорий в нашей БД.`,
    );

    // 3. Синхронизируем ОДИН товар
    console.log('[SYNC PRODUCTS] 3. Запуск upsert для одного товара...');

    const categoryMoySkladId = productToSync.productFolder
      ? getUUIDFromHref(productToSync.productFolder.meta.href)
      : null;
    const ourCategoryId = categoryMoySkladId
      ? categoryMap.get(categoryMoySkladId)
      : undefined;

    const salePriceObject = (productToSync.salePrices || []).find(
      (p) => p.priceType.name === 'Цена продажи',
    );
    const priceInCents = salePriceObject ? salePriceObject.value : 0; // В МойСклад цены могут быть в рублях. В Prisma храним в копейках. Надо бы умножить на 100, но для теста оставим как есть.

    await prisma.product.upsert({
      where: { moyskladId: productToSync.id },
      update: {
        name: productToSync.name,
        description: productToSync.description || '',
        categories: ourCategoryId
          ? { connect: { id: ourCategoryId } }
          : undefined,
      },
      create: {
        name: productToSync.name,
        description: productToSync.description || '',
        moyskladId: productToSync.id,
        categories: ourCategoryId
          ? { connect: { id: ourCategoryId } }
          : undefined,
        variants: {
          create: {
            price: priceInCents,
          },
        },
      },
    });

    console.log(
      '[SYNC PRODUCTS] ...upsert для одного товара УСПЕШНО завершен.',
    );

    console.log(
      '[SYNC PRODUCTS] === Процесс синхронизации УСПЕШНО завершен ===',
    );
    return NextResponse.json({
      message:
        'Синхронизация ОДНОГО товара успешно завершена (ТЕСТОВЫЙ РЕЖИМ).',
      synchronizedCount: 1,
      productName: productToSync.name,
    });
  } catch (error) {
    console.error('[API SYNC PRODUCTS ERROR]:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Внутренняя ошибка сервера. Смотрите логи Vercel.',
      }),
      {
        status: 500,
      },
    );
  }
}
