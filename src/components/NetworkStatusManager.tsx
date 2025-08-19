// Местоположение: src/components/NetworkStatusManager.tsx
'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

// Иконка остается здесь, так как она относится к сети
const WifiSlashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M10 3.53a.75.75 0 01.75.75v3.636a.75.75 0 01-1.5 0V4.28a.75.75 0 01.75-.75zM8.857 6.43a.75.75 0 01.75-.75h.786a.75.75 0 010 1.5h-.786a.75.75 0 01-.75-.75zm4.08 3.51a.75.75 0 00-1.06-1.06l-6.152 6.152a.75.75 0 001.06 1.06l6.152-6.152z"
      clipRule="evenodd"
    />
    <path d="M3.235 9.03a.75.75 0 011.06 0c1.384 1.385 3.441 2.19 5.59 2.19s4.206-.805 5.59-2.19a.75.75 0 111.06 1.06c-1.637 1.637-3.953 2.58-6.65 2.58s-5.013-.943-6.65-2.58a.75.75 0 010-1.06z" />
  </svg>
);

export default function NetworkStatusManager() {
  const setIsOnline = useAppStore((state) => state.setIsOnline);
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Получаем новые экшены из стора ---
  const showNotification = useAppStore((state) => state.showNotification);
  const hideNotification = useAppStore((state) => state.hideNotification);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      hideNotification(); // Скрываем уведомление, когда интернет появляется
    };
    const handleOffline = () => {
      setIsOnline(false);
      // Показываем уведомление через новую систему
      showNotification('Проблема с подключением', 'error', WifiSlashIcon);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, showNotification, hideNotification]);

  // Этот компонент теперь не рендерит ничего видимого
  return null;
}
