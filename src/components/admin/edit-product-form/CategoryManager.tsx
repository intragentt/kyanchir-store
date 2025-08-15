// Местоположение: src/components/admin/edit-product-form/CategoryManager.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Category, Tag } from '@prisma/client';

interface CategoryManagerProps {
  allCategories: Category[];
  allTags: Tag[];
  selectedCategories: Category[];
  setSelectedCategories: (categories: Category[]) => void;
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
}

export default function CategoryManager({
  allCategories,
  allTags,
  selectedCategories,
  setSelectedCategories,
  selectedTags,
  setSelectedTags,
}: CategoryManagerProps) {
  const [tagInput, setTagInput] = useState('');

  const parentCategories = useMemo(
    () => allCategories.filter((c) => c.parentId === null),
    [allCategories],
  );
  const selectedParentCategory = useMemo(
    () =>
      selectedCategories.find((sc) =>
        parentCategories.some((pc) => pc.id === sc.id),
      ),
    [selectedCategories, parentCategories],
  );

  const subCategories = useMemo(() => {
    if (!selectedParentCategory) return [];
    return allCategories.filter(
      (c) => c.parentId === selectedParentCategory.id,
    );
  }, [allCategories, selectedParentCategory]);

  const selectedSubCategory = useMemo(
    () =>
      selectedCategories.find((sc) =>
        subCategories.some((subc) => subc.id === sc.id),
      ),
    [selectedCategories, subCategories],
  );

  const handleParentCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const parentId = e.target.value;
    const parentCategory = allCategories.find((c) => c.id === parentId);
    setSelectedCategories(parentCategory ? [parentCategory] : []);
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = e.target.value;
    const subCategory = allCategories.find((c) => c.id === subId);
    if (selectedParentCategory && subCategory) {
      setSelectedCategories([selectedParentCategory, subCategory]);
    } else if (selectedParentCategory) {
      setSelectedCategories([selectedParentCategory]);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      const existingTag = allTags.find(
        (t) => t.name.toLowerCase() === tagInput.trim().toLowerCase(),
      );
      const newTag = existingTag || {
        id: tagInput.trim(),
        name: tagInput.trim(),
      };

      if (
        !selectedTags.some(
          (st) => st.name.toLowerCase() === newTag.name.toLowerCase(),
        )
      ) {
        setSelectedTags([...selectedTags, newTag as Tag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: Tag) => {
    setSelectedTags(selectedTags.filter((tag) => tag.id !== tagToRemove.id));
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow">
      <div className="mb-4 text-lg font-semibold text-gray-800">
        Категоризация
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Основная категория
          </label>
          <select
            value={selectedParentCategory?.id || ''}
            onChange={handleParentCategoryChange}
            className="w-full rounded-md border bg-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Выберите категорию</option>
            {parentCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {selectedParentCategory && subCategories.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Подкатегория (опционально)
            </label>
            <select
              value={selectedSubCategory?.id || ''}
              onChange={handleSubCategoryChange}
              className="w-full rounded-md border bg-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Выберите подкатегорию</option>
              {subCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Метки (Теги)
          </label>
          <div className="rounded-md border p-2">
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
                >
                  <span>{tag.name}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-indigo-500 hover:text-indigo-700"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Добавить тег и нажать Enter"
              className="w-full border-none p-1 focus:ring-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
