import PageContainer from '@/components/layout/PageContainer';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { signOut } from 'next-auth/react';
import SignOutButton from './SignOutButton'; // Мы вынесем кнопку в клиентский компонент

export default async function ProfilePage() {
  // 1. Получаем "пропуск" пользователя на сервере.
  const session = await getServerSession();

  // 2. "Фейс-контроль": если "пропуска" нет, отправляем на страницу входа.
  if (!session || !session.user) {
    redirect('/login');
  }

  // 3. Если пользователь на месте, показываем его данные.
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
              {/* Здесь в будущем появятся K-Coins, история заказов и т.д. */}
            </div>
          </div>

          <div className="mt-6">
            {/* 4. Кнопка "Выйти", вынесенная в клиентский компонент */}
            <SignOutButton />
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
