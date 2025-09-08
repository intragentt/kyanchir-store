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
      throw new Error(`Ошибка API МойСклад: ${response.status}`);
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error('Ошибка при выполнении запроса к МойСклад:', error);
    throw error;
  }
};
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

// --- НАЧАЛО ИЗМЕНЕНИЙ: "Умное" обновление остатков через Оприходование/Списание ---
export const updateMoySkladVariantStock = async (
  moySkladHref: string,
  moySkladType: string,
  newStock: number,
  oldStock: number, // Принимаем старый остаток
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

  // Если остаток увеличился -> создаем "Оприходование"
  if (delta > 0) {
    endpoint = 'entity/enter';
    console.log(`[API МойСклад] Создание Оприходования на ${quantity} шт.`);
  }
  // Если остаток уменьшился -> создаем "Списание"
  else {
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
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
