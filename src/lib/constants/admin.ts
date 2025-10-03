// Местоположение: src/lib/constants/admin.ts

// Админские константы
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  PRODUCTS: '/admin/products',
  EDIT_PRODUCT: (id: string) => `/admin/products/${id}/edit`,
  SETTINGS: '/admin/settings',
} as const;

export const ADMIN_PERMISSIONS = {
  CREATE_PRODUCT: 'create:product',
  EDIT_PRODUCT: 'edit:product',
  DELETE_PRODUCT: 'delete:product',
  MANAGE_USERS: 'manage:users',
} as const;

export const PRODUCT_TABLE_CONFIG = {
  PAGE_SIZE: 50,
  MAX_ITEMS_PER_PAGE: 100,
  CACHE_DURATION: 3600, // 1 hour
} as const;
