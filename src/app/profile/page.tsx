// Местоположение: src/app/profile/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import SignOutButton from './SignOutButton';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Импортируем наши "правила"
import { redirect } from 'next/navigation';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default async function ProfilePage() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Получаем сессию официальным способом
  const session = await getServerSession(authOptions);

  // "Фейс-контроль": middleware уже должен был это сделать, но это дополнительная защита
  if (!session?.user) {
    redirect('/login');
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <main>
      <PageContainer className="py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Личный кабинет
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Добро пожаловать, {session.user.name || 'Пользователь'}!
            </p>
          </div>

          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Имя</h3>
                <p>{session.user.name || 'Не указано'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p>{session.user.email || 'Не указан'}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <SignOutButton />
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
