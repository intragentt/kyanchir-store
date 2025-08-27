// Местоположение: src/app/profile/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProfileClient from './ProfileClient';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// 1. Импортируем наши экспортированные authOptions.
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default async function ProfilePage() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // 2. Явно передаем authOptions в getServerSession для максимальной надежности.
  const session = await getServerSession(authOptions);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <PageContainer className="py-12">
        <ProfileClient user={user} />
      </PageContainer>
    </main>
  );
}
