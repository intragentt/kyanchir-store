// prisma/seed.ts
import { PrismaClient, PresetItemType, Status } from '@prisma/client';

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
  return prisma.category.upsert({
    where: { name },
    update: {
      parentId: opts?.parentId ?? null,
      color: opts?.color,
      order: opts?.order ?? 0,
    },
    create: {
      name,
      parentId: opts?.parentId,
      color: opts?.color,
      order: opts?.order ?? 0,
    },
  });
}

type VariantInput = {
  color: string;
  price: number;
  oldPrice?: number | null;
  isFeatured?: boolean;
  images?: string[];
  stockBySize?: Record<string, number>; // { S: 5, M: 10, ... }
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
  // Product
  const product = await prisma.product.create({
    data: {
      sku: data.sku ?? null,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? Status.PUBLISHED,
    },
  });

  // Alternative names
  if (data.alternativeNames?.length) {
    await prisma.alternativeName.createMany({
      data: data.alternativeNames.map((value) => ({
        value,
        productId: product.id,
      })),
    });
  }

  // Attributes
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

  // Categories
  if (data.categoryNames?.length) {
    const cats = await prisma.category.findMany({
      where: { name: { in: data.categoryNames } },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { categories: { connect: cats.map((c) => ({ id: c.id })) } },
    });
  }

  // Tags
  if (data.tagNames?.length) {
    const tags = await prisma.tag.findMany({
      where: { name: { in: data.tagNames } },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { tags: { connect: tags.map((t) => ({ id: t.id })) } },
    });
  }

  // Variants, Images, Inventory
  for (const v of data.variants) {
    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        color: v.color, // у тебя @@unique([productId,color]) — цвета не должны повторяться внутри продукта
        price: v.price,
        oldPrice: v.oldPrice ?? null,
        isFeatured: v.isFeatured ?? false,
      },
    });

    if (v.images?.length) {
      await prisma.image.createMany({
        data: v.images.map((url, i) => ({
          variantId: variant.id,
          url,
          order: i + 1,
        })),
      });
    }

    if (v.stockBySize) {
      // найдём id размеров
      const sizes = Object.keys(v.stockBySize);
      const dbSizes = await prisma.size.findMany({
        where: { value: { in: sizes } },
      });
      const sizeMap = Object.fromEntries(dbSizes.map((s) => [s.value, s.id]));
      const inv = sizes.map((s) => ({
        variantId: variant.id,
        sizeId: sizeMap[s],
        stock: v.stockBySize![s],
      }));
      await prisma.inventory.createMany({ data: inv });
    }
  }

  return product;
}

