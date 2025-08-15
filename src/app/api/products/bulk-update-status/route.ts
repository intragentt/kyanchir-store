// Местоположение: src/app/api/products/bulk-update-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// VVV--- ИСПРАВЛЕНИЕ ИМПОРТА ---VVV
import { Prisma } from '@prisma/client';
type ProductStatus = Prisma.ProductGetPayload<{}>['status'];

interface RequestBody {
  productIds: string[];
  status: ProductStatus;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { productIds, status } = body;

    if (!productIds || !status || productIds.length === 0) {
      return new NextResponse('Missing productIds or status', { status: 400 });
    }

    // Здесь мы обновляем именно ПРОДУКТЫ, а не варианты,
    // так как статус принадлежит продукту.
    const updatedCount = await prisma.product.updateMany({
      where: {
        id: {
          in: productIds,
        },
      },
      data: {
        status: status,
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
