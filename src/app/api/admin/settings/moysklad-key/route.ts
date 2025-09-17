// Местоположение: /src/app/api/admin/settings/moysklad-key/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clearApiKeyCache } from '@/lib/moysklad-api'; // <-- Импортируем функцию очистки кэша

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role?.name !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return new NextResponse(
        JSON.stringify({
          error: 'API ключ не предоставлен или имеет неверный формат.',
        }),
        {
          status: 400,
        },
      );
    }

    const keyName = 'MOYSKLAD_API_KEY';

    // Используем upsert: если настройка есть - обновит, если нет - создаст.
    await prisma.systemSetting.upsert({
      where: { key: keyName },
      update: { value: apiKey.trim() },
      create: { key: keyName, value: apiKey.trim() },
    });

    console.log('[API Settings] Ключ МойСклад успешно сохранен в БД.');

    // Очищаем кэш в API-мосте, чтобы он при следующем запросе взял новый ключ из БД
    clearApiKeyCache();

    return NextResponse.json({
      message: 'API-ключ МойСклад успешно сохранен!',
    });
  } catch (error) {
    console.error('[API SETTINGS ERROR]:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Внутренняя ошибка сервера при сохранении ключа.',
      }),
      { status: 500 },
    );
  }
}
