'use server'; // <-- Это специальная директива, которая говорит Next.js, что это серверный файл

import { revalidatePath } from 'next/cache';
import { z } from 'zod'; // Zod для надежной валидации данных
import bcrypt from 'bcrypt';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Схема валидации для данных профиля
const profileSchema = z.object({
  name: z.string().min(1, 'Имя не может быть пустым.'),
  surname: z.string().optional(),
});

// Экшен для обновления имени и фамилии
export async function updateUserProfile(formData: {
  name: string;
  surname?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Неавторизован' };
  }

  const validatedFields = profileSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { error: 'Неверные данные.' };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedFields.data.name,
        surname: validatedFields.data.surname,
      },
    });

    revalidatePath('/profile'); // Говорим Next.js обновить данные на странице профиля
    return { success: true, data: updatedUser };
  } catch (error) {
    return { error: 'Не удалось обновить профиль.' };
  }
}

// Схема валидации для пароля
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Текущий пароль обязателен.'),
  newPassword: z
    .string()
    .min(8, 'Новый пароль должен быть не менее 8 символов.'),
});

// Экшен для обновления пароля
export async function updateUserPassword(formData: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Неавторизован' };
  }

  const validatedFields = passwordSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { error: 'Неверные данные для смены пароля.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.passwordHash) {
      return { error: 'Пользователь не найден или не имеет пароля.' };
    }

    const isPasswordValid = await bcrypt.compare(
      validatedFields.data.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return { error: 'Текущий пароль неверен.' };
    }

    const newPasswordHash = await bcrypt.hash(
      validatedFields.data.newPassword,
      10,
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    });

    return { success: true };
  } catch (error) {
    return { error: 'Не удалось обновить пароль.' };
  }
}
