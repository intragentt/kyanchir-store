// prisma/seed.ts
import { PrismaClient, Category, Tag } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- ШАГ 1: ОЧИСТКА ---
  // Сначала удаляем записи из таблиц, которые зависят от других...
  console.log('🧹 Очистка старых данных...');
  await prisma.presetItem.deleteMany();
  await prisma.filterPreset.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.image.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.alternativeName.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.supportAgent.deleteMany();
  await prisma.user.deleteMany();

  // ...затем удаляем записи из самих справочников.
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.size.deleteMany();
  await prisma.supportRoute.deleteMany();
  await prisma.status.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.agentRole.deleteMany();
  await prisma.ticketStatus.deleteMany();
  await prisma.ticketSource.deleteMany();
  await prisma.senderType.deleteMany();
  await prisma.presetItemType.deleteMany();

  // --- ШАГ 2: СОЗДАНИЕ ЗАПИСЕЙ В СПРАВОЧНИКАХ ---
  console.log('📚 Создание записей в справочниках...');

  // Статусы Продуктов
  const statusDraft = await prisma.status.create({ data: { name: 'DRAFT' } });
  const statusPublished = await prisma.status.create({
    data: { name: 'PUBLISHED' },
  });
  const statusArchived = await prisma.status.create({
    data: { name: 'ARCHIVED' },
  });

  // Роли Пользователей
  const roleClient = await prisma.userRole.create({ data: { name: 'CLIENT' } });
  const roleAdmin = await prisma.userRole.create({ data: { name: 'ADMIN' } });

  // Роли Агентов
  const agentRoleSupport = await prisma.agentRole.create({
    data: { name: 'SUPPORT' },
  });
  const agentRoleAdmin = await prisma.agentRole.create({
    data: { name: 'ADMIN' },
  });

  // Справочники для системы поддержки
  await prisma.ticketStatus.createMany({
    data: [{ name: 'OPEN' }, { name: 'CLOSED' }],
  });
  await prisma.ticketSource.createMany({
    data: [{ name: 'EMAIL' }, { name: 'WEB_FORM' }],
  });
  await prisma.senderType.createMany({
    data: [{ name: 'CLIENT' }, { name: 'AGENT' }],
  });

  // --- ШАГ 3: СОЗДАНИЕ ОСНОВНЫХ ДАННЫХ (Примеры) ---
  console.log('👑 Создание администратора...');

  // Создаем пользователя-админа, используя ID роли 'ADMIN'
  await prisma.user.create({
    data: {
      email: 'admin@kyanchir.ru',
      name: 'Admin',
      roleId: roleAdmin.id,
      // В реальном проекте здесь должен быть хеш пароля
    },
  });

  console.log('👕 Создание тестового продукта...');

  // Создаем размеры
  const sizeS = await prisma.size.create({ data: { value: 'S' } });
  const sizeM = await prisma.size.create({ data: { value: 'M' } });

  // Создаем продукт, используя ID статуса 'PUBLISHED'
  const testProduct = await prisma.product.create({
    data: {
      name: 'Тестовый Корсет',
      description: 'Это описание для тестового продукта.',
      statusId: statusPublished.id,
      sku: 'KYA-TEST-001',
    },
  });

  // Создаем вариант для этого продукта
  const testVariant = await prisma.productVariant.create({
    data: {
      productId: testProduct.id,
      color: 'Черный',
      price: 2500,
    },
  });

  // Создаем остатки для этого варианта
  await prisma.productSize.createMany({
    data: [
      { productVariantId: testVariant.id, sizeId: sizeS.id, stock: 10 },
      { productVariantId: testVariant.id, sizeId: sizeM.id, stock: 15 },
    ],
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
