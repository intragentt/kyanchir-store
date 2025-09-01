// /src/lib/moysklad-api.ts

const MOYSKLAD_API_TOKEN = process.env.MOYSKLAD_API_TOKEN;

// --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
// Старый URL: 'https://online.moysklad.ru/api/remap/1.2'
const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2';
// --- КОНЕЦ ИЗМЕНЕНИЯ ---

if (!MOYSKLAD_API_TOKEN) {
  throw new Error('Переменная окружения MOYSKLAD_API_TOKEN не определена!');
}

// Создаем "кастомный" fetch, который будет добавлять заголовки аутентификации
const moySkladFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${MOYSKLAD_API_URL}/${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${MOYSKLAD_API_TOKEN}`);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept-Encoding', 'gzip');

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Попробуем получить тело ошибки для более детального логгирования
      const errorBody = await response.text();
      console.error(
        `Ошибка API МойСклад [${response.status} ${response.statusText}]: ${errorBody}`,
      );
      throw new Error(
        `Ошибка API МойСклад: ${response.status} ${response.statusText}`,
      );
    }

    // Если ответ пустой (например, код 204), вернем null, а не пытаемся парсить JSON
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при выполнении запроса к МойСклад:', error);
    throw error;
  }
};

// --- API МЕТОДЫ ---

// Получение списка товаров (ассортимента)
export const getMoySkladProducts = async () => {
  // `entity/assortment` - это эндпоинт для получения товаров и услуг
  const data = await moySkladFetch('entity/assortment');
  return data;
};

// Получение списка групп товаров (категорий)
export const getMoySkladCategories = async () => {
  // `entity/productfolder` - это эндпоинт для получения категорий
  const data = await moySkladFetch('entity/productfolder');
  return data;
};
