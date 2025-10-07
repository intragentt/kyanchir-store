/**
 * 📡 УТИЛИТЫ МОНИТОРИНГА И ЛОГИРОВАНИЯ
 */

export interface MonitoringEvent {
  /**
   * 🏷️ Тип события
   */
  type: string;
  /**
   * 🕒 Временная метка
   */
  timestamp: number;
  /**
   * 📦 Дополнительные данные
   */
  payload?: Record<string, unknown>;
}

const monitoringQueue: MonitoringEvent[] = [];

export function logEvent(event: MonitoringEvent) {
  console.log('🔄 monitoring.logEvent: событие', event);
  monitoringQueue.push(event);
}

export function flushEvents() {
  console.log('✅ monitoring.flushEvents: отправка событий', monitoringQueue);
  monitoringQueue.length = 0;
}

export function logError(error: Error, context?: Record<string, unknown>) {
  console.error('❌ monitoring.logError: критическая ошибка', error, context);
}

export function getMonitoringSnapshot() {
  return [...monitoringQueue];
}
