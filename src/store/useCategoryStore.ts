// Местоположение: src/store/useCategoryStore.ts
import { create } from 'zustand';
import { Product } from '@/lib/csvParser'; // Используем твой тип Product

// Описываем, как выглядит товар в корзине
export interface CartItem extends Product {
  quantity: number;
}

// Описываем, что будет храниться в нашем состоянии
interface StoreState {
  // --- Состояние для категорий (остается без изменений) ---
  activeCategory: string;
  setActiveCategory: (categoryId: string) => void;

  // --- VVV--- НОВОЕ: Состояние для корзины ---VVV ---
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  totalItems: () => number;
}

export const useStore = create<StoreState>((set, get) => ({
  // --- Логика для категорий ---
  activeCategory: 'all',
  setActiveCategory: (categoryId: string) =>
    set({ activeCategory: categoryId }),

  // --- VVV--- НОВАЯ: Логика для корзины ---VVV ---
  cart: [],

  // Добавление товара в корзину
  addToCart: (product) => {
    const cart = get().cart;
    const findProduct = cart.find((p) => p.id === product.id);
    if (findProduct) {
      // Если товар уже есть, увеличиваем количество
      findProduct.quantity += 1;
    } else {
      // Если товара нет, добавляем его с количеством 1
      cart.push({ ...product, quantity: 1 });
    }
    set({ cart: [...cart] });
  },

  // Удаление товара из корзины
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((p) => p.id !== productId) });
  },

  // Обновление количества
  updateQuantity: (productId, quantity) => {
    const cart = get().cart;
    const findProduct = cart.find((p) => p.id === productId);
    if (findProduct) {
      if (quantity > 0) {
        findProduct.quantity = quantity;
        set({ cart: [...cart] });
      } else {
        // Если количество 0 или меньше, удаляем товар
        get().removeFromCart(productId);
      }
    }
  },

  // Подсчет общего количества товаров в корзине
  totalItems: () => {
    return get().cart.reduce((total, item) => total + item.quantity, 0);
  },
}));
