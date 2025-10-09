import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  getSiteModeSettings,
  saveSiteModeSettings,
  type SiteModeSettings,
} from '@/lib/settings/site-mode';

const ALLOWED_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

async function ensureAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role?.name || !ALLOWED_ROLES.has(session.user.role.name)) {
    return null;
  }

  return session;
}

function serializeSettings(settings: SiteModeSettings) {
  return {
    testModeEnabled: Boolean(settings.testModeEnabled),
    testModeMessage: settings.testModeMessage ?? '',
    testModeMarqueeSpeed: Number(settings.testModeMarqueeSpeed ?? 18),
    hideTestBannerForAdmins: Boolean(settings.hideTestBannerForAdmins),
    maintenanceModeEnabled: Boolean(settings.maintenanceModeEnabled),
    maintenanceMessage: settings.maintenanceMessage ?? '',
    maintenanceEndsAt: settings.maintenanceEndsAt?.toISOString() ?? null,
    hideMaintenanceForAdmins: Boolean(settings.hideMaintenanceForAdmins),
    maintenanceCtaEnabled: Boolean(settings.maintenanceCtaEnabled),
    maintenanceCtaLabel: settings.maintenanceCtaLabel ?? '',
    maintenanceCtaHref: settings.maintenanceCtaHref ?? '',
    maintenanceBackdropColor: settings.maintenanceBackdropColor ?? '#020617',
    maintenanceBackdropOpacity: Number(settings.maintenanceBackdropOpacity ?? 80),
    maintenanceTextColor: settings.maintenanceTextColor ?? '#f8fafc',
  };
}

export async function GET() {
  const session = await ensureAdmin();

  if (!session) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  try {
    const snapshot = await getSiteModeSettings();
    return NextResponse.json({
      data: serializeSettings(snapshot.settings),
      updatedAt: snapshot.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[API] Ошибка загрузки настроек режимов сайта', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить настройки режима сайта' },
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

    const snapshot = await saveSiteModeSettings(payload);

    return NextResponse.json({
      message: 'Настройки режима сайта обновлены',
      data: serializeSettings(snapshot.settings),
      updatedAt: snapshot.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[API] Ошибка сохранения настроек режимов сайта', error);

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
      { error: 'Не удалось сохранить настройки режима сайта' },
      { status: 500 },
    );
  }
}
