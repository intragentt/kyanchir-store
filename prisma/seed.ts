// prisma/seed.ts
import {
  PrismaClient,
  Prisma, // ИМПОРТИРУЕМ главный объект Prisma
  Category, // Модельные типы оставляем
  Tag, // Модельные типы оставляем
} from '@prisma/client';

const prisma = new PrismaClient();

// ---------- helpers ----------
async function upsertSize(value: string) {
  return prisma.size.upsert({
    where: { value },
    update: {},
    create: { value },
  });
}

async function upsertTag(name: string, color?: string, order = 0) {
  return prisma.tag.upsert({
    where: { name },
    update: { color, order },
    create: { name, color, order },
  });
}

async function upsertCategory(
  name: string,
  opts?: { parentId?: string; color?: string; order?: number },
) {
  const existing = await prisma.category.findFirst({
    where: {
      name: name,
      parentId: opts?.parentId ?? null,
    },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: {
        color: opts?.color,
        order: opts?.order ?? 0,
      },
    });
  } else {
    return prisma.category.create({
      data: {
        name,
        parentId: opts?.parentId,
        color: opts?.color,
        order: opts?.order ?? 0,
      },
    });
  }
}

async function upsertSupportAgent(data: {
  name: string;
  email: string;
  telegramId?: string | null;
  username: string;
  phone?: string | null;
  role: Prisma.AgentRole; // ИСПОЛЬЗУЕМ Prisma.AgentRole
}) {
  const agentData = {
    name: data.name,
    email: data.email,
    telegramId: data.telegramId,
    internalUsername: data.username,
    phone: data.phone,
    role: data.role,
  };

  return prisma.supportAgent.upsert({
    where: { email: data.email },
    update: agentData,
    create: agentData,
  });
}

type VariantInput = {
  color: string;
  price: number;
  oldPrice?: number | null;
  isFeatured?: boolean;
  images?: string[];
  stockBySize?: Record<string, number>;
};
type ProductInput = {
  sku?: string | null;
  name: string;
  alternativeNames?: string[];
  description?: string | null;
  status?: Prisma.Status; // ИСПОЛЬЗУЕМ Prisma.Status
  categoryNames?: string[];
  tagNames?: string[];
  attributes?: { key: string; value: string; isMain?: boolean }[];
  variants: VariantInput[];
};

async function createProductWithRelations(data: ProductInput) {
  const product = await prisma.product.create({
    data: {
      sku: data.sku ?? null,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? Prisma.Status.PUBLISHED, // ИСПОЛЬЗУЕМ Prisma.Status
    },
  });

  if (data.alternativeNames?.length) {
    await prisma.alternativeName.createMany({
      data: data.alternativeNames.map((value) => ({
        value,
        productId: product.id,
      })),
    });
  }
  if (data.attributes?.length) {
    await prisma.attribute.createMany({
      data: data.attributes.map((a) => ({
        productId: product.id,
        key: a.key,
        value: a.value,
        isMain: a.isMain ?? true,
      })),
    });
  }
  if (data.categoryNames?.length) {
    const cats = await prisma.category.findMany({
      where: { name: { in: data.categoryNames } },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        categories: { connect: cats.map((c: Category) => ({ id: c.id })) },
      },
    });
  }
  if (data.tagNames?.length) {
    const tags = await prisma.tag.findMany({
      where: { name: { in: data.tagNames } },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { tags: { connect: tags.map((t: Tag) => ({ id: t.id })) } },
    });
  }

  for (const v of data.variants) {
    const productVariant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        color: v.color,
        price: v.price,
        oldPrice: v.oldPrice ?? null,
        isFeatured: v.isFeatured ?? false,
      },
    });

    if (v.images?.length) {
      await prisma.image.createMany({
        data: v.images.map((url, i) => ({
          variantId: productVariant.id,
          url,
          order: i + 1,
        })),
      });
    }

    if (v.stockBySize) {
      const sizes = Object.keys(v.stockBySize);
      const dbSizes = await prisma.size.findMany({
        where: { value: { in: sizes } },
      });
      // ИСПРАВЛЕНИЕ: Добавляем явный тип для 's'
      const sizeMap = Object.fromEntries(
        dbSizes.map((s: { value: string; id: string }) => [s.value, s.id]),
      );

      const sizeData = sizes.map((s) => ({
        productVariantId: productVariant.id,
        sizeId: sizeMap[s],
        stock: v.stockBySize![s],
      }));

      await prisma.productSize.createMany({ data: sizeData });
    }
  }
  return product;
}

async function main() {
  console.log('🧹 Очистка старых данных...');
  await prisma.presetItem.deleteMany();
  await prisma.filterPreset.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.image.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.alternativeName.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.size.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.supportRoute.deleteMany();
  await prisma.supportAgent.deleteMany();

  console.log('👑 Создание "белого списка" агентов поддержки...');
  // ... (здесь ваш код для создания агентов)

  console.log('🌱 СИДИНГ УСПЕШНО ЗАВЕРШЕН');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка во время сидинга:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
