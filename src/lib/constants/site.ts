// Местоположение: src/lib/constants/site.ts

// Публичные константы
export const SITE_CONFIG = {
  PRODUCTS_PER_PAGE: 24,
  MAX_SEARCH_RESULTS: 100,
  IMAGE_QUALITY: 85,
  CACHE_DURATION: 1800, // 30 minutes
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;
