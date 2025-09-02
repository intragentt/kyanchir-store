// /src/app/api/admin/sync/products/route.ts

import { NextResponse, NextRequest } from 'next/server';
// ... (все остальные импорты)
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getMoySkladProducts, getMoySkladStock } from '@/lib/moysklad-api';

// --- (Все интерфейсы и хелперы без изменений) ---
// ...

async function runSync() {
  console.log("1/5: Получение данных...");
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
  stockData.forEach(item => {
    const id = item.assortment?.meta?.href.split('/').pop();
    if (id) {
        stockMap.set(id, item.stock === undefined ? -1 : item.stock); // Используем -1 для отладки
    }
  });
  
  console.log(`2/5: Данные получены. Товаров: ${moySkladProducts.length}, Остатков: ${stockMap.size}.`);
  
  // === ОТЛАДОЧНЫЙ БЛОК 2: СМОТРИМ НА ПЕРВЫЙ ТОВАР И ЕГО ОСТАТОК ===
  const firstProductId = moySkladProducts[0]?.id;
  console.log('--- ОТЛАДКА: ПЫТАЕМСЯ НАЙТИ ОСТАТОК ДЛЯ ПЕРВОГО ТОВАРА ---');
  console.log(`ID первого товара: ${firstProductId}`);
  console.log(`Найденный остаток для этого ID: ${stockMap.get(firstProductId)}`);
  console.log('---------------------------------------------------------');

  
  // (Остальная логика группировки и upsert'ов пока без изменений, но она нам понадобится)
  const groupedProducts = new Map<string, any[]>();
  //...
  
  // Пропускаем запись в БД, чтобы не вызывать ошибок.
  // Сейчас наша цель - только посмотреть логи.
  
  console.log("5/5: Отладочный запуск завершен.");
  return { message: `ОТЛАДКА: Синхронизация завершена.`, synchronizedProducts: 0 };
}


// Обработчики GET и POST
export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.nextUrl.searchParams.get('cron_secret');
    if (process.env.CRON_SECRET !== cronSecret) {
      return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), { status: 401 });
    }
    const result = await runSync();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[CRON SYNC ERROR]:', error);
    return new NextResponse(JSON.stringify({ error: 'Внутренняя ошибка сервера.' }), { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), { status: 403 });
    }
    const result = await runSync();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[MANUAL SYNC ERROR]:', error);
    return new NextResponse(JSON.stringify({ error: 'Внутренняя ошибка сервера.' }), { status: 500 });
  }
}