// ---------- main ----------
async function main() {
  console.log('🧹 Reset (deleteMany) in dependency-safe order...');
  // сначала зависимые
  await prisma.inventory.deleteMany();
  await prisma.image.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.alternativeName.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.presetItem.deleteMany();
  await prisma.filterPreset.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  // размеры оставим, но можно и чистить:
  await prisma.size.deleteMany();

  console.log('📚 Seed: reference data (sizes, categories, tags)...');
  // Sizes
  const [S, M, L, XL] = await Promise.all([
    upsertSize('S'),
    upsertSize('M'),
    upsertSize('L'),
    upsertSize('XL'),
  ]);

  // Categories (дерево)
  const base = await upsertCategory('Базовая коллекция');
  const sets = await upsertCategory('Комплекты', {
    parentId: base.id,
    order: 1,
  });
  const bras = await upsertCategory('Бюстгальтеры', {
    parentId: base.id,
    order: 2,
  });
  const panties = await upsertCategory('Трусики', {
    parentId: base.id,
    order: 3,
  });
  const cozy = await upsertCategory('Домашняя одежда', {
    parentId: base.id,
    order: 4,
  });

  // Tags
  const [newTag, topTag, saleTag] = await Promise.all([
    upsertTag('Новинка', '#65D6AD', 1),
    upsertTag('Хит', '#A78BFA', 2),
    upsertTag('Скидка', '#F87171', 3),
  ]);

  console.log('🧩 Seed: products, variants, images, stock...');

  // Product 1
  const p1 = await createProductWithRelations({
    sku: 'KY-SET-001',
    name: 'Комплект двойка «Cloud Comfort»',
    alternativeNames: ['Cloud Set', 'Cloud Comfort Set'],
    description:
      'Очень мягкий и удобный комплект на каждый день. Дышащая ткань, комфортная посадка.',
    status: Status.PUBLISHED,
    categoryNames: [sets.name, base.name],
    tagNames: [newTag.name, topTag.name],
    attributes: [
      { key: 'Состав, %', value: 'Хлопок — 92%\nЭластан — 8%' },
      { key: 'Уход', value: 'Деликатная стирка при 30°C, без отбеливания' },
      { key: 'Артикул', value: 'KY-SET-001' },
    ],
    variants: [
      {
        color: 'Белый',
        price: 12444,
        oldPrice: 15000,
        isFeatured: true,
        images: [
          '/Фото - 1.png',
          '/Фото - 2.png',
          '/Фото - 3.png',
          '/Фото - 4.png',
        ],
        stockBySize: { S: 3, M: 20, L: 15, XL: 0 },
      },
      {
        color: 'Чёрный',
        price: 12990,
        oldPrice: 14990,
        images: ['/placeholder.png', '/placeholder.png'],
        stockBySize: { S: 5, M: 10, L: 8, XL: 2 },
      },
    ],
  });

  // Product 2
  const p2 = await createProductWithRelations({
    sku: 'KY-BRA-002',
    name: 'Бра без косточек «Air Light»',
    alternativeNames: ['Air Light Bra'],
    description: 'Лёгкая поддержка и невидимая посадка под одеждой.',
    status: Status.PUBLISHED,
    categoryNames: [bras.name, base.name],
    tagNames: [newTag.name, saleTag.name],
    attributes: [
      { key: 'Состав, %', value: 'Полиамид — 85%\nЭластан — 15%' },
      { key: 'Особенности', value: 'Без косточек, мягкие чашечки' },
      { key: 'Артикул', value: 'KY-BRA-002' },
    ],
    variants: [
      {
        color: 'Лавандовый',
        price: 9990,
        oldPrice: 11990,
        isFeatured: false,
        images: ['/placeholder.png'],
        stockBySize: { S: 6, M: 12, L: 9, XL: 4 },
      },
      {
        color: 'Капучино',
        price: 9990,
        images: ['/placeholder.png'],
        stockBySize: { S: 4, M: 8, L: 6, XL: 2 },
      },
    ],
  });

  console.log(`✅ Done. Products: ${p1.name}, ${p2.name}`);

  console.log('🎛 Seed: Filter Preset');
  const preset = await prisma.filterPreset.create({
    data: { name: 'Главная витрина', isDefault: true },
  });

  // Добавим элементы пресета (категории и теги).
  // Внимание к уникальным ограничениям: у нас либо categoryId, либо tagId.
  await prisma.presetItem.createMany({
    data: [
      {
        presetId: preset.id,
        type: PresetItemType.CATEGORY,
        categoryId: sets.id,
        order: 1,
      },
      {
        presetId: preset.id,
        type: PresetItemType.CATEGORY,
        categoryId: bras.id,
        order: 2,
      },
      {
        presetId: preset.id,
        type: PresetItemType.CATEGORY,
        categoryId: panties.id,
        order: 3,
      },
      {
        presetId: preset.id,
        type: PresetItemType.TAG,
        tagId: topTag.id,
        order: 4,
      },
      {
        presetId: preset.id,
        type: PresetItemType.TAG,
        tagId: saleTag.id,
        order: 5,
      },
    ],
    skipDuplicates: true, // на случай повторного запуска
  });

  console.log('🌱 SEED COMPLETE');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
