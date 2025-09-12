// /src/lib/moysklad-api.ts

const MOYSKLAD_API_TOKEN = process.env.MOYSKLAD_API_TOKEN;
const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2';

if (!MOYSKLAD_API_TOKEN) {
  throw new Error('Переменная окружения MOYSKLAD_API_TOKEN не определена!');
}

const moySkladFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${MOYSKLAD_API_URL}/${endpoint}`;
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${MOYSKLAD_API_TOKEN}`);
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
  // ... (код без изменений)
};

export const archiveMoySkladProducts = async (moySkladIds: string[]) => {
  // ... (код без изменений)
};

// --- НАЧАЛО НОВОГО КОДА ---

/**
 * Получает из МойСклад список всех сущностей, являющихся товарами или модификациями.
 * Исключает услуги, комплекты и прочее.
 * @returns {Promise<any>} - Ответ API со списком товаров и вариантов.
 */
export const getMoySkladProductsAndVariants = async () => {
  console.log('[API МойСклад] Запрос списка всех товаров и вариантов...');
  // Фильтруем по типу: 'product' (товар) и 'variant' (модификация)
  const filter = 'type=product;type=variant';
  // Расширяем поля, чтобы получить максимум полезной информации
  const expand = 'productFolder,images';
  return await moySkladFetch(
    `entity/assortment?filter=${filter}&expand=${expand}`,
  );
};

// --- КОНЕЦ НОВОГО КОДА ---
