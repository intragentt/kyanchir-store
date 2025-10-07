// Местоположение: src/app/api/admin/settings/design-system/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  getDesignSystemSettings,
  saveDesignSystemSettings,
  validateDesignSystemPayload,
} from '@/lib/settings/design-system';

const ALLOWED_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

async function ensureAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role?.name || !ALLOWED_ROLES.has(session.user.role.name)) {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await ensureAdmin();

  if (!session) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  try {
    const snapshot = await getDesignSystemSettings();

    return NextResponse.json({ data: snapshot.settings, updatedAt: snapshot.updatedAt });
  } catch (error) {
    console.error('[API] Ошибка загрузки настроек дизайн-системы', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить настройки дизайн-системы' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await ensureAdmin();

  if (!session) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const parsed = validateDesignSystemPayload(payload);
    const snapshot = await saveDesignSystemSettings(parsed);

    return NextResponse.json({
      message: 'Дизайн-система успешно обновлена',
      data: snapshot.settings,
      updatedAt: snapshot.updatedAt,
    });
  } catch (error) {
    console.error('[API] Ошибка сохранения дизайн-системы', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Некорректный формат запроса' }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Проверьте заполненные поля', details: error.issues },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: 'Не удалось сохранить настройки дизайн-системы' },
      { status: 500 },
    );
  }
}
