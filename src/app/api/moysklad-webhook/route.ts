// /src/app/api/moysklad-webhook/route.ts

import { NextResponse } from 'next/server';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---

export async function POST(req: Request) {
  try {
    // 1. Получаем тело запроса от МойСклад
    const payload = await req.json();

    // 2. Логируем полученные данные для анализа (самый важный шаг)
    // Мы сможем увидеть эти логи в реальном времени на вкладке "Logs" в Vercel.
    console.log('✅ [MoySklad Webhook] Получен новый вебхук:');
    console.log(JSON.stringify(payload, null, 2)); // Выводим в красивом формате

    // --- ЗДЕСЬ БУДЕТ НАША БУДУЩАЯ ЛОГИКА ---
    // Например:
    // const event = payload.events[0];
    // if (event.action === 'UPDATE' && event.meta.type === 'product') {
    //   const productId = getUUIDFromHref(event.meta.href);
    //   await syncSingleProduct(productId);
    // }
    // -------------------------------------------

    // 3. Отвечаем статусом 200 OK, чтобы МойСклад знал, что мы всё получили.
    // Это ОБЯЗАТЕЛЬНО, иначе они будут повторять отправку.
    return NextResponse.json({
      status: 'success',
      message: 'Webhook received',
    });
  } catch (error) {
    // Если произошла ошибка при чтении JSON или любая другая
    console.error('❌ [MoySklad Webhook] Ошибка при обработке вебхука:', error);

    // Даже в случае ошибки, лучше ответить "плохим запросом", чем ничего не ответить.
    return new NextResponse(
      JSON.stringify({ status: 'error', message: 'Failed to process webhook' }),
      {
        status: 400, // Bad Request
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

// --- КОНЕЦ ИЗМЕНЕНИЙ ---
