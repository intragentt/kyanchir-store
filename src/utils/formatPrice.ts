// Местоположение: src/utils/formatPrice.ts

export interface PriceParts {
  value: string; // "2 200"
  currency: string; // "RUB"
}

// ИЗМЕНЕНИЕ: Функция теперь знает, что цена приходит в копейках.
export function formatPrice(
  priceInCents: number | null | undefined,
): PriceParts | null {
  // Если цена не предоставлена, невалидна или равна 0, возвращаем null
  if (
    priceInCents === null ||
    priceInCents === undefined ||
    priceInCents === 0
  ) {
    return null;
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // 1. Переводим копейки в рубли
  const priceInRubles = priceInCents / 100;

  // 2. Форматируем число в строку с пробелами в качестве разделителей
  //    и отбрасываем дробную часть, если она равна .00
  const formattedValue = new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInRubles);

  return { value: formattedValue, currency: 'RUB' };
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}
