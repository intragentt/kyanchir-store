// Местоположение: src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// --- ИЗМЕНЕНИЕ: Импортируем новую функцию архивации ---
import { archiveMoySkladProducts } from '@/lib/moysklad-api';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      status: true,
      variants: {
        include: {
          images: true,
          sizes: {
            include: {
              size: true,
            },
          },
        },
      },
    },
  });
  if (!product) {
    return new NextResponse('Продукт не найден', { status: 404 });
  }
  return NextResponse.json(product);
}

// --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью переписываем логику "удаления" на "архивацию" ---
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизован', { status: 401 });
  }

  try {
    const { id } = params;

    // 1. Находим товар и все ID, связанные с МойСклад
    const productToArchive = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          select: {
            moySkladId: true,
          },
        },
      },
    });

    if (!productToArchive) {
      return new NextResponse('Продукт не найден', { status: 404 });
    }

    const moySkladIdsToArchive = productToArchive.variants
      .map((v) => v.moySkladId)
      .filter((id): id is string => !!id);

    if (productToArchive.moyskladId) {
      moySkladIdsToArchive.push(productToArchive.moyskladId);
    }

    // 2. Архивируем в МойСклад
    if (moySkladIdsToArchive.length > 0) {
      await archiveMoySkladProducts(moySkladIdsToArchive);
    }

    // 3. Находим ID статуса "ARCHIVED" в нашей БД
    const archivedStatus = await prisma.status.findUnique({
      where: { name: 'ARCHIVED' },
    });
    if (!archivedStatus) {
      throw new Error('Статус "ARCHIVED" не найден в базе данных.');
    }

    // 4. Обновляем статус товара в нашей БД, а не удаляем его
    await prisma.product.update({
      where: { id },
      data: {
        statusId: archivedStatus.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Ошибка при архивации продукта:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const productId = params.id;
    const body: {
      name: string;
      status: { id: string; name: string };
      article: string | null;
      variants: any[];
      categories: { id: string }[];
      tags: { id: string }[];
      attributes: { key: string; value: string; isMain: boolean }[];
      alternativeNames: { value: string }[];
    } = await req.json();

    const {
      name,
      status,
      article,
      variants,
      categories,
      tags,
      attributes,
      alternativeNames,
    } = body;

    const updatedProduct = await prisma.$transaction(
      async (tx) => {
        await tx.product.update({
          where: { id: productId },
          data: {
            name,
            article,
            statusId: status.id,
            categories: {
              set: categories.map((cat: { id: string }) => ({ id: cat.id })),
            },
            tags: { set: tags.map((tag: { id: string }) => ({ id: tag.id })) },
          },
        });

        await tx.attribute.deleteMany({ where: { productId } });
        if (attributes && attributes.length > 0) {
          await tx.attribute.createMany({
            data: attributes.map((attr: any) => ({
              key: attr.key,
              value: attr.value,
              isMain: attr.isMain,
              productId,
            })),
          });
        }
        await tx.alternativeName.deleteMany({ where: { productId } });
        if (alternativeNames && alternativeNames.length > 0) {
          await tx.alternativeName.createMany({
            data: alternativeNames.map((altName: any) => ({
              value: altName.value,
              productId,
            })),
          });
        }

        const oldVariants = await tx.productVariant.findMany({
          where: { productId },
          select: { id: true },
        });
        const oldVariantIds = oldVariants.map((v) => v.id);

        if (oldVariantIds.length > 0) {
          await tx.productSize.deleteMany({
            where: { productVariantId: { in: oldVariantIds } },
          });
          await tx.image.deleteMany({
            where: { variantId: { in: oldVariantIds } },
          });
          await tx.productVariant.deleteMany({ where: { productId } });
        }

        for (const variantData of variants) {
          const newVariant = await tx.productVariant.create({
            data: {
              product: { connect: { id: productId } },
              color: variantData.color,
              price: variantData.price,
              oldPrice: variantData.oldPrice,
              bonusPoints: variantData.bonusPoints,
              discountExpiresAt: variantData.discountExpiresAt,
            },
          });

          if (variantData.images && variantData.images.length > 0) {
            await tx.image.createMany({
              data: variantData.images.map((img: any, index: number) => ({
                url: img.url,
                order: index,
                variantId: newVariant.id,
              })),
            });
          }

          if (variantData.sizes && variantData.sizes.length > 0) {
            await tx.productSize.createMany({
              data: variantData.sizes.map((s: any) => ({
                stock: s.stock,
                sizeId: s.size.id,
                productVariantId: newVariant.id,
                moyskladId: s.moyskladId,
              })),
            });
          }
        }

        return tx.product.findUnique({
          where: { id: productId },
          include: {
            status: true,
            alternativeNames: true,
            variants: {
              include: { images: true, sizes: { include: { size: true } } },
            },
            attributes: true,
            categories: true,
            tags: true,
          },
        });
      },
      { timeout: 20000 },
    );

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Ошибка при обновлении продукта:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Ошибка на сервере';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
