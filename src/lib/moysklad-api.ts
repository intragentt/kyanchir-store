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

// --- НОВАЯ ФУНКЦИЯ: Создание продукта в МойСклад ---
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
// --- КОНЕЦ НОВОЙ ФУНКЦИИ ---

export const getMoySkladProducts = async () => {
  const data = await moySkladFetch(
    'entity/assortment?expand=productFolder,images',
  );
  return data;
};
export const getMoySkladCategories = async () => {
  const data = await moySkladFetch('entity/productfolder?expand=productFolder');
  return data;
};
export const getMoySkladStock = async () => {
  const data = await moySkladFetch('report/stock/all?stockMode=all');
  return data;
};
let cachedRefs: { organization: any; store: any } | null = null;
const getMoySkladDefaultRefs = async () => {
  if (cachedRefs) {
    return cachedRefs;
  }
  console.log('[API МойСклад] Получение организации и склада по умолчанию...');
  const [orgResponse, storeResponse] = await Promise.all([
    moySkladFetch('entity/organization'),
    moySkladFetch('entity/store'),
  ]);
  if (!orgResponse?.rows?.[0] || !storeResponse?.rows?.[0]) {
    throw new Error(
      'Не удалось получить организацию или склад по умолчанию из МойСклад.',
    );
  }
  const refs = {
    organization: orgResponse.rows[0].meta,
    store: storeResponse.rows[0].meta,
  };
  cachedRefs = refs;
  return refs;
};
export const updateMoySkladVariantStock = async (
  moySkladHref: string,
  moySkladType: string,
  newStock: number,
  oldStock: number,
) => {
  const delta = newStock - oldStock;
  if (delta === 0) {
    console.log('[API МойСклад] Остаток не изменился, операция пропущена.');
    return null;
  }
  const { organization, store } = await getMoySkladDefaultRefs();
  const quantity = Math.abs(delta);
  let endpoint = '';
  const position = {
    quantity: quantity,
    assortment: { meta: { href: moySkladHref, type: moySkladType } },
  };
  if (delta > 0) {
    endpoint = 'entity/enter';
    console.log(`[API МойСклад] Создание Оприходования на ${quantity} шт.`);
  } else {
    endpoint = 'entity/loss';
    console.log(`[API МойСклад] Создание Списания на ${quantity} шт.`);
  }
  const body = {
    organization: { meta: organization },
    store: { meta: store },
    positions: [position],
  };
  return await moySkladFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};
let cachedPriceTypes: { salePrice: any; discountPrice: any } | null = null;
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
    salePrice: salePrice.meta,
    discountPrice: discountPrice ? discountPrice.meta : null,
  };
  return cachedPriceTypes;
};
export const updateMoySkladPrice = async (
  moySkladHref: string,
  price: number | null,
  oldPrice: number | null,
) => {
  const { salePrice, discountPrice } = await getMoySkladPriceTypes();
  const salePrices = [];
  if (oldPrice && oldPrice > 0) {
    salePrices.push({
      value: oldPrice * 100,
      priceType: { meta: salePrice },
    });
  }
  const currentPrice = price || 0;
  if (oldPrice && currentPrice < oldPrice && discountPrice) {
    salePrices.push({
      value: currentPrice * 100,
      priceType: { meta: discountPrice },
    });
  } else {
    const existingSalePriceIndex = salePrices.findIndex(
      (p) => p.priceType.meta.href === salePrice.href,
    );
    if (existingSalePriceIndex !== -1) {
      salePrices.splice(existingSalePriceIndex, 1);
    }
    salePrices.push({
      value: currentPrice * 100,
      priceType: { meta: salePrice },
    });
  }
  const body = { salePrices };
  console.log(`[API МойСклад] Обновление цен для ${moySkladHref}...`);
  const endpoint = moySkladHref.replace(`${MOYSKLAD_API_URL}/`, '');
  return await moySkladFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};
