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

// --- НАЧАЛО ФИНАЛЬНОГО ИСПРАВЛЕНИЯ ---

let cachedColorCharacteristicMeta: any | null = null;

const getMoySkladColorCharacteristicMeta = async () => {
  if (cachedColorCharacteristicMeta) {
    return cachedColorCharacteristicMeta;
  }
  console.log('[API МойСклад] Получение meta-данных характеристики "Цвет"...');
  const response = await moySkladFetch('entity/characteristic');
  const colorChar = response.rows.find((char: any) => char.name === 'Цвет');

  if (!colorChar) {
    throw new Error('Характеристика "Цвет" не найдена в МойСклад.');
  }
  cachedColorCharacteristicMeta = colorChar.meta;
  return cachedColorCharacteristicMeta;
};

export const createMoySkladVariant = async (
  productMoySkladId: string,
  variantColorValue: string,
  variantArticle: string,
) => {
  console.log(
    `[API МойСклад] Создание модификации со значением "${variantColorValue}" для товара ${productMoySkladId}...`,
  );

  const colorCharacteristicMeta = await getMoySkladColorCharacteristicMeta();

  const body = {
    article: variantArticle,
    product: {
      meta: {
        href: `${MOYSKLAD_API_URL}/entity/product/${productMoySkladId}`,
        type: 'product',
        mediaType: 'application/json',
      },
    },
    // ИСПРАВЛЕННАЯ СТРУКТУРА: Добавлен ключ "characteristic"
    characteristics: [
      {
        characteristic: {
          meta: colorCharacteristicMeta,
        },
        value: variantColorValue,
      },
    ],
  };

  return await moySkladFetch('entity/variant', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};
// --- КОНЕЦ ФИНАЛЬНОГО ИСПРАВЛЕНИЯ ---

export const getMoySkladProducts = async () => {
  return await moySkladFetch('entity/assortment?expand=productFolder,images');
};

export const getMoySkladCategories = async () => {
  return await moySkladFetch('entity/productfolder?expand=productFolder');
};

export const getMoySkladStock = async () => {
  const data = await moySkladFetch('report/stock/all?stockMode=all');
  return data;
};

// ... (весь остальной код файла без изменений) ...

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

let cachedPriceTypes: { salePrice: any; discountPrice: any } | null = null;
const getMoySkladPriceTypes = async () => {
  if (cachedPriceTypes) return cachedPriceTypes;
  const response = await moySkladFetch('context/companysettings/pricetype');
  const salePrice = response.find((pt: any) => pt.name === 'Цена продажи');
  const discountPrice = response.find((pt: any) => pt.name === 'Скидка');
  if (!salePrice) throw new Error('Тип цены "Цена продажи" не найден.');
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
  if (oldPrice && oldPrice > 0)
    salePrices.push({ value: oldPrice * 100, priceType: { meta: salePrice } });
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
    if (existingSalePriceIndex !== -1)
      salePrices.splice(existingSalePriceIndex, 1);
    salePrices.push({
      value: currentPrice * 100,
      priceType: { meta: salePrice },
    });
  }
  const body = { salePrices };
  const endpoint = moySkladHref.replace(`${MOYSKLAD_API_URL}/`, '');
  return await moySkladFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};
