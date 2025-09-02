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

// --- API МЕТОДЫ ---
export const getMoySkladProducts = async () => {
  // Добавляем expand=productFolder, чтобы всегда получать инфо о родительской папке
  const data = await moySkladFetch('entity/assortment?expand=productFolder');
  return data;
};

export const getMoySkladCategories = async () => {
  // Добавляем expand=productFolder для получения иерархии
  const data = await moySkladFetch('entity/productfolder?expand=productFolder');
  return data;
};

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// 1. Новая функция для получения остатков
export const getMoySkladStock = async () => {
  // `report/stock/all` - специальный эндпоинт для отчета по остаткам.
  // `stockMode=all` - учитывает все операции (резервы, ожидания)
  const data = await moySkladFetch('report/stock/all?stockMode=all');
  return data;
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
