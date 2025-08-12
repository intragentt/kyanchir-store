// Местоположение: src/context/StickyHeaderContext.ts
import { createContext, useContext } from 'react';

export type HeaderStatus = 'static' | 'pinned' | 'unpinned';

export interface StickyHeaderContextType {
  headerStatus: HeaderStatus;
  headerHeight: number;
  setHeaderHeight: (height: number) => void;
  isSearchActive: boolean;
  setIsSearchActive: (isActive: boolean) => void;
  // --- ИЗМЕНЕНИЕ 1: Добавляем состояние для меню ---
  isMenuOpen: boolean;
  // --- ИЗМЕНЕНИЕ 2: Добавляем функцию для управления меню ---
  setIsMenuOpen: (isOpen: boolean) => void;
}

export const StickyHeaderContext = createContext<
  StickyHeaderContextType | undefined
>(undefined);

export function useStickyHeader() {
  const context = useContext(StickyHeaderContext);
  if (!context) {
    throw new Error(
      'useStickyHeader must be used within a StickyHeaderProvider',
    );
  }
  return context;
}
