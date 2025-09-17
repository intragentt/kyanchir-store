// Местоположение: /src/app/api/admin/sync/reset-products/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role?.name !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    console.log('[RESET] Начало полной очистки таблиц товаров...');

    // За счет каскадного удаления (onDelete: Cascade) в схеме Prisma,
    // удаление всех Product приведет к удалению всех связанных
    // ProductVariant и ProductSize.
    const { count } = await prisma.product.deleteMany({});

    console.log(`[RESET] Очистка завершена. Удалено ${count} товаров.`);

    return NextResponse.json({
      message:
        'Все товары, варианты и размеры были успешно удалены из базы данных сайта.',
      deletedProductsCount: count,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[RESET ERROR]:', errorMessage);
    return new NextResponse(
      JSON.stringify({ error: `Ошибка при сбросе: ${errorMessage}` }),
      { status: 500 },
    );
  }
}
