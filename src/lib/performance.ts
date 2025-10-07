/**
 * ⚡ УТИЛИТЫ ДЛЯ ИЗМЕРЕНИЯ ПРОИЗВОДИТЕЛЬНОСТИ
 */

interface PerformanceMarkOptions {
  /**
   * 📝 Дополнительные метки
   */
  detail?: Record<string, unknown>;
}

export function markStart(name: string, options: PerformanceMarkOptions = {}) {
  console.log('🔄 performance.markStart', { name, options });
  if (typeof performance !== 'undefined') {
    performance.mark(`${name}-start`, options);
  }
}

export function markEnd(name: string, options: PerformanceMarkOptions = {}) {
  console.log('🔄 performance.markEnd', { name, options });
  if (typeof performance !== 'undefined') {
    performance.mark(`${name}-end`, options);
  }
}

export function measure(name: string) {
  if (typeof performance === 'undefined') return null;
  try {
    const measureName = `${name}-measure`;
    performance.measure(measureName, `${name}-start`, `${name}-end`);
    const entries = performance.getEntriesByName(measureName);
    const lastEntry = entries.at(-1) ?? null;
    console.log('✅ performance.measure', { name, duration: lastEntry?.duration });
    return lastEntry;
  } catch (error) {
    console.log('❌ performance.measure error', error);
    return null;
  }
}
