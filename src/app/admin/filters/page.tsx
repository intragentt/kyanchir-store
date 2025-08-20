// Местоположение: src/app/admin/filters/page.tsx
// --- НАЧАЛО ИЗМЕНЕНИЙ ---

import PageContainer from '@/components/layout/PageContainer';
import prisma from '@/lib/prisma';
import FilterManagerClient from '@/app/admin/filters/FilterManagerClient';

export const dynamic = 'force-dynamic';

export default async function FilterSettingsPage() {
  // Используем `prisma.filterPreset.upsert`.
  // Если пресет 'main-store-filter' не найден, он будет создан.
  // Это гарантирует, что у нас всегда есть объект для работы.
  const mainFilterPreset = await prisma.filterPreset.upsert({
    where: { name: 'main-store-filter' },
    update: {}, // Если нашли, ничего не обновляем на этом этапе.
    create: {
      // УБРАНО: displayName: 'Фильтр категорий на главной',
      // Оставляем только те поля, которые есть в вашей модели Prisma.
      name: 'main-store-filter',
    },
    include: {
      // Сразу подгружаем связанные элементы фильтра и сами категории.
      // Это ВАЖНО, чтобы TypeScript понял, что поле `items` существует.
      items: {
        orderBy: { order: 'asc' },
        include: {
          category: true,
        },
      },
    },
  });

  // Запрашиваем полный список категорий для отображения в "неактивных".
  const allCategories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <main>
      <PageContainer className="py-12">
        <h1 className="mb-6 text-2xl font-bold">
          Управление фильтром категорий
        </h1>
        <FilterManagerClient
          preset={mainFilterPreset}
          allCategories={allCategories}
        />
      </PageContainer>
    </main>
  );
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
