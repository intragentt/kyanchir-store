// Местоположение: /src/app/api/admin/products/update-stock/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { headers } from 'next/headers'; // <--- Импортируем headers

import { authOptions } from '@/lib/auth';
// Временно не используем prisma и moysklad-api для чистоты диагностики
// import prisma from '@/lib/prisma';
// import { updateMoySkladVariantStock } from '@/lib/moysklad-api';

export async function POST(req: Request) {
  console.log('--- [DIAGNOSTIC LOG] API Route Started ---');

  // --- Шаг 1: Логируем заголовки ---
  const requestHeaders = headers();
  const cookieHeader = requestHeaders.get('cookie');
  console.log('Cookie Header:', cookieHeader || 'No cookie header found!');

  // --- Шаг 2: Пытаемся получить сессию и логируем результат ---
  const session = await getServerSession(authOptions);
  console.log('getServerSession result:', session);

  // --- Шаг 3: Временно отключаем проверку безопасности ---
  // Вместо ошибки 401, возвращаем диагностическую информацию
  const isAdmin = session?.user?.role?.name === 'admin';
  console.log('Is Admin:', isAdmin);

  // Временно не выполняем никаких действий, только логируем
  // try {
  //   const body = await req.json();
  //   console.log('Request Body:', body);
  // } catch (e) {
  //   console.error('Failed to parse request body:', e);
  // }

  console.log('--- [DIAGNOSTIC LOG] API Route Finished ---');

  // Возвращаем успешный ответ, чтобы увидеть логи в Vercel
  return NextResponse.json({
    message: 'Diagnostic check complete.',
    sessionResult: session,
    hasCookieHeader: !!cookieHeader,
  });
}
