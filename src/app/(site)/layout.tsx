'use client';

// Этот layout будет оберткой только для публичной части сайта.
import AppCore from '@/components/AppCore';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Он берет страницы сайта (children) и оборачивает их в AppCore,
  // который содержит общую шапку, футер и всю логику скролла.
  return <AppCore>{children}</AppCore>;
}
