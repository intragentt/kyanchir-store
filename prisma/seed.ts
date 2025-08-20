// Местоположение: prisma/seed.ts
// Метафора: "Сеялка" или "Скрипт первоначального наполнения".
// Этот скрипт — это как команда садовников, которая сначала полностью
// очищает поле, а затем высаживает семена в строгом порядке, чтобы
// получить готовый, работающий "сад" (базу данных с товарами).

import { PrismaClient, Status } from '@prisma/client';

// Инициализируем нашего "помощника" для работы с базой данных.
const prisma = new PrismaClient();

// `main` — это наша основная "рабочая" функция.
async function main() {
  console.log('Начинаем очистку и полное заполнение базы данных...');

  // --- ШАГ 1: ПОЛНАЯ ОЧИСТКА В ПРАВИЛЬНОМ ПОРЯДКЕ ---
  // Это критически важный шаг. Мы должны удалять данные в порядке,
  // обратном их зависимостям. Сначала "внуков" (Inventory), потом "детей"
  // (Variant), и только потом "родителей" (Product).
  // Если нарушить порядок, база данных выдаст ошибку.
  await prisma.inventory.deleteMany({});
  await prisma.size.deleteMany({});
  await prisma.image.deleteMany({});
  await prisma.attribute.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  console.log('Старые данные полностью удалены.');

  // --- ШАГ 2: СОЗДАНИЕ СПРАВОЧНИКОВ (ФУНДАМЕНТ) ---
  const defaultCategory = await prisma.category.create({
    data: { name: 'Базовая коллекция' },
  });
  console.log('Создана категория "Базовая коллекция"');

  // --- ШАГ 3: СОЗДАНИЕ "ПАСПОРТА ТОВАРА" (PRODUCT) ---
  // Здесь мы используем "вложенную запись" Prisma: одновременно с созданием
  // продукта мы подключаем его к уже созданной категории (`connect`)
  // и создаем для него новые связанные атрибуты (`create`).
  const product = await prisma.product.create({
    data: {
      name: 'Комплект двойка',
      description: 'Очень мягкий и удобный комплект на каждый день.',
      status: Status.PUBLISHED,
      categories: { connect: { id: defaultCategory.id } },
      attributes: {
        create: [
          { key: 'Состав, %', value: 'Хлопок — 92%\nЭластан — 8%' },
          { key: 'Описание', value: 'Идеальный комплект для сна и отдыха.' },
          { key: 'Артикул', value: 'KYANCHIR/SET/001' },
        ],
      },
    },
  });
  console.log(`Создан продукт "${product.name}"`);

  // --- ШАГ 4: СОЗДАНИЕ "ТОВАРА НА ВЕШАЛКЕ" (VARIANT) ---
  const variant = await prisma.variant.create({
    data: {
      product: { connect: { id: product.id } }, // Привязываем к нашему продукту
      color: 'Белый',
      price: 12444,
      oldPrice: 15000,
      images: {
        create: [
          // Одновременно создаем и привязываем 4 изображения
          { url: '/Фото - 1.png', order: 1 },
          { url: '/Фото - 2.png', order: 2 },
          { url: '/Фото - 3.png', order: 3 },
          { url: '/Фото - 4.png', order: 4 },
        ],
      },
    },
  });
  console.log(`Создан вариант "${variant.color}" с 4 изображениями`);

  // --- ШАГ 5: СОЗДАНИЕ РАЗМЕРОВ (ИДЕАЛЬНЫЙ СПОСОБ) ---
  // Мы используем `upsert` (update or insert) — это очень умная и надежная команда.
  // Она пытается НАЙТИ запись (`where`). Если находит, то ОБНОВЛЯЕТ (`update`).
  // Если не находит, то СОЗДАЕТ (`create`).
  // Это делает скрипт идемпотентным — его можно запускать много раз, и он
  // не создаст дубликаты размеров, а будет использовать уже существующие.
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

  // --- ШАГ 6: СОЗДАНИЕ "БИРОК С ОСТАТКАМИ" (INVENTORY) ---
  // Используем `createMany` для эффективного создания сразу нескольких записей
  // об остатках для нашего варианта в разных размерах.
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

// --- ЗАПУСК И ОБРАБОТКА ОШИБОК ---
// Эта конструкция запускает нашу `main` функцию и гарантирует,
// что в случае любой ошибки мы увидим ее в консоли (`catch`)
// и в любом случае закроем соединение с базой данных (`finally`).
main()
  .catch((e) => {
    console.error('Произошла ошибка во время заполнения базы:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
