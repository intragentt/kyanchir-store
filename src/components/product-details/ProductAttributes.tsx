// Местоположение: src/components/product-details/ProductAttributes.tsx
'use client';

import { useState, useMemo } from 'react';

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`relative top-[1px] h-5 w-5 transform text-gray-800 transition-transform duration-300 ${
      isOpen ? 'rotate-90' : ''
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

  // --- НОВАЯ, БОЛЕЕ ПРОСТАЯ ЛОГИКА ---
  // Находим "Описание" и "Артикул"
  const description = attributes.find((attr) => attr.key === 'Описание');
  const article = attributes.find((attr) => attr.key === 'Артикул');

  // Все остальные атрибуты считаем "скрытыми"
  const hiddenAttributes = attributes.filter(
    (attr) => attr.key !== 'Описание' && attr.key !== 'Артикул',
  );

  if (!attributes || attributes.length === 0) {
    return null;
  }

  // --- ОБНОВЛЕННАЯ ВЕРСТКА ---
  return (
    <div>
      {/* Аккордеон показываем, только если есть скрытые атрибуты */}
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
            className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
              isOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0">
              {/* VVV--- ВАЖНО: Добавляем `white-space: pre-line` для переноса строк в "Составе" ---VVV */}
              <div className="space-y-4 pb-4">
                {hiddenAttributes.map((attr) => (
                  <div key={attr.id}>
                    <p className="font-body text-sm text-gray-500">
                      {attr.key}
                    </p>
                    <p className="font-body text-base font-semibold whitespace-pre-line text-gray-800">
                      {attr.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Блок, который виден всегда */}
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
