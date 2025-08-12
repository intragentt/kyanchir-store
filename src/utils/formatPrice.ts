// Местоположение: src/utils/formatPrice.ts

export interface PriceParts {
  value: string;
  currency: string;
}

// ИЗМЕНЕНИЕ: Теперь функция может вернуть `null`
export function formatPrice(price: number | null | undefined): PriceParts | null {
  // Если цена не пришла или равна 0, возвращаем null
  if (!price) {
    return null;
  }

  const valueString = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return { value: valueString, currency: 'RUB' };
}
