// Местоположение: src/app/api/auth/telegram/finalize/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMinutes } from 'date-fns';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { message: 'Token required' },
        { status: 400 },
      );
    }

    const loginToken = await prisma.loginToken.findUnique({
      where: { token },
    });

    if (!loginToken) {
      return NextResponse.json({ message: 'Token not found' }, { status: 404 });
    }

    const now = new Date();
    if (now > loginToken.expires) {
      try {
        await prisma.loginToken.delete({ where: { token } });
      } catch (cleanupError) {
        console.error('Failed to delete expired login token:', cleanupError);
      }
      return NextResponse.json({ message: 'Token expired' }, { status: 410 });
    }

    if (!loginToken.userId) {
      return NextResponse.json(
        { message: 'Token is not confirmed yet' },
        { status: 409 },
      );
    }

    const nextToken = randomBytes(32).toString('hex');
    const nextExpires = addMinutes(now, 5);

    await prisma.$transaction([
      prisma.loginToken.create({
        data: {
          token: nextToken,
          userId: loginToken.userId,
          expires: nextExpires,
        },
      }),
      prisma.loginToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ status: 'success', token: nextToken });
  } catch (error) {
    console.error('Error finalizing login:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
