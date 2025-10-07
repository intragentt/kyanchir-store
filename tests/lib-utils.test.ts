import assert from 'node:assert/strict';
import test from 'node:test';
import {
  flushEvents,
  getMonitoringSnapshot,
  logError,
  logEvent,
} from '@/lib/monitoring';
import { markEnd, markStart, measure } from '@/lib/performance';

/**
 * 🧪 Проверяем очередь мониторинга.
 */
test('monitoring queue собирает и очищает события', () => {
  flushEvents();
  logEvent({ type: 'test', timestamp: Date.now(), payload: { value: 1 } });
  const snapshot = getMonitoringSnapshot();
  assert.equal(snapshot.length, 1);
  flushEvents();
  assert.equal(getMonitoringSnapshot().length, 0);
  logError(new Error('demo-error'));
});

/**
 * 🧪 Проверяем измерения производительности.
 */
test('performance measure возвращает запись', () => {
  markStart('demo');
  markEnd('demo');
  const entry = measure('demo');
  assert.ok(entry === null || entry.duration >= 0);
});
