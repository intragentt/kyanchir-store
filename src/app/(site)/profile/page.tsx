// Местоположение: src/app/(site)/profile/page.tsx
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
    include: {
      role: true, // Включаем роль, чтобы она была доступна в ProfileClient
    },
  });

  if (!user) {
    redirect('/login');
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем все обертки (main, PageContainer) ---
  // Страница должна возвращать только сам компонент,
  // так как AppCore уже предоставляет всю необходимую структуру.
  return <ProfileClient user={user} />;
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}
