'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NotFoundRedirectProps {
  /**
   * ⏱️ Время до автоматического перехода, миллисекунды
   */
  redirectAfterMs?: number;
}

const DEFAULT_REDIRECT_TIMEOUT = 5000;

export default function NotFoundRedirect({
  redirectAfterMs = DEFAULT_REDIRECT_TIMEOUT,
}: NotFoundRedirectProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil(redirectAfterMs / 1000)),
  );

  useEffect(() => {
    const targetTimeout = Math.max(0, redirectAfterMs);

    setSecondsLeft(Math.max(0, Math.ceil(targetTimeout / 1000)));

    if (targetTimeout === 0) {
      router.push('/');
      return () => {};
    }

    const redirectTimer = window.setTimeout(() => {
      router.push('/');
    }, targetTimeout);

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearInterval(interval);
    };
  }, [redirectAfterMs, router]);

  if (secondsLeft <= 0) {
    return (
      <p className="text-sm text-gray-500" role="status">
        Перенаправляем на главную...
      </p>
    );
  }

  return (
    <p className="text-sm text-gray-500" role="status">
      Перенаправим на главную через {secondsLeft}&nbsp;с.
    </p>
  );
}
