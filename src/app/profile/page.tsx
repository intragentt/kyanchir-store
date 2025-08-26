// Местоположение: src/app/profile/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import SignOutButton from './SignOutButton';
import { getServerSession } from 'next-auth/next';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// У нас больше нет прямого экспорта `authOptions`, но `next-auth` все равно найдет его
// по стандартному пути. Для большей надежности, можно было бы передать authOptions
// сюда, но getServerSession достаточно умен, чтобы найти его сам.
// Для чистоты кода, мы уберем импорт authOptions, так как он больше не экспортируется.
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // getServerSession сам найдет authOptions в ...nextauth/route.ts
  const session = await getServerSession();
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <main>
      <PageContainer className="py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Личный кабинет
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Добро пожаловать, {session.user.name || session.user.email}!
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
