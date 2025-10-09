import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import { createPromoCode } from '@/lib/admin/promo-codes';

const ALLOWED_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

async function ensureAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role?.name || !ALLOWED_ROLES.has(session.user.role.name)) {
    return null;
  }

  return session;
}

export async function POST(request: Request) {
  const session = await ensureAdmin();

  if (!session) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const promoCode = await createPromoCode(payload);

    return NextResponse.json({
      message: 'Промокод создан',
      data: {
        id: promoCode.id,
        code: promoCode.code,
      },
    });
  } catch (error) {
    console.error('[API] Ошибка создания промокода', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Некорректный формат запроса' }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Проверьте заполненные поля', details: error.issues },
        { status: 422 },
      );
    }

    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'Такой промокод уже существует' },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: 'Не удалось создать промокод' }, { status: 500 });
  }
}
