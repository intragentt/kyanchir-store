// /src/app/api/admin/sync/products/route.ts
// --- ОТЛАДОЧНАЯ ВЕРСИЯ ---

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getMoySkladProducts, getMoySkladStock } from '@/lib/moysklad-api';

// Интерфейсы и хелперы (без изменений)
// ... (все интерфейсы остаются как были)

async function runSync() {
  console.log('1/5: Получение данных...');
  const [moySkladResponse, stockResponse] = await Promise.all([
    getMoySkladProducts(),
    getMoySkladStock(),
  ]);

  const moySkladProducts: any[] = moySkladResponse.rows || [];
  const stockData: any[] = stockResponse.rows || [];

  if (moySkladProducts.length === 0) {
    return { message: 'Товары не найдены.' };
  }

  // === ОТЛАДОЧНЫЙ БЛОК 1: СМОТРИМ, ЧТО ПРИШЛО В ОСТАТКАХ ===
  console.log('--- ОТЛАДКА: ПЕРВЫЕ 3 ЗАПИСИ ИЗ ОТЧЕТА ПО ОСТАТКАМ ---');
  console.log(JSON.stringify(stockData.slice(0, 3), null, 2));
  console.log('----------------------------------------------------');

  const stockMap = new Map<string, number>();
  stockData.forEach((item) => {
    const id = item.assortment?.meta?.href.split('/').pop();
    if (id) {
      // Если поле stock отсутствует, ставим -1, чтобы это увидеть
      stockMap.set(id, item.stock === undefined ? -1 : item.stock);
    }
  });

  console.log(
    `2/5: Данные получены. Товаров: ${moySkladProducts.length}, Остатков: ${stockMap.size}.`,
  );

  // === ОТЛАДОЧНЫЙ БЛОК 2: СМОТРИМ НА ПЕРВЫЙ ТОВАР И ЕГО ОСТАТОК ===
  const firstProductId = moySkladProducts[0]?.id;
  console.log('--- ОТЛАДКА: ПЫТАЕМСЯ НАЙТИ ОСТАТОК ДЛЯ ПЕРВОГО ТОВАРА ---');
  console.log(`ID первого товара в списке продуктов: ${firstProductId}`);
  console.log(
    `Найденный остаток для этого ID в карте остатков: ${stockMap.get(firstProductId)}`,
  );
  console.log('---------------------------------------------------------');

  console.log('5/5: Отладочный запуск завершен. Запись в БД была пропущена.');
  return {
    message: `ОТЛАДКА: Синхронизация завершена. Запись в БД была пропущена.`,
    synchronizedProducts: 0, // Возвращаем 0, так как ничего не записывали
  };
}

// === ОБРАБОТЧИКИ GET И POST ===
export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.nextUrl.searchParams.get('cron_secret');
    // Временно убираем проверку секрета для упрощения ручного теста в браузере
    // if (process.env.CRON_SECRET !== cronSecret) {
    //   return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), { status: 401 });
    // }
    console.log('[DEBUG SYNC] Запуск отладочной синхронизации...');
    const result = await runSync();
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[DEBUG SYNC ERROR]:', errorMessage);
    return new NextResponse(
      JSON.stringify({ error: 'Внутренняя ошибка сервера.' }),
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
        status: 403,
      });
    }
    console.log('[DEBUG SYNC] Запуск отладочной синхронизации...');
    const result = await runSync();
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[DEBUG SYNC ERROR]:', errorMessage);
    return new NextResponse(
      JSON.stringify({ error: 'Внутренняя ошибка сервера.' }),
      { status: 500 },
    );
  }
}
