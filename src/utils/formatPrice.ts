// Местоположение: src/utils/formatPrice.ts

export interface PriceParts {
  value: string; // "2 200"
  currency: string; // "RUB"
}

// ИЗМЕНЕНИЕ: Цена приходит уже в рублях, но функция защищает от некорректных значений.
export function formatPrice(
  price: number | null | undefined,
): PriceParts | null {
  if (price === null || price === undefined) {
    return null;
  }

  const normalizedPrice = Number(price);

  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
    return null;
  }

  const formattedValue = new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(normalizedPrice);

  return { value: formattedValue, currency: 'RUB' };
}
