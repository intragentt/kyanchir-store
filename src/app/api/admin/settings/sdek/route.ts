import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  getSdekSettings,
  resetSdekRuntimeCache,
  saveSdekSettings,
  validateSdekSettingsPayload,
} from '@/lib/settings/sdek';

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
    const snapshot = await getSdekSettings();

    return NextResponse.json({
      data: snapshot.settings,
      updatedAt: snapshot.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[API] Ошибка загрузки настроек СДЭК', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить настройки СДЭК' },
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
    const parsed = validateSdekSettingsPayload(payload);
    const snapshot = await saveSdekSettings(parsed);

    resetSdekRuntimeCache();

    return NextResponse.json({
      message: 'Настройки СДЭК обновлены',
      data: snapshot.settings,
      updatedAt: snapshot.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[API] Ошибка сохранения настроек СДЭК', error);

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
      { error: 'Не удалось сохранить настройки СДЭК' },
      { status: 500 },
    );
  }
}
