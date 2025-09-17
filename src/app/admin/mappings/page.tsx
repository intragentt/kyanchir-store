// Местоположение: /src/app/admin/mappings/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import { getMappings } from './actions';
import MappingsTable from '@/components/admin/MappingsTable';
import Link from 'next/link'; // <-- 1. Импортируем Link

export const dynamic = 'force-dynamic';

export default async function MappingsPage() {
  const mappings = await getMappings();

  return (
    <main>
      <PageContainer className="py-12">
        {/* --- НАЧАЛО НОВОГО КОДА --- */}
        <Link
          href="/admin/categories"
          className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-800"
        >
          &larr; Назад к классификации
        </Link>
        {/* --- КОНЕЦ НОВОГО КОДА --- */}

        <MappingsTable mappings={mappings} />
      </PageContainer>
    </main>
  );
}
