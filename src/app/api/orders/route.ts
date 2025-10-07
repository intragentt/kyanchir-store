import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const orderItemSchema = z.object({
  productSizeId: z.string().min(1),
  quantity: z.number().int().min(1),
});

const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Укажите имя получателя'),
  customerEmail: z.string().email('Укажите корректный email'),
  customerPhone: z
    .string()
    .min(6, 'Укажите телефон получателя')
    .max(20, 'Телефон слишком длинный'),
  shippingAddress: z.string().min(3, 'Укажите адрес доставки'),
  shippingCity: z.string().min(2, 'Укажите город доставки'),
  shippingPostalCode: z
    .string()
    .min(3, 'Индекс должен содержать не менее 3 символов')
    .max(12, 'Индекс должен содержать не более 12 символов'),
  items: z.array(orderItemSchema).min(1, 'Добавьте товары в заказ'),
});

const generateOrderNumber = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KYN-${datePart}-${randomPart}`;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: 'Некорректный формат запроса' },
      { status: 400 },
    );
  }

  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Проверьте корректность данных';
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const data = parsed.data;
  const uniqueSizeIds = Array.from(new Set(data.items.map((item) => item.productSizeId)));

  try {
    const productSizes = await prisma.productSize.findMany({
      where: { id: { in: uniqueSizeIds } },
      include: {
        size: true,
        productVariant: {
          include: {
            product: true,
          },
        },
      },
    });

    if (productSizes.length !== uniqueSizeIds.length) {
      return NextResponse.json(
        { error: 'Некоторые позиции не найдены или недоступны' },
        { status: 400 },
      );
    }

    const sizeById = new Map(productSizes.map((size) => [size.id, size]));

    const itemsPayload = data.items.map((item) => {
      const size = sizeById.get(item.productSizeId);

      if (!size) {
        throw new Error('Запрошенный размер не найден');
      }

      if (size.stock < item.quantity) {
        throw new Error(
          `Недостаточно товара для размера ${size.size.value}. Доступно ${size.stock} шт.`,
        );
      }

      const unitPrice = size.price ?? size.productVariant.price;

      return {
        productSizeId: size.id,
        quantity: item.quantity,
        unitPrice,
        productName: size.productVariant.product.name,
        productColor: size.productVariant.color ?? null,
        productSizeValue: size.size.value,
        productArticle: size.productVariant.product.article ?? null,
        stockAfterOrder: size.stock - item.quantity,
      };
    });

    const totalAmount = itemsPayload.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const pendingStatus = await prisma.orderStatus.findFirst({
      where: { name: 'PENDING' },
    });

    if (!pendingStatus) {
      return NextResponse.json(
        { error: 'Статус заказа PENDING не настроен' },
        { status: 500 },
      );
    }

    const orderNumber = generateOrderNumber();

    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          statusId: pendingStatus.id,
          totalAmount,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress,
          shippingCity: data.shippingCity,
          shippingPostalCode: data.shippingPostalCode,
          items: {
            create: itemsPayload.map((item) => ({
              productSizeId: item.productSizeId,
              quantity: item.quantity,
              priceAtPurchase: item.unitPrice,
              productName: item.productName,
              productArticle: item.productArticle,
              productColor: item.productColor,
              productSizeValue: item.productSizeValue,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      await Promise.all(
        itemsPayload.map((item) =>
          tx.productSize.update({
            where: { id: item.productSizeId },
            data: { stock: item.stockAfterOrder },
          }),
        ),
      );

      return order;
    });

    return NextResponse.json(
      {
        orderNumber: createdOrder.orderNumber,
        totalAmount: createdOrder.totalAmount,
        customerEmail: createdOrder.customerEmail,
        items: createdOrder.items.map((item) => ({
          productSizeId: item.productSizeId,
          productName: item.productName,
          productSizeValue: item.productSizeValue,
          productColor: item.productColor,
          quantity: item.quantity,
          unitPrice: item.priceAtPurchase,
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Недостаточно товара')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 },
      );
    }

    console.error('Failed to create order', error);
    return NextResponse.json(
      { error: 'Не удалось оформить заказ. Попробуйте позже.' },
      { status: 500 },
    );
  }
}
