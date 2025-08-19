// Местоположение: src/store/useAppStore.ts
import { create } from 'zustand';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Новая, более мощная система уведомлений ---
interface NotificationState {
  isVisible: boolean;
  message: string;
  type: 'success' | 'error';
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
}

interface AppState {
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;

  notification: NotificationState;
  showNotification: (
    message: string,
    type: 'success' | 'error',
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>,
  ) => void;
  hideNotification: () => void;
}

// --- КОНЕЦ ИЗМЕНЕНИЙ ---

let notificationTimeout: NodeJS.Timeout;

export const useAppStore = create<AppState>((set, get) => ({
  isOnline: true,
  setIsOnline: (isOnline) => set({ isOnline }),

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Реализация новой системы ---
  notification: {
    isVisible: false,
    message: '',
    type: 'success',
    Icon: null,
  },

  showNotification: (message, type, Icon) => {
    // Если уже есть уведомление, сначала сбрасываем таймер
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }

    set({
      notification: { isVisible: true, message, type, Icon },
    });

    // Устанавливаем таймер на скрытие через 3 секунды
    notificationTimeout = setTimeout(() => {
      get().hideNotification();
    }, 3000);
  },

  hideNotification: () => {
    set((state) => ({
      notification: { ...state.notification, isVisible: false },
    }));
  },
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}));
