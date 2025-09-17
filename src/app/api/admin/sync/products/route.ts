// /src/app/api/admin/sync/products/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  getMoySkladProductsAndVariants,
  getMoySkladStock,
} from '@/lib/moysklad-api';
import { AuthError } from '@/lib/moysklad-api'; // <-- 1. Импортируем AuthError

function getUUIDFromHref(href: string): string {
  return href.split('/').pop() || '';
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role?.name !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    console.log('[SYNC PRODUCTS] Начало синхронизации товаров v2...');

    console.log('[SYNC PRODUCTS] Шаг 1/3: Получение данных...');
    const [
      moySkladResponse,
      stockResponse,
      statuses,
      allOurCategories,
      allOurSizes,
    ] = await Promise.all([
      getMoySkladProductsAndVariants(),
      getMoySkladStock(),
      prisma.status.findMany(),
      prisma.category.findMany({ select: { id: true, moyskladId: true } }),
      prisma.size.findMany(),
    ]);

    const moySkladItems: any[] = moySkladResponse.rows || [];
    const draftStatus = statuses.find((s) => s.name === 'DRAFT');
    if (!draftStatus) throw new Error('Статус "DRAFT" не найден в БД.');

    const categoryMap = new Map(
      allOurCategories.map((cat) => [cat.moyskladId, cat.id]),
    );
    const stockMap = new Map<string, number>(
      stockResponse.rows.map((item: any) => [
        getUUIDFromHref(item.meta.href),
        item.stock || 0,
      ]),
    );

    console.log(
      `[SYNC PRODUCTS] Шаг 2/3: Обработка ${moySkladItems.length} товаров...`,
    );
    for (const msProduct of moySkladItems) {
      const nameMatch = msProduct.name.match(/(.+)\s\((.+)\)/);
      const baseProductName = nameMatch ? nameMatch[1].trim() : msProduct.name;
      const color = nameMatch ? nameMatch[2].trim() : 'Основной';

      const categoryMoySkladId = msProduct.productFolder
        ? getUUIDFromHref(msProduct.productFolder.meta.href)
        : null;
      const ourCategoryId = categoryMoySkladId
        ? categoryMap.get(categoryMoySkladId)
        : undefined;

      const ourParentProduct = await prisma.product.upsert({
        where: { name: baseProductName },
        update: {
          categories: ourCategoryId
            ? { set: [{ id: ourCategoryId }] }
            : undefined,
        },
        create: {
          name: baseProductName,
          article: msProduct.article || `TEMP-${msProduct.id}`,
          statusId: draftStatus.id,
          categories: ourCategoryId
            ? { connect: { id: ourCategoryId } }
            : undefined,
        },
      });

      const ourVariant = await prisma.productVariant.upsert({
        where: {
          productId_color: { productId: ourParentProduct.id, color: color },
        },
        update: {
          moySkladId: msProduct.id,
          price: (msProduct.salePrices?.[0]?.value || 0) / 100,
        },
        create: {
          productId: ourParentProduct.id,
          color: color,
          moySkladId: msProduct.id,
          price: (msProduct.salePrices?.[0]?.value || 0) / 100,
        },
      });

      const oneSize = await prisma.size.upsert({
        where: { value: 'ONE_SIZE' },
        create: { value: 'ONE_SIZE' },
        update: {},
      });

      await prisma.productSize.upsert({
        where: {
          productVariantId_sizeId: {
            productVariantId: ourVariant.id,
            sizeId: oneSize.id,
          },
        },
        update: {
          stock: stockMap.get(msProduct.id) || 0,
          moySkladHref: msProduct.meta.href,
          moySkladType: msProduct.meta.type,
          article: msProduct.article,
        },
        create: {
          productVariantId: ourVariant.id,
          sizeId: oneSize.id,
          stock: stockMap.get(msProduct.id) || 0,
          moySkladHref: msProduct.meta.href,
          moySkladType: msProduct.meta.type,
          article: msProduct.article,
        },
      });
    }

    console.log('[SYNC PRODUCTS] Шаг 3/3: Синхронизация завершена.');
    return NextResponse.json({
      message: 'Синхронизация товаров успешно завершена.',
      totalMoySklad: moySkladItems.length,
    });
  } catch (error) {
    // --- НАЧАЛО ИЗМЕНЕНИЙ: "Умный" обработчик ошибок ---
    if (error instanceof AuthError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 401,
      });
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[PRODUCTS SYNC ERROR]:', errorMessage);
    return new NextResponse(
      JSON.stringify({ error: `Ошибка синхронизации: ${errorMessage}` }),
      { status: 500 },
    );
  }
}
