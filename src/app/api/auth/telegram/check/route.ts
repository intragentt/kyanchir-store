// Местоположение: src/app/api/auth/telegram/check/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ status: 'error', message: 'Token required' }, { status: 400 });
    }

    const loginToken = await prisma.loginToken.findUnique({
      where: { token },
    });

    if (!loginToken) {
      return NextResponse.json({ status: 'expired' });
    }

    const now = new Date();
    if (now > loginToken.expires) {
      try {
        await prisma.loginToken.delete({ where: { token } });
      } catch (cleanupError) {
        console.error('Failed to delete expired login token:', cleanupError);
      }
      return NextResponse.json({ status: 'expired' });
    }

    if (loginToken.userId) {
      return NextResponse.json({ status: 'activated' });
    }

    return NextResponse.json({ status: 'pending' });
  } catch (error) {
    console.error('Error checking login token:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
