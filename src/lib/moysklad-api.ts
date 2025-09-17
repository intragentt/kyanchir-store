// /src/lib/moysklad-api.ts

import prisma from '@/lib/prisma'; // <-- 1. Импортируем Prisma

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2';

// --- НАЧАЛО НОВОЙ АРХИТЕКТУРЫ "ГИБРИДНОГО КЛЮЧА" ---

// Кэш для хранения ключа в памяти, чтобы не делать запрос к БД каждый раз
let apiKeyCache: string | null = null;

/**
 * Получает API-ключ МойСклад.
 * Приоритет: Кэш -> База Данных -> .env файл.
 */
const getMoySkladApiKey = async () => {
  if (apiKeyCache) {
    return apiKeyCache;
  }

  console.log('[API-Bridge] Ключ не в кэше, ищем в БД...');
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'MOYSKLAD_API_KEY' },
  });

  // Если ключ есть в БД, используем его. Иначе - запасной из .env
  const key = setting?.value || process.env.MOYSKLAD_API_TOKEN;

  if (key) {
    apiKeyCache = key; // Сохраняем в кэш для следующих запросов
  }

  return key;
};

/**
 * Очищает кэш API-ключа. Вызывается после обновления ключа в админке.
 */
export const clearApiKeyCache = () => {
  apiKeyCache = null;
  console.log('[API-Bridge] Кэш API-ключа очищен.');
};

// --- КОНЕЦ НОВОЙ АРХИТЕКТУРЫ ---

const moySkladFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Получаем ключ динамически при каждом запросе
  const apiKey = await getMoySkladApiKey();

  if (!apiKey) {
    throw new Error(
      'API-ключ для МойСклад не найден ни в базе данных, ни в переменных окружения.',
    );
  }

  const url = `${MOYSKLAD_API_URL}/${endpoint}`;
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${apiKey}`);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept-Encoding', 'gzip');
  const config: RequestInit = { ...options, headers };
  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Ошибка API МойСклад [${response.status}]: ${errorBody}`);
      throw new Error(`Ошибка API МойСклад: ${response.status} - ${errorBody}`);
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error('Ошибка при выполнении запроса к МойСклад:', error);
    throw error;
  }
};

// ... (ВСЕ ОСТАЛЬНЫЕ ФУНКЦИИ ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ)

