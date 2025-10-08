import { useEffect } from 'react';

export function useFilterRect(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = ref.current;

    function handleResize() {
      // Можно расширить для обновления размеров
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    let observer: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && element && 'ResizeObserver' in window) {
      observer = new ResizeObserver(() => {
        handleResize();
      });
      observer.observe(element);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
      if (observer && element) {
        observer.unobserve(element);
      }
    };
  }, [ref]);
}
