// Местоположение: src/app/admin/categories/ClassificationClient.tsx
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Category, Tag } from '@prisma/client';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createTag,
  updateTag,
  deleteTag,
} from './actions';

// --- Компонент для инлайнового добавления категории ---
const AddCategoryForm = ({
  parentId,
  onSave,
  onCancel,
  isPending,
}: {
  parentId: string | null;
  onSave: (name: string, parentId: string | null) => void;
  onCancel: () => void;
  isPending: boolean;
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleSubmit = () => {
    if (name.trim()) {
      onSave(name.trim(), parentId);
    }
  };

  return (
    <div className="flex items-center gap-2 py-2">
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Название..."
        className="w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
        disabled={isPending}
      />
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="rounded-md bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500"
      >
        ✓
      </button>
      <button
        onClick={onCancel}
        className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
      >
        ×
      </button>
    </div>
  );
};

// --- Компонент для элемента списка (с редактированием) ---
const ListItem = ({
  item,
  onUpdate,
  onDelete,
  isPending,
  isSystem = false,
  children,
}: {
  item: { id: string; name: string };
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
  isSystem?: boolean;
  children?: React.ReactNode;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);

  const handleSave = () => {
    if (name.trim() !== '' && name.trim() !== item.name) {
      onUpdate(item.id, name.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between border-b py-2">
      {isEditing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="w-full rounded-md border px-1 py-0.5 focus:ring-1 focus:ring-indigo-500"
          autoFocus
          disabled={isPending}
        />
      ) : (
        <>
          <span className="flex-grow">{item.name}</span>
          <div className="ml-4 flex flex-shrink-0 items-center gap-x-4">
            {children}
            {!isSystem && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Редактировать
              </button>
            )}
            {!isSystem && (
              <button
                onClick={() => onDelete(item.id)}
                disabled={isPending}
                className="text-sm font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                Удалить
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- Основной клиентский компонент ---
export function ClassificationClient({
  initialCategories,
  initialTags,
}: {
  initialCategories: Category[];
  initialTags: Tag[];
}) {
  const [isPending, startTransition] = useTransition();
  const [addingToParent, setAddingToParent] = useState<string | null>(null);

  const handleCreateCategory = (name: string, parentId: string | null) => {
    startTransition(() => {
      createCategory(name, parentId);
      setAddingToParent(null);
    });
  };

  const handleUpdateCategory = (id: string, name: string) => {
    startTransition(() => {
      updateCategory(id, name);
    });
  };

  const handleDeleteCategory = (id: string) => {
    startTransition(() => {
      deleteCategory(id);
    });
  };

  const handleCreateTag = (formData: FormData) => {
    const nameInput = (formData as any).get('name');
    if (nameInput) {
      startTransition(() => {
        createTag(nameInput);
      });
      const form = document.getElementById('new-tag-form') as HTMLFormElement;
      form?.reset();
    }
  };

  const handleUpdateTag = (id: string, name: string) => {
    startTransition(() => {
      updateTag(id, name);
    });
  };

  const handleDeleteTag = (id: string) => {
    startTransition(() => {
      deleteTag(id);
    });
  };

  const buildCategoryTree = (
    categories: Category[],
    parentId: string | null = null,
  ): (Category & { children: any[] })[] => {
    return categories
      .filter((category) => category.parentId === parentId)
      .map((category) => ({
        ...category,
        children: buildCategoryTree(categories, category.id),
      }));
  };
  const categoryRoots = buildCategoryTree(initialCategories);

  // --- Новый компонент для рекурсивного отображения дерева ---
  const CategoryTree = ({
    categories,
  }: {
    categories: (Category & { children: any[] })[];
  }) => (
    <>
      {categories.map((cat) => (
        <div key={cat.id} className="border-l border-gray-200 pl-6">
          <ListItem
            item={cat}
            onUpdate={handleUpdateCategory}
            onDelete={handleDeleteCategory}
            isPending={isPending}
          >
            {cat.children.length < 3 && ( // Ограничение на 3 уровня вложенности
              <button
                onClick={() => setAddingToParent(cat.id)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-800"
              >
                +
              </button>
            )}
          </ListItem>
          {addingToParent === cat.id && (
            <div className="border-l border-gray-200 pl-6">
              <AddCategoryForm
                parentId={cat.id}
                onSave={handleCreateCategory}
                onCancel={() => setAddingToParent(null)}
                isPending={isPending}
              />
            </div>
          )}
          {cat.children.length > 0 && (
            <CategoryTree categories={cat.children} />
          )}
        </div>
      ))}
    </>
  );

  const systemTags = ['скидка', 'новинка'];

  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
      {/* Категории */}
      <section>
        <div className="mb-4 text-lg font-semibold text-gray-800">
          Категории
        </div>
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-2 font-medium">Добавить новый тип</div>
          {addingToParent === 'root' ? (
            <AddCategoryForm
              parentId={null}
              onSave={handleCreateCategory}
              onCancel={() => setAddingToParent(null)}
              isPending={isPending}
            />
          ) : (
            <button
              onClick={() => setAddingToParent('root')}
              className="w-full rounded-md border border-dashed bg-gray-50 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              + Создать новую категорию верхнего уровня (Тип)
            </button>
          )}
        </div>
        <div className="text-md mb-2 font-semibold">Существующие категории</div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          {categoryRoots.map((root) => (
            <div key={root.id}>
              <ListItem
                item={root}
                onUpdate={handleUpdateCategory}
                onDelete={handleDeleteCategory}
                isPending={isPending}
              >
                <button
                  onClick={() => setAddingToParent(root.id)}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-800"
                >
                  +
                </button>
              </ListItem>
              {addingToParent === root.id && (
                <div className="border-l border-gray-200 pl-6">
                  <AddCategoryForm
                    parentId={root.id}
                    onSave={handleCreateCategory}
                    onCancel={() => setAddingToParent(null)}
                    isPending={isPending}
                  />
                </div>
              )}
              <CategoryTree categories={root.children} />
            </div>
          ))}
        </div>
      </section>

      {/* Метки */}
      <section>
        <div className="mb-4 text-lg font-semibold text-gray-800">
          Метки (Теги)
        </div>
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-2 font-medium">Добавить новую метку</div>
          <form
            id="new-tag-form"
            action={handleCreateTag}
            className="flex items-center gap-2"
          >
            <input
              name="name"
              placeholder="Название метки"
              className="w-full rounded-md border px-3 py-2"
              required
            />
            <button
              type="submit"
              disabled={isPending}
              className="flex-shrink-0 rounded-md bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
            >
              Создать
            </button>
          </form>
        </div>
        <div className="text-md mb-2 font-semibold">Существующие метки</div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          {initialTags.map((tag) => (
            <ListItem
              key={tag.id}
              item={tag}
              onUpdate={handleUpdateTag}
              onDelete={handleDeleteTag}
              isPending={isPending}
              isSystem={systemTags.includes(tag.name.toLowerCase())}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
