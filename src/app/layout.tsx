// Метафора: "Скелет Приложения" (без UI)

import './globals.css';
import { fontHeading, fontBody, fontMono } from './fonts';
import AuthProvider from '@/components/providers/AuthProvider';
// AppCore был удален отсюда
import Script from 'next/script';
import type { Metadata } from 'next';
import { getDesignSystemSettings } from '@/lib/settings/design-system';
import {
  buildDesignSystemVariableMap,
  collectFontCssLinks,
  type DesignSystemSettings,
} from '@/lib/settings/design-system.shared';
import { getSiteModeSettings } from '@/lib/settings/site-mode';
import { SiteModeProvider } from '@/components/providers/SiteModeProvider';
import SiteModeGlobalUI from '@/components/SiteModeGlobalUI';
import VercelAnalyticsClient from '@/components/providers/VercelAnalyticsClient';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getDesignSystemSettings();

  const description = 'Мини-приложение / сайт';

  return {
    title: settings.siteName,
    description,
    openGraph: {
      title: settings.siteName,
      description,
      siteName: settings.siteName,
    },
    twitter: {
      title: settings.siteName,
      description,
    },
  };
}

function buildDesignSystemStyle(settings: DesignSystemSettings) {
  const variables = buildDesignSystemVariableMap(settings);
  const declarations = Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ');

  return `:root {\n    ${declarations}\n  }`;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { settings } = await getDesignSystemSettings();
  const siteModeSnapshot = await getSiteModeSettings();

  const fontSources = collectFontCssLinks(settings.fontLibrary);

  const designSystemStyle = buildDesignSystemStyle(settings);

  const siteModeClientSettings = {
    testModeEnabled: siteModeSnapshot.settings.testModeEnabled,
    testModeMessage: siteModeSnapshot.settings.testModeMessage,
    testModeMarqueeSpeed: siteModeSnapshot.settings.testModeMarqueeSpeed,
    testModeBackgroundColor: siteModeSnapshot.settings.testModeBackgroundColor,
    testModeTextColor: siteModeSnapshot.settings.testModeTextColor,
    hideTestBannerForAdmins: siteModeSnapshot.settings.hideTestBannerForAdmins,
    maintenanceModeEnabled: siteModeSnapshot.settings.maintenanceModeEnabled,
    maintenanceMessage: siteModeSnapshot.settings.maintenanceMessage,
    maintenanceEndsAt: siteModeSnapshot.settings.maintenanceEndsAt?.toISOString() ?? null,
    hideMaintenanceForAdmins: siteModeSnapshot.settings.hideMaintenanceForAdmins,
    maintenanceCtaEnabled: siteModeSnapshot.settings.maintenanceCtaEnabled,
    maintenanceCtaLabel: siteModeSnapshot.settings.maintenanceCtaLabel,
    maintenanceCtaHref: siteModeSnapshot.settings.maintenanceCtaHref,
    maintenanceBackdropColor: siteModeSnapshot.settings.maintenanceBackdropColor,
    maintenanceBackdropOpacity: siteModeSnapshot.settings.maintenanceBackdropOpacity,
    maintenanceTextColor: siteModeSnapshot.settings.maintenanceTextColor,
  };

  return (
    <html
      lang="ru"
      className={`h-full ${fontHeading.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content={settings.colors.background} />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="og:site_name" content={settings.siteName} />
        {fontSources.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <style id="design-system-variables" dangerouslySetInnerHTML={{ __html: designSystemStyle }} />
      </head>

      <body className="h-full">
        <Script id="scroll-restoration-fix" strategy="beforeInteractive">
          {`history.scrollRestoration = "manual"`}
        </Script>

        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <noscript>
          Для работы приложения требуется включить JavaScript.
        </noscript>

        <SiteModeProvider value={siteModeClientSettings}>
          <AuthProvider>
            {/* ИЗМЕНЕНИЕ: AppCore здесь больше нет. Мы просто рендерим дочерние элементы.
                Теперь /admin/layout.tsx и /(site)/layout.tsx могут работать независимо. */}
            {children}
            <SiteModeGlobalUI />
            <VercelAnalyticsClient />
          </AuthProvider>
        </SiteModeProvider>
      </body>
    </html>
  );
}
