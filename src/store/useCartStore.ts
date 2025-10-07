// Местоположение: src/store/useCartStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartItem = {
  id: string;
  productId: string;
  productSlug: string;
  variantId: string;
  productSizeId: string;
  name: string;
  size: string;
  color?: string | null;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  maxQuantity: number;
};

interface CartState {
  items: CartItem[];
  addItem: (
    item: Omit<CartItem, 'id' | 'quantity'>,
    quantity: number,
  ) => void;
  updateQuantity: (productSizeId: string, quantity: number) => void;
  removeItem: (productSizeId: string) => void;
  clearCart: () => void;
}

const clampQuantity = (quantity: number, max: number) => {
  if (max <= 0) {
    return 0;
  }
  return Math.max(1, Math.min(quantity, max));
};

export const useCartStore = create<CartState>()(
  persist<CartState, [], [], Pick<CartState, 'items'>>(
    (set) => ({
      items: [],
      addItem: (item, quantity) => {
        const normalizedItem = {
          ...item,
          productSlug: item.productSlug ?? item.productId,
        };

        set((state) => {
          const existingItem = state.items.find(
            (cartItem) => cartItem.productSizeId === normalizedItem.productSizeId,
          );

          if (existingItem) {
            const updatedQuantity = clampQuantity(
              existingItem.quantity + quantity,
              existingItem.maxQuantity,
            );

            return {
              items: state.items.map((cartItem) =>
                cartItem.productSizeId === item.productSizeId
                  ? { ...cartItem, quantity: updatedQuantity }
                  : cartItem,
              ),
            };
          }

          const safeQuantity = clampQuantity(quantity, normalizedItem.maxQuantity);
          if (safeQuantity === 0) {
            return state;
          }

          return {
            items: [
              ...state.items,
              {
                ...normalizedItem,
                id: normalizedItem.productSizeId,
                quantity: safeQuantity,
              },
            ],
          };
        });
      },
      updateQuantity: (productSizeId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productSizeId === productSizeId
              ? {
                  ...item,
                  quantity: clampQuantity(quantity, item.maxQuantity),
                }
              : item,
          ),
        }));
      },
      removeItem: (productSizeId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.productSizeId !== productSizeId,
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'kyanchir-store-cart',
      storage: createJSONStorage<Pick<CartState, 'items'>>(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { items: [] };
        }

        if (version < 2) {
          return {
            items: (persistedState as { items?: CartItem[] }).items?.map(
              (item) => ({
                ...item,
                productSlug: item.productSlug ?? item.productId,
              }),
            ) ?? [],
          };
        }

        return persistedState as Pick<CartState, 'items'>;
      },
    },
  ),
);

export const selectCartItems = (state: CartState) => state.items;

export const selectCartItemCount = (state: CartState) =>
  state.items.reduce((total, item) => total + item.quantity, 0);

export const selectCartTotal = (state: CartState) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0);
