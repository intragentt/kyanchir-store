// Местоположение: src/components/admin/edit-product-form/CategoryManager.tsx
'use client';

import { Category } from '@prisma/client';
import { useState } from 'react';

interface CategoryManagerProps {
  allCategories: Category[];
  selectedCategories: Category[];
  onCategoryChange: (selected: Category[]) => void;
}

// Временный компонент для управления тегами
const TagInput = ({ tags, setTags }: { tags: string[], setTags: (tags: string[]) => void }) => {
  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };
  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value !== '') {
      e.preventDefault();
      setTags([...tags, e.currentTarget.value]);
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-300 bg-white p-2">
      {tags.map((tag, index) => (
        <div key={index} className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-sm text-indigo-700">
          <span>{tag}</span>
          <button type="button" onClick={() => removeTag(index)} className="font-bold">×</button>
        </div>
      ))}
      <input
        type="text"
        onKeyDown={addTag}
        placeholder="Добавить тег и нажать Enter"
        className="flex-grow border-none bg-transparent p-1 focus:ring-0"
      />
    </div>
  );
};


export default function CategoryManager({
  allCategories,
  selectedCategories,
  onCategoryChange,
}: CategoryManagerProps) {

  // Временные состояния для подкатегорий и меток
  const [subCategory, setSubCategory] = useState('');
  const [tags, setTags] = useState<string[]>(['Новинка', 'Летняя коллекция']);

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="text-lg font-semibold text-gray-800 mb-4">Категоризация</div>
      <div className="space-y-4">
        
        {/* Поле 1: Категория */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Основная категория
          </label>
          <select
            id="category"
            // Здесь будет логика выбора основной категории
            className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option>-- Выберите категорию --</option>
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        {/* Поле 2: Подкатегория */}
        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
            Подкатегория (опционально)
          </label>
          <input
            type="text"
            id="subcategory"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            placeholder="Например, Комплект двойка"
            className="block w-full max-w-xs rounded-md border-gray-300 bg-gray-50 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Поле 3: Метки */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Метки (Теги)
          </label>
          <TagInput tags={tags} setTags={setTags} />
        </div>
        
      </div>
    </div>
  );
}