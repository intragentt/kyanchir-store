// Местоположение: src/store/useAppStore.ts
import { create } from 'zustand';
import { UserPayload } from '@/app/layout'; // Импортируем наш тип пользователя

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

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Добавляем новые "ячейки" для пользователя
  user: UserPayload | null;
  setUser: (user: UserPayload | null) => void;
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}

let notificationTimeout: NodeJS.Timeout;

export const useAppStore = create<AppState>((set, get) => ({
  isOnline: true,
  setIsOnline: (isOnline) => set({ isOnline }),

  notification: {
    isVisible: false,
    message: '',
    type: 'success',
    Icon: null,
  },

  showNotification: (message, type, Icon) => {
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }
    set({
      notification: { isVisible: true, message, type, Icon },
    });
    notificationTimeout = setTimeout(() => {
      get().hideNotification();
    }, 3000);
  },

  hideNotification: () => {
    set((state) => ({
      notification: { ...state.notification, isVisible: false },
    }));
  },

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Добавляем реализацию для новых "ячеек"
  user: null,
  setUser: (user) => set({ user }),
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}));
