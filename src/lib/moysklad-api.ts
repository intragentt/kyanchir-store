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
  const data = await moySkladFetch('entity/assortment?expand=productFolder');
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

export const updateMoySkladVariantStock = async (
  variantMoySkladId: string,
  newStock: number,
) => {
  const body = [
    {
      stock: newStock,
      assortment: {
        meta: {
          href: `${MOYSKLAD_API_URL}/entity/variant/${variantMoySkladId}`,
          metadataHref: `${MOYSKLAD_API_URL}/entity/variant/metadata`,
          type: 'variant',
        },
      },
    },
  ];

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Исправляем эндпоинт на единственно верный ---
  const data = await moySkladFetch('entity/assortment/stock', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return data;
};

