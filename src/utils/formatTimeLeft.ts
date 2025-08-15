// Местоположение: src/utils/formatTimeLeft.ts

/**
 * Преобразует дату в человекочитаемую строку об оставшемся времени.
 * @param date - Дата окончания (может быть объектом Date, строкой или null/undefined).
 * @returns Строка вида "Осталось 5д", "Осталось 12ч", "Истекла" или пустая строка.
 */
export function formatTimeLeft(date: Date | string | null | undefined): string {
  // Если даты нет, ничего не возвращаем
  if (!date) {
    return '';
  }

  const targetDate = new Date(date);
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  // Если время уже вышло, возвращаем "Истекла"
  if (diff <= 0) {
    return 'Истекла';
  }

  // Считаем дни, часы и минуты
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) {
    return `Осталось ${days}д`;
  }

  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (hours > 0) {
    return `Осталось ${hours}ч`;
  }

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (minutes > 0) {
    return `Осталось ${minutes}м`;
  }

  // Если осталось меньше минуты, но время еще не вышло
  return 'Меньше 1м';
}
