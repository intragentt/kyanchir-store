// Метафора: "Скелет Приложения" (без UI)

import './globals.css';
import { fontHeading, fontBody, fontMono } from './fonts';
import AuthProvider from '@/components/providers/AuthProvider';
// AppCore был удален отсюда
import Script from 'next/script';
import type { Metadata } from 'next';
import { getDesignSystemSettings } from '@/lib/settings/design-system';

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

function buildDesignSystemStyle(settings: Awaited<ReturnType<typeof getDesignSystemSettings>>['settings']) {
  const tokens = [
    ['--ds-font-heading', settings.fonts.heading.stack],
    ['--ds-font-body', settings.fonts.body.stack],
    ['--ds-font-accent', settings.fonts.accent.stack],
    ['--ds-heading-1-size', settings.typography.h1.size],
    ['--ds-heading-1-line-height', settings.typography.h1.lineHeight],
    ['--ds-heading-1-weight', settings.typography.h1.weight],
    ['--ds-heading-1-letter-spacing', settings.typography.h1.letterSpacing ?? 'normal'],
    ['--ds-heading-2-size', settings.typography.h2.size],
    ['--ds-heading-2-line-height', settings.typography.h2.lineHeight],
    ['--ds-heading-2-weight', settings.typography.h2.weight],
    ['--ds-heading-2-letter-spacing', settings.typography.h2.letterSpacing ?? 'normal'],
    ['--ds-heading-3-size', settings.typography.h3.size],
    ['--ds-heading-3-line-height', settings.typography.h3.lineHeight],
    ['--ds-heading-3-weight', settings.typography.h3.weight],
    ['--ds-heading-3-letter-spacing', settings.typography.h3.letterSpacing ?? 'normal'],
    ['--ds-body-font-size', settings.typography.body.size],
    ['--ds-body-line-height', settings.typography.body.lineHeight],
    ['--ds-body-font-weight', settings.typography.body.weight],
    ['--ds-body-letter-spacing', settings.typography.body.letterSpacing ?? 'normal'],
    ['--ds-small-font-size', settings.typography.small.size],
    ['--ds-small-line-height', settings.typography.small.lineHeight],
    ['--ds-small-font-weight', settings.typography.small.weight],
    ['--ds-small-letter-spacing', settings.typography.small.letterSpacing ?? 'normal'],
    ['--ds-spacing-xs', settings.spacing.xs],
    ['--ds-spacing-sm', settings.spacing.sm],
    ['--ds-spacing-md', settings.spacing.md],
    ['--ds-spacing-lg', settings.spacing.lg],
    ['--ds-spacing-xl', settings.spacing.xl],
    ['--ds-spacing-2xl', settings.spacing['2xl']],
    ['--ds-spacing-3xl', settings.spacing['3xl']],
  ] as const;

  const declarations = tokens
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ');

  return `:root {\n    ${declarations}\n  }`;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { settings } = await getDesignSystemSettings();

  const fontSources = Array.from(
    new Set(
      [settings.fonts.heading.source, settings.fonts.body.source, settings.fonts.accent.source].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );

  const designSystemStyle = buildDesignSystemStyle(settings);

  return (
    <html
      lang="ru"
      className={`h-full ${fontHeading.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#FFFFFF" />
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

        <AuthProvider>
          {/* ИЗМЕНЕНИЕ: AppCore здесь больше нет. Мы просто рендерим дочерние элементы.
              Теперь /admin/layout.tsx и /(site)/layout.tsx могут работать независимо. */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
