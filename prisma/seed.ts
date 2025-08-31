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

async function upsertSupportAgent(data: {
  name: string;
  email: string;
  telegramId?: string | null;
  username: string;
  phone?: string | null;
  role: AgentRole;
}) {
  const existingAgent = await prisma.supportAgent.findUnique({
    where: { email: data.email },
  });
  const agentData = {
    name: data.name,
    email: data.email,
    telegramId: data.telegramId,
    internalUsername: data.username,
    phone: data.phone,
    role: data.role,
  };
  Object.keys(agentData).forEach(
    (key) =>
      agentData[key as keyof typeof agentData] === undefined &&
      delete agentData[key as keyof typeof agentData],
  );
  if (existingAgent) {
    return prisma.supportAgent.update({
      where: { email: data.email },
      data: agentData,
    });
  } else {
    // @ts-ignore
    return prisma.supportAgent.create({ data: agentData });
  }
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
  status?: Status;
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
      status: data.status ?? Status.PUBLISHED,
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
      data: { categories: { connect: cats.map((c) => ({ id: c.id })) } },
    });
  }
  if (data.tagNames?.length) {
    const tags = await prisma.tag.findMany({
      where: { name: { in: data.tagNames } },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { tags: { connect: tags.map((t) => ({ id: t.id })) } },
    });
  }
  for (const v of data.variants) {
    const variant = await prisma.variant.create({
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
          variantId: variant.id,
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
  console.log('🧹 Очистка старых данных...');
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.supportRoute.deleteMany();
  await prisma.supportAgent.deleteMany();
  await prisma.presetItem.deleteMany();
  await prisma.filterPreset.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.image.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.alternativeName.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.size.deleteMany();

  console.log('👑 Создание "белого списка" агентов поддержки...');
  await upsertSupportAgent({
    name: 'Shura Kargashin',
    email: 'shura.kargashin@example.com',
    telegramId: '6028909187',
    username: 'shura_kargashin',
    phone: '+77711745182',
    role: AgentRole.ADMIN,
  });
  await upsertSupportAgent({
    name: 'Intragentt',
    email: 'intragentt@example.com',
    username: 'intragentt',
    phone: '+77711078754',
    role: AgentRole.ADMIN,
  });
  await upsertSupportAgent({
    name: 'VokinivodoP',
    email: 'vokinivodop@example.com',
    username: 'vokinivodoP',
    phone: null,
    role: AgentRole.MANAGEMENT,
  });
  await upsertSupportAgent({
    name: 'Yana',
    email: 'yana.manager@example.com',
    username: 'yana_manager_tg',
    role: AgentRole.MANAGEMENT,
    telegramId: null,
    phone: null,
  });
  await upsertSupportAgent({
    name: 'Artem',
    email: 'artem.manager@example.com',
    username: 'artem_manager_tg',
    role: AgentRole.MANAGEMENT,
    telegramId: null,
    phone: null,
  });
  await upsertSupportAgent({
    name: 'Anna Support',
    email: 'anna.support@example.com',
    username: 'kyanchir_support_anna',
    role: AgentRole.SUPPORT,
    telegramId: null,
    phone: null,
  });

  console.log('📧 Создание маршрутов для всех корпоративных почт...');
  const emailsToSeed = [
    'uw@kyanchir.ru',
    'support@kyanchir.ru',
    'manager@kyanchir.ru',
    'admin@kyanchir.ru',
    'yana@kyanchir.ru',
    'artem@kyanchir.ru',
    'intragentt@kyanchir.ru',
    'promo@kyanchir.ru',
    'hello@kyanchir.ru',
  ];

  await prisma.supportRoute.createMany({
    data: emailsToSeed.map((email) => ({ kyanchirEmail: email })),
    skipDuplicates: true,
  });

  console.log('📚 Создание справочников (размеры, категории, теги)...');
  const [S, M, L, XL] = await Promise.all([
    upsertSize('S'),
    upsertSize('M'),
    upsertSize('L'),
    upsertSize('XL'),
  ]);
  const base = await upsertCategory('Базовая коллекция', { order: 1 });
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
  const body = await upsertCategory('Боди', { parentId: base.id, order: 4 });
  const home = await upsertCategory('Домашняя одежда', { order: 2 });
  const [newTag, topTag, saleTag, seamlessTag] = await Promise.all([
    upsertTag('Новинка', '#65D6AD', 1),
    upsertTag('Хит', '#A78BFA', 2),
    upsertTag('Скидка', '#F87171', 3),
    upsertTag('Бесшовное', '#9CA3AF', 4),
  ]);
  console.log('🍓 Создание реалистичных товаров...');
  await createProductWithRelations({
    sku: 'KY-SET-001',
    name: 'Комплект «Cloud Comfort»',
    description:
      'Очень мягкий и удобный комплект на каждый день. Дышащая ткань, комфортная посадка.',
    categoryNames: [sets.name, base.name],
    tagNames: [newTag.name, topTag.name],
    attributes: [
      { key: 'Состав', value: 'Хлопок 92%, Эластан 8%' },
      { key: 'Уход', value: 'Деликатная стирка при 30°C' },
    ],
    variants: [
      {
        color: 'Белый',
        price: 12444,
        oldPrice: 15000,
        isFeatured: true,
        images: ['/Фото - 1.png', '/Фото - 2.png', '/Фото - 3.png'],
        stockBySize: { S: 3, M: 20, L: 15, XL: 0 },
      },
      {
        color: 'Чёрный',
        price: 12990,
        oldPrice: 14990,
        images: ['/placeholder.png', '/placeholder.png', '/Фото - 4.png'],
        stockBySize: { S: 5, M: 10, L: 8, XL: 2 },
      },
    ],
  });
  await createProductWithRelations({
    sku: 'KY-BRA-015',
    name: 'Бра «Шелковый рассвет»',
    description:
      'Невероятно нежный бра из натурального шелка для особого случая.',
    categoryNames: [bras.name],
    tagNames: [newTag.name, seamlessTag.name],
    attributes: [{ key: 'Материал', value: '100% Шелк' }],
    variants: [
      {
        color: 'Пудровый',
        price: 18990,
        oldPrice: 21000,
        images: ['/Фото - 3.png', '/Фото - 1.png'],
        stockBySize: { S: 10, M: 10, L: 5 },
      },
      {
        color: 'Шампань',
        price: 18990,
        images: ['/Фото - 2.png', '/placeholder.png'],
        stockBySize: { S: 8, M: 12, L: 7 },
      },
    ],
  });
  await createProductWithRelations({
    sku: 'KY-PNT-008',
    name: 'Трусики-слипы «Second Skin»',
    description:
      'Бесшовные трусики, которые абсолютно не ощущаются на теле. Идеальны под облегающую одежду.',
    categoryNames: [panties.name, base.name],
    tagNames: [topTag.name, seamlessTag.name],
    attributes: [{ key: 'Состав', value: 'Микрофибра 80%, Эластан 20%' }],
    variants: [
      {
        color: 'Телесный',
        price: 4990,
        images: ['/placeholder.png', '/Фото - 4.png'],
        stockBySize: { S: 30, M: 50, L: 40 },
      },
      {
        color: 'Мокко',
        price: 4990,
        images: ['/placeholder.png', '/Фото - 1.png'],
        stockBySize: { S: 25, M: 45, L: 35 },
      },
      {
        color: 'Черный',
        price: 4990,
        images: ['/Фото - 2.png', '/placeholder.png'],
        stockBySize: { S: 40, M: 60, L: 50 },
      },
    ],
  });
  await createProductWithRelations({
    sku: 'KY-BODY-003',
    name: 'Боди «Полуночный бархат»',
    description:
      'Элегантное боди с кружевными вставками. Создано, чтобы восхищать.',
    categoryNames: [body.name],
    tagNames: [saleTag.name],
    attributes: [{ key: 'Особенность', value: 'Кружевные вставки' }],
    variants: [
      {
        color: 'Изумрудный',
        price: 22500,
        oldPrice: 28000,
        images: ['/Фото - 3.png', '/placeholder.png', '/Фото - 1.png'],
        stockBySize: { S: 5, M: 8, L: 4 },
      },
      {
        color: 'Бордовый',
        price: 22500,
        oldPrice: 28000,
        images: ['/Фото - 4.png', '/placeholder.png'],
        stockBySize: { S: 6, M: 7, L: 5 },
      },
    ],
  });
  console.log('🎛 Создание пресета для фильтра на главной...');
  const preset = await prisma.filterPreset.create({
    data: { name: 'Главная витрина', isDefault: true },
  });
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
        categoryId: body.id,
        order: 2,
      },
      {
        presetId: preset.id,
        type: PresetItemType.TAG,
        tagId: newTag.id,
        order: 3,
      },
      {
        presetId: preset.id,
        type: PresetItemType.TAG,
        tagId: seamlessTag.id,
        order: 4,
      },
      {
        presetId: preset.id,
        type: PresetItemType.TAG,
        tagId: saleTag.id,
        order: 5,
      },
    ],
    skipDuplicates: true,
  });
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
