// Местоположение: src/app/admin/categories/page.tsx
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { ClassificationClient } from './ClassificationClient';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  // Загружаем все три типа данных параллельно для эффективности
  const [categories, tags, codeRules] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
    prisma.codeRule.findMany({
      orderBy: { assignedCode: 'asc' },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <Link
        href="/admin/dashboard"
        className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-800"
      >
        &larr; Назад к товарам
      </Link>

      <div className="mb-8 text-2xl font-bold text-gray-900">
        Управление классификацией
      </div>

      <ClassificationClient
        initialCategories={categories}
        initialTags={tags}
        initialCodeRules={codeRules} // <-- Передаем новый пропс
      />
    </main>
  );
}
