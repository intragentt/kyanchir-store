import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  getYookassaSettings,
  resetYookassaRuntimeCache,
  saveYookassaSettings,
  validateYookassaSettingsPayload,
} from '@/lib/settings/yookassa';

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
    const snapshot = await getYookassaSettings();

    return NextResponse.json({
      data: snapshot.settings,
      updatedAt: snapshot.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[API] Ошибка загрузки настроек YooKassa', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить настройки YooKassa' },
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
    const parsed = validateYookassaSettingsPayload(payload);
    const snapshot = await saveYookassaSettings(parsed);

    resetYookassaRuntimeCache();

    return NextResponse.json({
      message: 'Настройки YooKassa обновлены',
      data: snapshot.settings,
      updatedAt: snapshot.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[API] Ошибка сохранения настроек YooKassa', error);

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
      { error: 'Не удалось сохранить настройки YooKassa' },
      { status: 500 },
    );
  }
}
