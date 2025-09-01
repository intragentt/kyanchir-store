// /src/app/api/admin/sync/products/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getMoySkladProducts } from '@/lib/moysklad-api';

// Интерфейсы (без изменений)
interface MoySkladPrice {
  value: number;
  priceType: { name: string };
}
interface MoySkladProduct {
  id: string;
  name: string;
  description?: string;
  productFolder?: { meta: { href: string } };
  salePrices?: MoySkladPrice[];
}

function getUUIDFromHref(href: string): string {
  return href.split('/').pop() || '';
}

// === НОВАЯ ЛОГИКА ===

interface ParsedProductInfo {
  baseName: string;
  size: string | null;
}

// 1. "Умный" парсер названий
function parseProductName(name: string): ParsedProductInfo {
  const sizeMatch = name.match(/\((S|M|L|XS|XL|XXL)\)$/);
  if (sizeMatch) {
    const baseName = name.replace(sizeMatch[0], '').trim();
    const size = sizeMatch[1];
    return { baseName, size };
  }
  return { baseName: name.trim(), size: null };
}

interface GroupedProductVariant {
  moyskladId: string;
  size: string | null;
  price: number;
  description?: string;
  productFolder?: { meta: { href: string } };
}

// === КОНЕЦ НОВОЙ ЛОГИКИ ===

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
      return NextResponse.json({ message: 'Товары в МойСклад не найдены.' });
    }

    // 2. Группируем товары по базовому имени
    const groupedProducts = new Map<string, GroupedProductVariant[]>();

    for (const product of moySkladProducts) {
      const { baseName, size } = parseProductName(product.name);

      const salePriceObject = (product.salePrices || []).find(
        (p) => p.priceType.name === 'Цена продажи',
      );
      const price = salePriceObject ? Math.round(salePriceObject.value) : 0;

      if (!groupedProducts.has(baseName)) {
        groupedProducts.set(baseName, []);
      }

      groupedProducts.get(baseName)!.push({
        moyskladId: product.id,
        size,
        price,
        description: product.description,
        productFolder: product.productFolder,
      });
    }

    const categoryMap = new Map<string, string>();
    const allOurCategories = await prisma.category.findMany({
      select: { id: true, moyskladId: true },
    });
    allOurCategories.forEach(
      (cat) => cat.moyskladId && categoryMap.set(cat.moyskladId, cat.id),
    );

    // 3. Запускаем "умный" upsert в транзакции
    const transactionPromises = [];

    for (const [baseName, variants] of groupedProducts.entries()) {
      const firstVariant = variants[0];
      const categoryMoySkladId = firstVariant.productFolder
        ? getUUIDFromHref(firstVariant.productFolder.meta.href)
        : null;
      const ourCategoryId = categoryMoySkladId
        ? categoryMap.get(categoryMoySkladId)
        : undefined;

      // Ищем продукт по базовому имени
      let product = await prisma.product.findFirst({
        where: { name: baseName },
      });

      if (!product) {
        // Если продукта нет - создаем
        product = await prisma.product.create({
          data: {
            name: baseName,
            description: firstVariant.description || '',
            categories: ourCategoryId
              ? { connect: { id: ourCategoryId } }
              : undefined,
          },
        });
      }

      // Для каждого варианта размера делаем upsert
      for (const variantData of variants) {
        // Сначала нужно найти или создать размер в нашей таблице `Size`
        let sizeRecord = null;
        if (variantData.size) {
          sizeRecord = await prisma.size.upsert({
            where: { value: variantData.size },
            update: {},
            create: { value: variantData.size },
          });
        }

        const variantUpsert = prisma.variant.upsert({
          where: { moyskladId: variantData.moyskladId },
          update: {
            price: variantData.price,
            product: { connect: { id: product.id } },
          },
          create: {
            price: variantData.price,
            product: { connect: { id: product.id } },
            moyskladId: variantData.moyskladId,
            // Связываем инвентарь с размером, если он есть
            inventory: sizeRecord
              ? {
                  create: {
                    sizeId: sizeRecord.id,
                    stock: 0, // Пока ставим 0, потом будем синхронизировать остатки
                  },
                }
              : undefined,
          },
        });
        transactionPromises.push(variantUpsert);
      }
    }

    await prisma.$transaction(transactionPromises);

    return NextResponse.json({
      message: `Синхронизация успешно завершена. Сгруппировано в ${groupedProducts.size} уникальных товаров.`,
      synchronizedProducts: groupedProducts.size,
    });
  } catch (error) {
    console.error('[API SYNC PRODUCTS ERROR]:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Внутренняя ошибка сервера.' }),
      { status: 500 },
    );
  }
}
