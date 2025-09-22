// Местоположение: src/app/admin/filters/page.tsx
// --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем мертвый импорт ---
// import PageContainer from '@/components/layout/PageContainer';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import prisma from '@/lib/prisma';
import FilterManagerClient from '@/app/admin/filters/FilterManagerClient';

export const dynamic = 'force-dynamic';

export default async function FilterSettingsPage() {
  const mainFilterPreset = await prisma.filterPreset.upsert({
    where: { name: 'main-store-filter' },
    update: {},
    create: {
      name: 'main-store-filter',
    },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: {
          category: true,
        },
      },
    },
  });

  const allCategories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем все обертки и возвращаем чистый контент ---
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Управление фильтром категорий</h1>
      <FilterManagerClient
        preset={mainFilterPreset}
        allCategories={allCategories}
      />
    </>
  );
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}
