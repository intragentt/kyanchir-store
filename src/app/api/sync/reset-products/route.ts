// Местоположение: /src/app/api/admin/sync/reset-products/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ВАЖНО: Этот эндпоинт удаляет ВСЕ данные о товарах.
// Используйте его только для полной повторной синхронизации.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user || session.user.role?.name !== 'ADMIN') {
    return new NextResponse('Доступ запрещен', { status: 403 });
  }

  console.log('[RESET SYNC] Запуск полной очистки данных о товарах...');

  try {
    // Выполняем удаление в транзакции, чтобы обеспечить целостность
    await prisma.$transaction([
      prisma.attribute.deleteMany(),
      prisma.image.deleteMany(),
      prisma.productSize.deleteMany(),
      prisma.productVariant.deleteMany(),
      // prisma.product.deleteMany() должен каскадно удалить всё связанное,
      // но для надежности чистим всё по шагам.
      prisma.product.deleteMany(),
    ]);

    console.log('[RESET SYNC] Очистка завершена успешно.');
    return NextResponse.json({
      message: 'Все данные о товарах были успешно удалены.',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[RESET SYNC ERROR]:', errorMessage);
    return new NextResponse('Внутренняя ошибка сервера при очистке.', {
      status: 500,
    });
  }
}
