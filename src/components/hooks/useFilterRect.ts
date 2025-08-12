import { useEffect } from 'react';

export function useFilterRect(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    function handleResize() {
      // Можно расширить для обновления размеров
    }
    window.addEventListener('resize', handleResize);
    let observer: ResizeObserver | null = null;
    if (ref.current && 'ResizeObserver' in window) {
      observer = new ResizeObserver(() => {
        handleResize();
      });
      observer.observe(ref.current);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer && ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref]);
}
