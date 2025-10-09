'use client';

import { type CSSProperties, useEffect, useMemo, useState } from 'react';
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

function toRgba(color: string, opacityPercent: number): string {
  const sanitizedColor = color?.trim() ?? '';
  const match = /^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec(sanitizedColor);

  let r = 2;
  let g = 6;
  let b = 23;

  if (match) {
    const hex = match[1].length === 3
      ? match[1]
          .split('')
          .map((char) => char + char)
          .join('')
      : match[1];

    r = Number.parseInt(hex.slice(0, 2), 16);
    g = Number.parseInt(hex.slice(2, 4), 16);
    b = Number.parseInt(hex.slice(4, 6), 16);
  }

  const clampedOpacity = Number.isFinite(opacityPercent)
    ? Math.min(100, Math.max(0, opacityPercent)) / 100
    : 0.8;

  return `rgba(${r}, ${g}, ${b}, ${clampedOpacity.toFixed(3)})`;
}

export default function SiteModeGlobalUI() {
  const pathname = usePathname();
  const settings = useSiteModeSettings();
  const { data: session } = useSession();

  const isAdminRoute = pathname?.startsWith('/admin');

  const [isAdminHost, setIsAdminHost] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const host = window.location.hostname.toLowerCase();
    return host === 'admin.kyanchir.ru' || host.startsWith('admin.');
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const host = window.location.hostname.toLowerCase();
    setIsAdminHost(host === 'admin.kyanchir.ru' || host.startsWith('admin.'));
  }, []);

  const isAdminUser = isAdminRole(session?.user?.role?.name ?? null);

  const isAdminEnvironment = isAdminRoute || isAdminHost;

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
    !isAdminEnvironment &&
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
    !isAdminEnvironment &&
    isMaintenanceActive &&
    (!settings.hideMaintenanceForAdmins || !isAdminUser);

  const marqueeDuration = useMemo(() => {
    if (!Number.isFinite(settings.testModeMarqueeSpeed)) {
      return 18;
    }

    return Math.max(4, Math.min(60, settings.testModeMarqueeSpeed));
  }, [settings.testModeMarqueeSpeed]);

  const marqueeStyles = useMemo(
    () =>
      ({
        '--marquee-duration': `${marqueeDuration}s`,
      }) as CSSProperties,
    [marqueeDuration],
  );

  const marqueeMessage = settings.testModeMessage?.trim() || 'Kyanchir Store работает в тестовом режиме';

  const maintenanceBackdrop = useMemo(
    () => toRgba(settings.maintenanceBackdropColor, settings.maintenanceBackdropOpacity),
    [settings.maintenanceBackdropColor, settings.maintenanceBackdropOpacity],
  );
  const maintenanceTextColor = useMemo(() => {
    const raw = settings.maintenanceTextColor?.trim() ?? '';

    if (!raw) {
      return '#f8fafc';
    }

    if (/^#([a-f\d]{3}|[a-f\d]{6})$/i.test(raw)) {
      return raw;
    }

    if (/^([a-f\d]{3}|[a-f\d]{6})$/i.test(raw)) {
      return `#${raw}`;
    }

    return '#f8fafc';
  }, [settings.maintenanceTextColor]);

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
          <div className="site-mode-marquee" style={marqueeStyles} aria-live="polite">
            <span className="site-mode-marquee__item">{marqueeMessage}</span>
            <span aria-hidden="true" className="site-mode-marquee__item">
              {marqueeMessage}
            </span>
          </div>
        </div>
      )}

      {isMaintenanceVisible && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4 text-center backdrop-blur-sm"
          style={{ backgroundColor: maintenanceBackdrop, color: maintenanceTextColor }}
        >
          <div className="max-w-lg space-y-4">
            <h2 className="text-2xl font-bold">🚧 Идут технические работы</h2>
            <p className="text-base">{settings.maintenanceMessage}</p>
            {countdown && (
              <p className="text-sm uppercase tracking-widest text-amber-300">
                До окончания: <span className="font-mono text-lg">{countdown}</span>
              </p>
            )}
            {!countdown && maintenanceDeadline && (
              <p className="text-sm">
                Работы завершатся до {new Date(maintenanceDeadline).toLocaleString('ru-RU')}
              </p>
            )}
            {settings.maintenanceCtaEnabled && settings.maintenanceCtaHref && (
              <div className="pt-2">
                <a
                  href={settings.maintenanceCtaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                >
                  {settings.maintenanceCtaLabel || 'Связаться с нами'}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
