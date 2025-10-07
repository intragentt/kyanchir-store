'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ADMIN_PREFIX = '/admin';

function normalizePath(pathname: string) {
  if (!pathname.startsWith(ADMIN_PREFIX)) {
    return null;
  }

  const normalized = pathname.slice(ADMIN_PREFIX.length) || '/';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export default function AdminPathNormalizer() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const normalized = pathname ? normalizePath(pathname) : null;

    if (!normalized) {
      return;
    }

    const { search, hash } = window.location;
    const target = `${normalized}${search}${hash}`;

    if (window.location.pathname !== normalized) {
      window.history.replaceState(window.history.state, '', target);
    }
  }, [pathname]);

  return null;
}