export const createMoySkladProduct = async (
  name: string,
  article: string,
  categoryMoySkladId: string,
) => {
  console.log(`[API МойСклад] Создание товара "${name}"...`);
  const body = {
    name,
    article,
    productFolder: {
      meta: {
        href: `${MOYSKLAD_API_URL}/entity/productfolder/${categoryMoySkladId}`,
        type: 'productfolder',
        mediaType: 'application/json',
      },
    },
  };
  return await moySkladFetch('entity/product', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const getMoySkladProducts = async () => {
  return await moySkladFetch(
    'entity/assortment?expand=productFolder,images,product',
  );
};
export const getMoySkladCategories = async () => {
  return await moySkladFetch('entity/productfolder?expand=productFolder');
};
export const getMoySkladStock = async () => {
  const data = await moySkladFetch('report/stock/all?stockMode=all');
  return data;
};

let cachedRefs: { organization: any; store: any } | null = null;
const getMoySkladDefaultRefs = async () => {
  if (cachedRefs) return cachedRefs;
  const [orgResponse, storeResponse] = await Promise.all([
    moySkladFetch('entity/organization'),
    moySkladFetch('entity/store'),
  ]);
  if (!orgResponse?.rows?.[0] || !storeResponse?.rows?.[0])
    throw new Error('Не удалось получить организацию или склад по умолчанию.');
  cachedRefs = {
    organization: orgResponse.rows[0].meta,
    store: storeResponse.rows[0].meta,
  };
  return cachedRefs;
};

export const updateMoySkladVariantStock = async (
  moySkladHref: string,
  moySkladType: string,
  newStock: number,
  oldStock: number,
) => {
  const delta = newStock - oldStock;
  if (delta === 0) return null;
  const { organization, store } = await getMoySkladDefaultRefs();
  const quantity = Math.abs(delta);
  const endpoint = delta > 0 ? 'entity/enter' : 'entity/loss';
  const body = {
    organization: { meta: organization },
    store: { meta: store },
    positions: [
      {
        quantity,
        assortment: { meta: { href: moySkladHref, type: moySkladType } },
      },
    ],
  };
  return await moySkladFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

let cachedPriceTypes: { salePriceMeta: any; discountPriceMeta: any } | null =
  null;
const getMoySkladPriceTypes = async () => {
  if (cachedPriceTypes) {
    return cachedPriceTypes;
  }
  console.log('[API МойСклад] Получение ID типов цен...');
  const response = await moySkladFetch('context/companysettings/pricetype');
  const salePrice = response.find((pt: any) => pt.name === 'Цена продажи');
  const discountPrice = response.find((pt: any) => pt.name === 'Скидка');
  if (!salePrice) {
    throw new Error('Тип цены "Цена продажи" не найден в МойСклад.');
  }
  cachedPriceTypes = {
    salePriceMeta: salePrice.meta,
    discountPriceMeta: discountPrice ? discountPrice.meta : null,
  };
  return cachedPriceTypes;
};

export const updateMoySkladPrice = async (
  moySkladProductId: string,
  price: number | null,
  oldPrice: number | null,
) => {
  const { salePriceMeta, discountPriceMeta } = await getMoySkladPriceTypes();
  const salePrices = [];
  const currentPrice = price || 0;
  if (oldPrice && oldPrice > currentPrice) {
    salePrices.push({ value: oldPrice, priceType: { meta: salePriceMeta } });
    if (discountPriceMeta) {
      salePrices.push({
        value: currentPrice,
        priceType: { meta: discountPriceMeta },
      });
    }
  } else {
    salePrices.push({
      value: currentPrice,
      priceType: { meta: salePriceMeta },
    });
  }
  const body = { salePrices };
  console.log(
    `[API МойСклад] Обновление цен для товара ${moySkladProductId}...`,
  );
  const endpoint = `entity/product/${moySkladProductId}`;
  return await moySkladFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

export const archiveMoySkladProducts = async (moySkladIds: string[]) => {
  console.log(`[API МойСклад] Архивация ${moySkladIds.length} товаров...`);
  const body = { archived: true };
  const promises = moySkladIds.map((id) =>
    moySkladFetch(`entity/product/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  );
  return Promise.all(promises);
};

export const getMoySkladProductsAndVariants = async () => {
  console.log('[API МойСклад] Запрос списка всех товаров и вариантов...');
  const filter = 'type=product;type=variant';
  const expand = 'productFolder,images';
  return await moySkladFetch(
    `entity/assortment?filter=${filter}&expand=${expand}`,
  );
};

export const updateMoySkladArticle = async (
  moySkladId: string,
  newArticle: string,
  type: 'product' | 'variant',
) => {
  console.log(
    `[API МойСклад] Обновление артикула для ${type} ${moySkladId} на "${newArticle}"`,
  );
  const endpoint = `entity/${type}/${moySkladId}`;
  const body = { article: newArticle };
  return await moySkladFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

export const getMoySkladEntityByHref = async (href: string) => {
  const endpoint = href.replace(MOYSKLAD_API_URL + '/', '');
  return await moySkladFetch(endpoint);
};

let sizeCharacteristicCache: { meta: any; values: Map<string, any> } | null =
  null;
const getMoySkladSizeCharacteristicData = async (): Promise<{
  meta: any;
  values: Map<string, any>;
}> => {
  if (sizeCharacteristicCache) {
    return sizeCharacteristicCache;
  }
  console.log(
    '[API МойСклад] Получение метаданных для характеристики "Размер"...',
  );
  const response = await moySkladFetch('entity/variant/metadata');
  const sizeChar = response.characteristics.find(
    (char: any) => char.name === 'Размер',
  );
  if (!sizeChar) {
    throw new Error(
      'Характеристика "Размер" не найдена в метаданных МойСклад!',
    );
  }
  console.log(
    '[API МойСклад] Получение всех значений для характеристики "Размер"...',
  );
  const valuesResponse = await getMoySkladEntityByHref(sizeChar.meta.href);
  const valuesMap = new Map<string, any>(
    valuesResponse.rows.map((v: any) => [v.value, v]),
  );
  sizeCharacteristicCache = { meta: sizeChar.meta, values: valuesMap };
  return sizeCharacteristicCache;
};

export const createMoySkladVariant = async (
  parentProductId: string,
  article: string,
  sizeValue: string,
) => {
  console.log(
    `[API МойСклад] Создание модификации для товара ${parentProductId} с размером ${sizeValue}...`,
  );
  const { meta, values } = await getMoySkladSizeCharacteristicData();
  const sizeValueData = values.get(sizeValue);
  if (!sizeValueData) {
    throw new Error(
      `Значение размера "${sizeValue}" не найдено в МойСклад. Добавьте его в справочник.`,
    );
  }
  const body = {
    article,
    product: {
      meta: {
        href: `${MOYSKLAD_API_URL}/entity/product/${parentProductId}`,
        type: 'product',
        mediaType: 'application/json',
      },
    },
    characteristics: [
      {
        meta: meta,
        id: sizeValueData.id,
        name: sizeValueData.name,
        value: sizeValueData.value,
      },
    ],
  };
  return await moySkladFetch('entity/variant', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};
