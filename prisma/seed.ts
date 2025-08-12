// Местоположение: prisma/seed.ts
import { PrismaClient, Status } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаем очистку и полное заполнение базы данных...');

  // --- 1. Полная очистка в правильном порядке ---
  await prisma.inventory.deleteMany({});
  await prisma.size.deleteMany({});
  await prisma.image.deleteMany({});
  await prisma.attribute.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  console.log('Старые данные полностью удалены.');

  // --- 2. Создаем категорию ---
  const defaultCategory = await prisma.category.create({
    data: { name: 'Базовая коллекция' },
  });
  console.log('Создана категория "Базовая коллекция"');

  // --- 3. Создаем ПРОДУКТ ---
  const product = await prisma.product.create({
    data: {
      name: 'Комплект двойка',
      description: 'Очень мягкий и удобный комплект на каждый день.',
      status: Status.PUBLISHED,
      categories: { connect: { id: defaultCategory.id } },
      attributes: {
        create: [
          {
            key: 'Состав, %',
            value: 'Хлопок — 92%\nЭластан — 8%',
          },
          {
            key: 'Описание',
            value:
              'Идеальный комплект для комфортного сна и отдыха. Мягкая ткань приятно ощущается на теле и позволяет коже дышать.',
          },
          {
            key: 'Артикул',
            value: 'KYANCHIR/SET/001',
          },
        ],
      },
    },
  });
  console.log(`Создан продукт "${product.name}"`);

  // --- 5. Создаем ВАРИАНТ для этого продукта ---
  const variant = await prisma.variant.create({
    data: {
      product: { connect: { id: product.id } },
      color: 'Белый',
      price: 12444,
      oldPrice: 15000,
      // --- ИЗМЕНЕНИЕ: Добавляем еще 2 изображения ---
      images: {
        create: [
          { url: '/Фото - 1.png', order: 1 },
          { url: '/Фото - 2.png', order: 2 },
          { url: '/Фото - 3.png', order: 3 },
          { url: '/Фото - 4.png', order: 4 },
        ],
      },
    },
  });
  console.log(`Создан вариант "${variant.color}" с 4 изображениями`);

  // --- 7. Создаем РАЗМЕРЫ, если их нет ---
  const sSize = await prisma.size.upsert({
    where: { value: 'S' },
    update: {},
    create: { value: 'S' },
  });
  const mSize = await prisma.size.upsert({
    where: { value: 'M' },
    update: {},
    create: { value: 'M' },
  });
  const lSize = await prisma.size.upsert({
    where: { value: 'L' },
    update: {},
    create: { value: 'L' },
  });
  const xlSize = await prisma.size.upsert({
    where: { value: 'XL' },
    update: {},
    create: { value: 'XL' },
  });
  console.log('Созданы/проверены размеры S, M, L, XL');

  // --- 8. Создаем ОСТАТКИ для нашего варианта ---
  await prisma.inventory.createMany({
    data: [
      { variantId: variant.id, sizeId: sSize.id, stock: 3 },
      { variantId: variant.id, sizeId: mSize.id, stock: 20 },
      { variantId: variant.id, sizeId: lSize.id, stock: 15 },
      { variantId: variant.id, sizeId: xlSize.id, stock: 0 },
    ],
  });
  console.log('Созданы остатки для варианта');

  console.log('\n---');
  console.log('✅ Заполнение базы успешно завершено!');
  console.log(`>>> ID ПРОДУКТА для теста: ${product.id} <<<`);
  console.log('---');
}

main()
  .catch((e) => {
    console.error('Произошла ошибка во время заполнения базы:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
