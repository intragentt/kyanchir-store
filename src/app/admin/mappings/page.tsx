// Местоположение: /src/app/admin/mappings/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import { getMappings } from './actions';
import MappingsTable from '@/components/admin/MappingsTable';

export const dynamic = 'force-dynamic';

export default async function MappingsPage() {
  const mappings = await getMappings();

  return (
    <main>
      <PageContainer className="py-12">
        <MappingsTable mappings={mappings} />
      </PageContainer>
    </main>
  );
}
