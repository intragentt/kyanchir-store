'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSiteModeSettings } from '@/components/providers/SiteModeProvider';

function formatCountdown(targetIso: string | null): string | null {
  if (!targetIso) {
    return null;
  }

  const targetDate = new Date(targetIso);
  if (!Number.isFinite(targetDate.getTime())) {
    return null;
  }

  const now = Date.now();
  const diff = targetDate.getTime() - now;

  if (diff <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const segments: string[] = [];
  if (hours > 0) {
    segments.push(String(hours).padStart(2, '0'));
  }

  segments.push(String(minutes).padStart(2, '0'));
  segments.push(String(seconds).padStart(2, '0'));

  return segments.join(':');
}

function isAdminRole(roleName?: string | null): boolean {
  return roleName === 'ADMIN' || roleName === 'MANAGEMENT';
}

export default function SiteModeGlobalUI() {
  const pathname = usePathname();
  const settings = useSiteModeSettings();
  const { data: session } = useSession();

  const isAdminRoute = pathname?.startsWith('/admin');

  const isAdminUser = isAdminRole(session?.user?.role?.name ?? null);

  const maintenanceDeadline = useMemo(() => {
    if (!settings.maintenanceEndsAt) {
      return null;
    }

    const parsed = new Date(settings.maintenanceEndsAt);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  }, [settings.maintenanceEndsAt]);

  const [countdown, setCountdown] = useState<string | null>(() => formatCountdown(maintenanceDeadline));

  useEffect(() => {
    setCountdown(formatCountdown(maintenanceDeadline));

    if (!maintenanceDeadline) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(maintenanceDeadline));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [maintenanceDeadline]);

  const isTestBannerVisible =
    !isAdminRoute &&
    settings.testModeEnabled &&
    (!settings.hideTestBannerForAdmins || !isAdminUser);

  const isMaintenanceActive = useMemo(() => {
    if (!settings.maintenanceModeEnabled) {
      return false;
    }

    if (maintenanceDeadline) {
      const deadline = new Date(maintenanceDeadline);
      if (Number.isFinite(deadline.getTime()) && deadline.getTime() <= Date.now()) {
        return false;
      }
    }

    return true;
  }, [maintenanceDeadline, settings.maintenanceModeEnabled]);

  const isMaintenanceVisible =
    !isAdminRoute &&
    isMaintenanceActive &&
    (!settings.hideMaintenanceForAdmins || !isAdminUser);

  useEffect(() => {
    const body = document.body;

    if (isTestBannerVisible) {
      body.classList.add('site-mode-test-banner-active');
    } else {
      body.classList.remove('site-mode-test-banner-active');
    }

    return () => {
      body.classList.remove('site-mode-test-banner-active');
    };
  }, [isTestBannerVisible]);

  useEffect(() => {
    const body = document.body;
    const scrollLockKey = 'siteModeScrollLock';

    const lockScroll = () => {
      const scrollY = window.scrollY;
      body.dataset[scrollLockKey] = String(scrollY);
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
      body.style.overflowY = 'hidden';
    };

    const unlockScroll = () => {
      const storedScrollY = body.dataset[scrollLockKey];

      if (storedScrollY === undefined) {
        return;
      }

      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      body.style.overflowY = '';

      const parsed = Number.parseInt(storedScrollY, 10);
      if (Number.isFinite(parsed)) {
        window.scrollTo(0, parsed);
      }

      delete body.dataset[scrollLockKey];
    };

    if (isMaintenanceVisible) {
      body.classList.add('site-mode-maintenance-active');
      lockScroll();
    } else {
      body.classList.remove('site-mode-maintenance-active');
      unlockScroll();
    }

    return () => {
      body.classList.remove('site-mode-maintenance-active');
      unlockScroll();
    };
  }, [isMaintenanceVisible]);

  if (!isTestBannerVisible && !isMaintenanceVisible) {
    return null;
  }

  return (
    <>
      {isTestBannerVisible && (
        <div className="site-mode-banner pointer-events-none fixed inset-x-0 top-0 z-[1200] flex h-10 items-center overflow-hidden bg-amber-500 text-sm font-semibold text-white shadow-md">
          <div className="site-mode-marquee flex min-w-full items-center justify-center gap-12 whitespace-nowrap">
            <span>{settings.testModeMessage}</span>
            <span aria-hidden="true">{settings.testModeMessage}</span>
            <span aria-hidden="true">{settings.testModeMessage}</span>
          </div>
        </div>
      )}

      {isMaintenanceVisible && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/80 p-4 text-center text-white backdrop-blur-sm">
          <div className="max-w-lg space-y-4">
            <h2 className="text-2xl font-bold">🚧 Идут технические работы</h2>
            <p className="text-base text-slate-100">{settings.maintenanceMessage}</p>
            {countdown && (
              <p className="text-sm uppercase tracking-widest text-amber-300">
                До окончания: <span className="font-mono text-lg">{countdown}</span>
              </p>
            )}
            {!countdown && maintenanceDeadline && (
              <p className="text-sm text-slate-200">
                Работы завершатся до {new Date(maintenanceDeadline).toLocaleString('ru-RU')}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
