// Местоположение: src/app/profile/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import prisma from '@/lib/prisma';
import ProfileClient from './ProfileClient'; // Импортируем наш новый клиентский компонент
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default async function ProfilePage() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Глубокий запрос: получаем ПОЛНЫЕ данные пользователя из БД, а не только из сессии.
  // Это дает нам доступ к `emailVerified` и другим полям.
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    // Если по какой-то причине пользователь из сессии не найден в БД, выкидываем на логин.
    redirect('/login');
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <main>
      <PageContainer className="py-12">
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
        {/* Всю логику отображения и взаимодействия передаем в "Зал" (клиентский компонент) */}
        <ProfileClient user={user} />
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
      </PageContainer>
    </main>
  );
}
