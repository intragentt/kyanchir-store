// Местоположение: src/components/NotificationManager.tsx
'use client';

import { useAppStore } from '@/store/useAppStore';

export default function NotificationManager() {
  const { isVisible, message, type, Icon } = useAppStore(
    (state) => state.notification,
  );

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div
      className={`fixed top-5 right-5 z-[100] flex items-center gap-x-3 rounded-lg px-4 py-3 text-white shadow-lg transition-transform duration-300 ${bgColor} ${isVisible ? 'translate-x-0' : 'translate-x-[calc(100%+20px)]'}`}
    >
      {Icon && <Icon className="h-6 w-6" />}
      <span className="font-semibold">{message}</span>
    </div>
  );
}
