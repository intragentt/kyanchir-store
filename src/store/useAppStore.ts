// Местоположение: src/store/useAppStore.ts
import { create } from 'zustand';
import { Product } from '@/lib/csvParser';

export interface CartItem extends Product {
  quantity: number;
}

interface StoreState {
  activeCategory: string;
  setActiveCategory: (categoryId: string) => void;

  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  totalItems: () => number;
}

export const useAppStore = create<StoreState>((set, get) => ({
  activeCategory: 'all',
  setActiveCategory: (categoryId: string) =>
    set({ activeCategory: categoryId }),

  cart: [],

  addToCart: (product) => {
    const cart = get().cart;
    const findProduct = cart.find((p) => p.id === product.id);
    if (findProduct) {
      findProduct.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    set({ cart: [...cart] });
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((p) => p.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    const cart = get().cart;
    const findProduct = cart.find((p) => p.id === productId);
    if (findProduct) {
      if (quantity > 0) {
        findProduct.quantity = quantity;
        set({ cart: [...cart] });
      } else {
        get().removeFromCart(productId);
      }
    }
  },

  totalItems: () => {
    return get().cart.reduce((total, item) => total + item.quantity, 0);
  },
}));
