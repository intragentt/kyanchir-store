// Местоположение: /src/app/admin/mappings/page.tsx
// --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем мертвый импорт ---
// import PageContainer from '@/components/layout/PageContainer';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import { getMappings } from './actions';
import MappingsTable from '@/components/admin/MappingsTable';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MappingsPage() {
  const mappings = await getMappings();

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем все обертки и возвращаем чистый контент ---
  return (
    <>
      <Link
        href="/admin/categories"
        className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-800"
      >
        &larr; Назад к классификации
      </Link>

      <MappingsTable mappings={mappings} />
    </>
  );
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}
