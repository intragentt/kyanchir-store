// Местоположение: src/components/product-details/ProductAttributes.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Исправляем импорт CopyIcon ---
import { CheckIcon, CopyIcon } from '@/components/shared/icons';
import { useAppStore } from '@/store/useAppStore';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`h-6 w-6 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
  >
    <path
      fillRule="evenodd"
      d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const DescriptionChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={`relative top-[1px] h-4 w-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
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
      <span className="whitespace-pre-line font-body text-base font-medium text-[#272727]">
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
  const showNotification = useAppStore((state) => state.showNotification);
  const contentRef = useRef<HTMLDivElement>(null);

  const [maxHeight, setMaxHeight] = useState('100px');
  const TEASER_HEIGHT = '100px';

  useEffect(() => {
    if (isOpen) {
      setMaxHeight(`${contentRef.current?.scrollHeight}px`);
    } else {
      setMaxHeight(TEASER_HEIGHT);
    }
  }, [isOpen]);

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

  const handleCopyArticle = () => {
    if (!article) return;
    navigator.clipboard.writeText(article.value);
    showNotification('Артикул скопирован', 'success', CheckIcon);
  };

  if (!attributes || attributes.length === 0) {
    return null;
  }

  return (
    <div>
      {hiddenAttributes.length > 0 && (
        <div className="relative border-b border-gray-200">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between py-4 text-left font-body text-base font-medium text-text-primary"
          >
            <span>О товаре</span>
          </button>

          <div
            className="overflow-hidden transition-all duration-700 ease-in-out"
            style={{ maxHeight }}
          >
            <div ref={contentRef} className="space-y-4 pb-4">
              {sortedAttributes.map((attr) => (
                <div key={attr.id}>
                  <p className="font-body text-base font-medium text-gray-500">
                    {attr.key}
                  </p>
                  {attr.key === 'Состав, %' ? (
                    <CompositionDisplay jsonValue={attr.value} />
                  ) : (
                    <p className="whitespace-pre-line font-body text-base font-medium text-[#272727]">
                      {attr.value}
                    </p>
                  )}
                </div>
              ))}
              <div className="flex w-full justify-center pt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="relative left-2 flex items-center gap-x-2 font-body text-base font-medium text-text-primary"
                >
                  <span>Свернуть</span>
                  <ChevronIcon isOpen={true} />
                </button>
              </div>
            </div>
          </div>

          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className="absolute bottom-0 left-0 flex w-full flex-col items-center gap-y-1 pb-2 pt-8"
              style={{
                background:
                  'linear-gradient(to top, white 20%, transparent 100%)',
              }}
              aria-label="Показать полную информацию о товаре"
            >
              <div className="h-px w-full bg-gray-200"></div>
              <ChevronIcon isOpen={false} />
            </button>
          )}
        </div>
      )}

      <div className="space-y-4 py-4">
        {description && (
          <div>
            <p className="font-body text-base font-medium text-gray-500">
              {description.key}
            </p>
            <div className="font-body text-base font-medium text-[#272727]">
              {description.value.length <= TRUNCATE_LENGTH ||
              isDescriptionExpanded
                ? description.value
                : `${description.value.substring(0, TRUNCATE_LENGTH)}... `}

              {description.value.length > TRUNCATE_LENGTH && (
                <button
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                  className="ml-2 inline-flex items-center gap-x-1 font-medium text-gray-500 hover:text-gray-700"
                >
                  <span>
                    {isDescriptionExpanded ? 'Свернуть' : 'Читать дальше'}
                  </span>
                  <DescriptionChevronIcon isOpen={isDescriptionExpanded} />
                </button>
              )}
            </div>
          </div>
        )}
        {article && (
          <div className="flex items-center gap-x-2 pt-4">
            <p className="font-body text-base font-medium text-gray-500">
              {article.key}:
            </p>
            <button
              onClick={handleCopyArticle}
              title="Скопировать артикул"
              className="group flex items-center gap-x-2 transition-opacity hover:opacity-70"
            >
              <span className="font-body text-base font-medium text-[#272727] transition-colors group-active:text-gray-500">
                {article.value}
              </span>
              <CopyIcon className="h-5 w-5 text-gray-400 transition-colors group-active:text-gray-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
