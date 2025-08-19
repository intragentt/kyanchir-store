// src/hooks/useSmartSticky.ts
import { useState, useEffect, useRef } from 'react';

/**
 * Хук для управления видимостью "умного" липкого элемента (шапки или футера).
 * Элемент скрывается при скролле вниз и появляется при скролле вверх ИЛИ при остановке скролла.
 * @param {number} threshold - Дистанция в пикселях для изменения состояния.
 * @param {number} scrollStopDelay - Задержка в мс, после которой скролл считается остановленным.
 */
export function useSmartSticky(
  threshold: number = 5,
  scrollStopDelay: number = 150,
) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Используем useRef для хранения ID таймера без вызова ре-рендеров
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // --- НАЧАЛО ИЗМЕНЕНИЙ ---
      // Сбрасываем таймер при каждом событии скролла
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Устанавливаем новый таймер, который сработает, если скролл прекратится
      scrollTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, scrollStopDelay);
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---

      if (currentScrollY < threshold) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      if (Math.abs(currentScrollY - lastScrollY) < threshold) {
        return;
      }

      if (currentScrollY > lastScrollY) {
        setIsVisible(false); // Скролл вниз -> прячем
      } else {
        setIsVisible(true); // Скролл вверх -> показываем
      }

      setLastScrollY(currentScrollY > 0 ? currentScrollY : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      // --- НАЧАЛО ИЗМЕНЕНИЙ ---
      // Очищаем таймер при размонтировании компонента, чтобы избежать утечек памяти
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    };
    // Обновляем зависимости, чтобы хук правильно работал с замыканиями
  }, [lastScrollY, threshold, scrollStopDelay]);

  return isVisible;
}
