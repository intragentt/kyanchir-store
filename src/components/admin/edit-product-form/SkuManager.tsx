// Местоположение: src/components/admin/edit-product-form/SkuManager.tsx
'use client';

interface SkuManagerProps {
  sku: string | null;
  customArticle: string;
  onCustomArticleChange: (newValue: string) => void;
  onGenerateSku: () => void;
}

export default function SkuManager({
  sku,
  customArticle,
  onCustomArticleChange,
  onGenerateSku,
}: SkuManagerProps) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Системный артикул
          </label>
          <div className="flex items-center gap-x-2">
            <input
              type="text"
              readOnly
              value={sku || 'Будет создан при сохранении'}
              className="user-select-text block w-full cursor-not-allowed rounded-md border-gray-300 bg-gray-200 p-2 text-gray-500 shadow-sm"
            />
            {!sku && (
              <button
                type="button"
                onClick={onGenerateSku}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Сгенерировать
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Пользовательский артикул (если нужно)
          </label>
          <input
            type="text"
            value={customArticle}
            onChange={(e) => onCustomArticleChange(e.target.value)}
            placeholder="Например, KYANCHIR/SET/001"
            className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
