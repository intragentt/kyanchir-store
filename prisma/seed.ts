// prisma/seed.ts
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- ШАГ 1: ОЧИСТКА ---
  console.log('🧹 Очистка старых данных...');
  // Удаляем в правильном порядке, чтобы избежать ошибок внешних ключей
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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Создаем ВСЕ необходимые статусы ---
  console.log('   - Создание статусов продуктов...');
  const statusDraft = await prisma.status.create({ data: { name: 'DRAFT' } });
  const statusPublished = await prisma.status.create({
    data: { name: 'PUBLISHED' },
  });
  const statusArchived = await prisma.status.create({
    data: { name: 'ARCHIVED' },
  });
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  // Роли Пользователей
  console.log('   - Создание ролей пользователей...');
  const roleAdmin = await prisma.userRole.create({ data: { name: 'ADMIN' } });
  const roleUser = await prisma.userRole.create({ data: { name: 'USER' } }); // Добавляем роль USER

  // Роли Агентов
  const agentRoleAdmin = await prisma.agentRole.create({
    data: { name: 'ADMIN' },
  });

  // Справочники для системы поддержки
  const ticketStatusOpen = await prisma.ticketStatus.create({
    data: { name: 'OPEN' },
  });
  const sourceWebForm = await prisma.ticketSource.create({
    data: { name: 'WEB_FORM' },
  });
  const senderTypeClient = await prisma.senderType.create({
    data: { name: 'CLIENT' },
  });

  // --- ШАГ 3: СОЗДАНИЕ ОСНОВНЫХ ДАННЫХ (Примеры) ---
  console.log('👑 Создание администратора...');

  await prisma.user.create({
    data: {
      email: 'intragentt@gmail.com',
      name: 'Admin',
      roleId: roleAdmin.id,
    },
  });

  console.log('👕 Создание тестового продукта...');

  const sizeS = await prisma.size.create({ data: { value: 'S' } });
  const sizeM = await prisma.size.create({ data: { value: 'M' } });

  const testProduct = await prisma.product.create({
    data: {
      name: 'Тестовый Корсет (Seed)',
      description:
        'Это описание для тестового продукта, созданного через seed.',
      statusId: statusPublished.id, // Тестовый продукт будет сразу опубликован
      sku: 'KYA-SEED-001',
    },
  });

  const testVariant = await prisma.productVariant.create({
    data: {
      productId: testProduct.id,
      color: 'Черный',
      price: 2500,
    },
  });

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
