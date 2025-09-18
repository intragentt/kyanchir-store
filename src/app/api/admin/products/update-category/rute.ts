// Местоположение: /src/app/api/admin/products/update-category/route.ts
// ЭТО ВРЕМЕННЫЙ ТЕСТОВЫЙ ФАЙЛ
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('!!! TEST ROUTE HIT !!!');
  return NextResponse.json({
    success: true,
    message: 'Тестовый маршрут работает!',
  });
}
