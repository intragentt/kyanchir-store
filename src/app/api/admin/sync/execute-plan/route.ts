// Местоположение: /src/app/api/admin/sync/execute-plan/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// --- ИСПРАВЛЕННЫЙ ПУТЬ ИМПОРТА ---
import type { SyncPlan } from '../dry-run/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role?.name !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    const { plan }: { plan: SyncPlan } = await req.json();

    if (!plan) {
      return new NextResponse(
        JSON.stringify({ error: 'План не предоставлен' }),
        {
          status: 400,
        },
      );
    }

    console.log('[EXECUTE PLAN] Начинаем выполнение плана...');

    const operations = [];

    // 1. Операции на создание
    if (plan.toCreate.length > 0) {
      for (const item of plan.toCreate) {
        operations.push(
          prisma.category.create({
            data: {
              name: item.name,
              moyskladId: item.moyskladId,
              // Присваиваем код из плана или временный, если в словаре не было
              code: item.assignedCode || `TEMP-${item.moyskladId}`,
            },
          }),
        );
      }
    }

    // 2. Операции на обновление
    if (plan.toUpdate.length > 0) {
      for (const item of plan.toUpdate) {
        operations.push(
          prisma.category.update({
            where: { id: item.ourId },
            data: { name: item.newName },
          }),
        );
      }
    }

    // Выполняем все операции в одной транзакции
    if (operations.length > 0) {
      await prisma.$transaction(operations);
      console.log(
        `[EXECUTE PLAN] Транзакция успешно завершена. Создано: ${plan.toCreate.length}, Обновлено: ${plan.toUpdate.length}.`,
      );
    } else {
      console.log(
        '[EXECUTE PLAN] План не содержал операций создания или обновления.',
      );
    }

    return NextResponse.json({
      message: 'План успешно выполнен!',
      created: plan.toCreate.length,
      updated: plan.toUpdate.length,
    });
  } catch (error) {
    console.error('[EXECUTE PLAN ERROR]:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Внутренняя ошибка сервера при выполнении плана.',
      }),
      { status: 500 },
    );
  }
}
