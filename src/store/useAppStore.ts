// Местоположение: src/store/useAppStore.ts
import { create } from 'zustand';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { Session } from 'next-auth'; // Импортируем тип Session
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
  user: Session['user'] | null; // Используем официальный тип пользователя
  setUser: (user: Session['user'] | null) => void;
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  isFloatingMenuOpen: boolean;
  setFloatingMenuOpen: (isOpen: boolean) => void;
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
    if (notificationTimeout) clearTimeout(notificationTimeout);
    set({ notification: { isVisible: true, message, type, Icon } });
    notificationTimeout = setTimeout(() => get().hideNotification(), 3000);
  },

  hideNotification: () => {
    set((state) => ({
      notification: { ...state.notification, isVisible: false },
    }));
  },

  user: null,
  setUser: (user) => set({ user }),

  isFloatingMenuOpen: false,
  setFloatingMenuOpen: (isOpen) => set({ isFloatingMenuOpen: isOpen }),
}));
