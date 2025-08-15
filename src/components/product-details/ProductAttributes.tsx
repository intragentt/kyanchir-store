// Местоположение: src/components/product-details/ProductAttributes.tsx
'use client';

import { useState } from 'react';

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

interface CompositionItem {
  material: string;
  percentage: string;
}

const CompositionDisplay = ({ jsonValue }: { jsonValue: string }) => {
  try {
    const items: CompositionItem[] = JSON.parse(jsonValue);
    if (!Array.isArray(items) || items.length === 0)
      return <span>{jsonValue}</span>;

    return (
      <div className="space-y-1">
        {items.map(
          (item, index) =>
            item.material &&
            item.percentage && (
              <div
                key={index}
                className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-2"
              >
                <span className="font-body text-base font-medium text-[#272727]">
                  {item.material}
                </span>
                <span className="border-b border-dotted border-gray-400"></span>
                <span className="font-body text-base font-medium text-[#272727]">
                  {item.percentage}%
                </span>
              </div>
            ),
        )}
      </div>
    );
  } catch (e) {
    return (
      <span className="font-body text-base font-medium whitespace-pre-line text-[#272727]">
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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавлена логика сортировки атрибутов ---
  const desiredOrder = ['Цвет', 'Состав, %', 'Уход'];
  const sortedAttributes = [...hiddenAttributes].sort((a, b) => {
    let indexA = desiredOrder.indexOf(a.key);
    let indexB = desiredOrder.indexOf(b.key);
    // Если атрибута нет в нашем списке, отправляем его в конец
    if (indexA === -1) indexA = Infinity;
    if (indexB === -1) indexB = Infinity;
    return indexA - indexB;
  });
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
            {/* --- ИЗМЕНЕНИЕ: Теперь стрелка указывает вправо, а не вниз --- */}
            <ChevronIcon isOpen={!isOpen} />
          </button>

          <div
            className={`grid overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="min-h-0">
              <div className="space-y-4 pb-4">
                {/* --- ИЗМЕНЕНИЕ: Используем отсортированный массив --- */}
                {sortedAttributes.map((attr) => (
                  <div key={attr.id}>
                    <p className="font-body text-base font-semibold text-gray-500">
                      {attr.key}
                    </p>
                    {attr.key === 'Состав, %' ? (
                      <CompositionDisplay jsonValue={attr.value} />
                    ) : (
                      <p className="font-body text-base font-medium whitespace-pre-line text-[#272727]">
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
            <p className="font-body text-base font-semibold text-gray-500">
              {description.key}
            </p>
            <p className="font-body text-base font-medium text-[#272727]">
              {description.value}
            </p>
          </div>
        )}
        {article && (
          <div>
            <p className="font-body text-base font-semibold text-gray-500">
              {article.key}
            </p>
            <p className="font-body text-base font-medium text-[#272727]">
              {article.value}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
