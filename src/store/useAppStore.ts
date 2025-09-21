// Местоположение: src/store/useAppStore.ts
import { create } from 'zustand';
import { Session } from 'next-auth';
import { getSession } from 'next-auth/react';

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

  user: Session['user'] | null;
  setUser: (user: Session['user'] | null) => void;
  fetchUser: () => Promise<void>;

  isFloatingMenuOpen: boolean;
  setFloatingMenuOpen: (isOpen: boolean) => void;

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем состояние для поиска ---
  isSearchActive: boolean;
  setSearchActive: (isActive: boolean) => void;
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

  fetchUser: async () => {
    try {
      const session = await getSession();
      set({ user: session?.user ?? null });
    } catch (error) {
      console.error('Failed to fetch user session:', error);
      set({ user: null });
    }
  },

  isFloatingMenuOpen: false,
  setFloatingMenuOpen: (isOpen) => set({ isFloatingMenuOpen: isOpen }),

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Реализуем состояние для поиска ---
  isSearchActive: false,
  setSearchActive: (isActive) => set({ isSearchActive: isActive }),
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}));
