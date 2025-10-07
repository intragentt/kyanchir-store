import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SkeletonLoader } from '@/components/shared/ui/SkeletonLoader';
import { LoadingButton } from '@/components/shared/ui/LoadingButton';

/**
 * 🧪 Проверяем, что SkeletonLoader отрисовывает заданное число строк.
 */
test('SkeletonLoader рендерит корректное количество строк', () => {
  const html = renderToString(
    <SkeletonLoader rows={2} columns={2} animated={false} />,
  );
  const rowMatches = html.match(/data-row-index/g) ?? [];
  assert.equal(rowMatches.length, 2);
});

/**
 * 🧪 Проверяем aria-атрибуты LoadingButton во время загрузки.
 */
test('LoadingButton выставляет aria-busy при загрузке', () => {
  const html = renderToString(
    <LoadingButton isLoading className="test">
      Тест
    </LoadingButton>,
  );
  assert.ok(html.includes('aria-busy="true"'));
});
