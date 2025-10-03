// Местоположение: src/lib/utils/formatting.ts

// Утилиты форматирования
export const formatPrice = (price: number, currency = '₽'): string => {
  return `${price.toLocaleString('ru-RU')} ${currency}`;
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU');
};

export const formatStock = (stock: number): string => {
  if (stock === 0) return 'Нет в наличии';
  if (stock < 5) return `Осталось ${stock} шт.`;
  return 'В наличии';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
