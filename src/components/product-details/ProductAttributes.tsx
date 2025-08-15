// Местоположение: src/components/product-details/ProductAttributes.tsx
'use client';

import { useState } from 'react';

// ... компонент ChevronIcon без изменений ...
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`relative top-[1px] h-5 w-5 transform text-gray-800 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

// VVV--- НОВЫЙ КОМПОНЕНТ ДЛЯ КРАСИВОГО ОТОБРАЖЕНИЯ СОСТАВА ---VVV
interface CompositionItem {
  material: string;
  percentage: string;
}

const CompositionDisplay = ({ jsonValue }: { jsonValue: string }) => {
  try {
    const items: CompositionItem[] = JSON.parse(jsonValue);
    // Проверяем, что это массив и он не пустой
    if (!Array.isArray(items) || items.length === 0)
      return <span>{jsonValue}</span>;

    return (
      <div>
        {items.map(
          (item, index) =>
            // Отображаем только если есть и материал, и процент
            item.material &&
            item.percentage && (
              <div key={index} className="flex justify-between">
                <span className="font-body text-base text-gray-800">
                  {item.material}
                </span>
                <span className="font-body text-base font-semibold text-gray-800">
                  {item.percentage}%
                </span>
              </div>
            ),
        )}
      </div>
    );
  } catch (e) {
    // Если это невалидный JSON, просто возвращаем исходную строку
    return (
      <span className="font-body text-base font-semibold whitespace-pre-line text-gray-800">
        {jsonValue}
      </span>
    );
  }
};

interface Attribute {
  id: string;
  key: string;
  value: string;
}

interface ProductAttributesProps {
  attributes: Attribute[];
}

export default function ProductAttributes({
  attributes,
}: ProductAttributesProps) {
  const [isOpen, setIsOpen] = useState(false);

  const description = attributes.find((attr) => attr.key === 'Описание');
  const article = attributes.find((attr) => attr.key === 'Артикул');
  const hiddenAttributes = attributes.filter(
    (attr) => attr.key !== 'Описание' && attr.key !== 'Артикул',
  );

  if (!attributes || attributes.length === 0) {
    return null;
  }

  return (
    <div>
      {hiddenAttributes.length > 0 && (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="font-body flex items-center gap-x-2 py-4 text-left text-base font-semibold text-gray-800"
          >
            <span>О товаре</span>
            <ChevronIcon isOpen={isOpen} />
          </button>

          <div
            className={`grid overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="min-h-0">
              <div className="space-y-4 pb-4">
                {hiddenAttributes.map((attr) => (
                  <div key={attr.id}>
                    <p className="font-body text-sm text-gray-500">
                      {attr.key}
                    </p>
                    {/* VVV--- НАША "УМНАЯ" ЛОГИКА ---VVV */}
                    {attr.key === 'Состав, %' ? (
                      <CompositionDisplay jsonValue={attr.value} />
                    ) : (
                      <p className="font-body text-base font-semibold whitespace-pre-line text-gray-800">
                        {attr.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="space-y-4 py-4">
        {description && (
          <div>
            <p className="font-body text-sm text-gray-500">{description.key}</p>
            <p className="font-body text-base font-semibold text-gray-800">
              {description.value}
            </p>
          </div>
        )}
        {article && (
          <div>
            <p className="font-body text-sm text-gray-500">{article.key}</p>
            <p className="font-body text-base font-semibold text-gray-800">
              {article.value}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
