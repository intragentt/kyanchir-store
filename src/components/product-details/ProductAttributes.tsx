// Местоположение: src/components/product-details/ProductAttributes.tsx
'use client';

import { useState } from 'react';

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`relative top-[1px] h-5 w-5 transform text-text-primary transition-transform duration-300 ${
      isOpen ? '-rotate-90' : 'rotate-90'
    }`}
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
      <div className="max-w-xs">
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const TRUNCATE_LENGTH = 150;

  const description = attributes.find((attr) => attr.key === 'Описание');
  const article = attributes.find((attr) => attr.key === 'Артикул');
  const hiddenAttributes = attributes.filter(
    (attr) => attr.key !== 'Описание' && attr.key !== 'Артикул',
  );

  const desiredOrder = ['Цвет', 'Состав, %', 'Уход'];
  const sortedAttributes = [...hiddenAttributes].sort((a, b) => {
    let indexA = desiredOrder.indexOf(a.key);
    let indexB = desiredOrder.indexOf(b.key);
    if (indexA === -1) indexA = Infinity;
    if (indexB === -1) indexB = Infinity;
    return indexA - indexB;
  });

  if (!attributes || attributes.length === 0) {
    return null;
  }

  return (
    <div>
      {hiddenAttributes.length > 0 && (
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="font-body flex w-full items-center justify-between py-4 text-left text-base font-medium text-text-primary"
          >
            <span>О товаре</span>
            <ChevronIcon isOpen={isOpen} />
          </button>

          <div
            className={`grid overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="min-h-0">
              <div className="space-y-4 pb-4">
                {sortedAttributes.map((attr) => (
                  <div key={attr.id}>
                    <p className="font-body text-base font-medium text-gray-500">
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
        </div>
      )}
      
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Убрана линия, увеличен отступ у Артикула --- */}
      <div className="space-y-4 border-t border-gray-200 py-4">
        {description && (
          <div>
            <p className="font-body text-base font-medium text-gray-500">{description.key}</p>
            <div className="font-body text-base font-medium text-[#272727]">
              {description.value.length > TRUNCATE_LENGTH && !isDescriptionExpanded
                ? `${description.value.substring(0, TRUNCATE_LENGTH)}... `
                : description.value}
              
              {description.value.length > TRUNCATE_LENGTH && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="font-medium text-gray-500 hover:text-gray-700"
                >
                  {isDescriptionExpanded ? 'Свернуть' : 'Читать дальше'}
                </button>
              )}
            </div>
          </div>
        )}
        {article && (
          <div className="flex items-center gap-x-2 pt-4"> {/* Добавлен отступ pt-4 */}
            <p className="font-body text-base font-medium text-gray-500">{article.key}:</p>
            <p className="font-body text-base font-medium text-[#272727]">
              {article.value}
            </p>
          </div>
        )}
      </div>
       {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </div>
  );
}