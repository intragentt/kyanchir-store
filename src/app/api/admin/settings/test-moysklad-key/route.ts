// Местоположение: /src/app/api/admin/settings/test-moysklad-key/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2';

// Временная, изолированная функция для fetch, использующая переданный ключ
const testMoySkladFetch = async (apiKey: string) => {
  const url = `${MOYSKLAD_API_URL}/entity/organization`; // Простой и надежный эндпоинт для теста
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${apiKey}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, { headers });
  return response.ok;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role?.name !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return new NextResponse(
        JSON.stringify({ error: 'API ключ не предоставлен.' }),
        { status: 400 },
      );
    }

    const isSuccess = await testMoySkladFetch(apiKey);

    if (isSuccess) {
      return NextResponse.json({
        success: true,
        message: 'Соединение с МойСклад успешно!',
      });
    } else {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Неверный API-ключ или нет доступа.',
        }),
        { status: 401 },
      );
    }
  } catch (error) {
    console.error('[API TEST KEY ERROR]:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Внутренняя ошибка сервера.' }),
      { status: 500 },
    );
  }
}
