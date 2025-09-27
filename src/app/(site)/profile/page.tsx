// Местоположение: src/app/(site)/profile/page.tsx
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProfileClient from './ProfileClient';
import { authOptions } from '@/lib/auth';
import { decrypt } from '@/lib/encryption'; // <-- ДОБАВЛЕНО: Импортируем нашу утилиту

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
      role: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Дешифровка данных перед отправкой на клиент ---
  // Мы создаем новый объект, который будет безопасно передан в клиентский компонент.
  const userForClient = {
    ...user,
    // Дешифруем поля. Если поле пустое, возвращаем пустую строку.
    name: user.name_encrypted ? decrypt(user.name_encrypted) : '',
    surname: user.surname_encrypted ? decrypt(user.surname_encrypted) : '',
    email: user.email_encrypted ? decrypt(user.email_encrypted) : '',
  };
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return <ProfileClient user={userForClient} />;
}
