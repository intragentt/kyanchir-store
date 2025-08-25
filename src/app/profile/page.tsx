// Местоположение: src/app/profile/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import SignOutButton from './SignOutButton';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { redirect } from 'next/navigation';
import { JWTPayload } from 'jose';

interface UserPayload extends JWTPayload {
  userId?: string;
  name?: string | null;
  email?: string | null;
}

export default async function ProfilePage() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Дожидаемся выполнения Promise от cookies() ПЕРЕД вызовом .get()
  const sessionCookie = (await cookies()).get('session')?.value;

  const user = (await decrypt(sessionCookie)) as UserPayload | null;
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  if (!user) {
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
              Добро пожаловать, {user.name || 'Пользователь'}!
            </p>
          </div>

          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Имя</h3>
                <p>{user.name || 'Не указано'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p>{user.email || 'Не указан'}</p>
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
