// Местоположение: src/app/profile/page.tsx
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// Исправляем опечатку в пути: 'Page-container' -> 'PageContainer'
import PageContainer from '@/components/layout/PageContainer';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProfileClient from './ProfileClient';
import { authOptions } from '@/lib/auth';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

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
