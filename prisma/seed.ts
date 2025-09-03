// prisma/seed.ts
import {
  PrismaClient,
  PresetItemType,
  Status,
  AgentRole,
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
  role: AgentRole;
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

// --- НАЧАЛО ИЗМЕНЕНИЙ: ОБНОВЛЕНИЕ ТИПОВ И ЛОГИКИ СОЗДАНИЯ ПРОДУКТА ---
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
  status?: Status;
  categoryNames?: string[];
  tagNames?: string[];
  attributes?: { key: string; value: string; isMain?: boolean }[];
  variants: VariantInput[];
};

async function createProductWithRelations(data: ProductInput) {
  // Создание продукта (без изменений)
  const product = await prisma.product.create({
    data: {
      sku: data.sku ?? null,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? Status.PUBLISHED,
    },
  });

  // Логика для alternativeNames, attributes, categories, tags (без изменений)
  if (data.alternativeNames?.length) {
    /* ... */
  }
  if (data.attributes?.length) {
    /* ... */
  }
  if (data.categoryNames?.length) {
    /* ... */
  }
  if (data.tagNames?.length) {
    /* ... */
  }

  // Переписываем логику создания вариантов и размеров
  for (const v of data.variants) {
    // 1. Создаем ProductVariant вместо Variant
    const productVariant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        color: v.color,
        price: v.price,
        oldPrice: v.oldPrice ?? null,
        isFeatured: v.isFeatured ?? false,
      },
    });

    // 2. Логика для Image теперь ссылается на productVariant.id
    if (v.images?.length) {
      await prisma.image.createMany({
        data: v.images.map((url, i) => ({
          variantId: productVariant.id, // ИЗМЕНЕНО
          url,
          order: i + 1,
        })),
      });
    }

    // 3. Создаем ProductSize вместо Inventory
    if (v.stockBySize) {
      const sizes = Object.keys(v.stockBySize);
      const dbSizes = await prisma.size.findMany({
        where: { value: { in: sizes } },
      });
      const sizeMap = Object.fromEntries(dbSizes.map((s) => [s.value, s.id]));

      const sizeData = sizes.map((s) => ({
        productVariantId: productVariant.id, // ИЗМЕНЕНО
        sizeId: sizeMap[s],
        stock: v.stockBySize![s],
      }));

      // Используем prisma.productSize.createMany
      await prisma.productSize.createMany({ data: sizeData }); // ИЗМЕНЕНО
    }
  }
  return product;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

async function main() {
  console.log('🧹 Очистка старых данных...');
  // --- НАЧАЛО ИЗМЕНЕНИЙ: ОБНОВЛЕНИЕ БЛОКА ОЧИСТКИ ---
  await prisma.presetItem.deleteMany();
  await prisma.filterPreset.deleteMany();
  await prisma.productSize.deleteMany(); // ИЗМЕНЕНО
  await prisma.image.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.alternativeName.deleteMany();
  await prisma.productVariant.deleteMany(); // ИЗМЕНЕНО
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.size.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.supportRoute.deleteMany();
  await prisma.supportAgent.deleteMany();
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  console.log('👑 Создание "белого списка" агентов поддержки...');
  // ... (здесь ваш код для создания агентов)

  // Добавьте здесь вызовы createProductWithRelations с вашими тестовыми данными, если нужно

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
