// Местоположение: src/app/api/products/bulk-update-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProductStatus } from '@/lib/types';

interface RequestBody {
  productIds: string[];
  status: ProductStatus;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role?.name !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body: RequestBody = await request.json();
    const { productIds, status } = body;

    if (!productIds || !status || !status.id || productIds.length === 0) {
      return new NextResponse('Missing productIds or a valid status object', {
        status: 400,
      });
    }

    const updatedCount = await prisma.product.updateMany({
      where: {
        id: {
          in: productIds,
        },
      },
      data: {
        statusId: status.id,
      },
    });

    return NextResponse.json({
      message: `Successfully updated ${updatedCount.count} products.`,
      count: updatedCount.count,
    });
  } catch (error) {
    console.error('Error updating product statuses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
