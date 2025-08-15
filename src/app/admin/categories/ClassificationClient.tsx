// Местоположение: src/app/admin/categories/ClassificationClient.tsx
'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import type { Category, Tag } from '@prisma/client';
import {
  createCategory,
  deleteCategory,
  createTag,
  deleteTag,
  saveAllClassifications, // Импортируем нашу новую "супер-функцию"
} from './actions';
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from '@hello-pangea/dnd';

// --- Типы ---
type CategoryWithChildren = Category & { children: CategoryWithChildren[] };
type Item = { id: string; name: string; color: string | null };

// --- Иконки ---
const DragHandleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="10" cy="6" r="1.5" fill="currentColor" />
    <circle cx="10" cy="12" r="1.5" fill="currentColor" />
    <circle cx="10" cy="18" r="1.5" fill="currentColor" />
    <circle cx="14" cy="6" r="1.5" fill="currentColor" />
    <circle cx="14" cy="12" r="1.5" fill="currentColor" />
    <circle cx="14" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

// --- Компоненты UI ---
const ColorPicker = ({
  color,
  onSave,
}: {
  color: string | null;
  onSave: (color: string) => void;
}) => (
  <div
    className="relative h-5 w-5 rounded-full"
    style={{ backgroundColor: color || '#E5E7EB' }}
  >
    <input
      type="color"
      value={color || '#E5E7EB'}
      onChange={(e) => onSave(e.target.value)}
      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
    />
  </div>
);

const AddItemForm = ({
  onSave,
  onCancel,
  isPending,
  parentId = null,
}: {
  onSave: (name: string, parentId: string | null) => void;
  onCancel: () => void;
  isPending: boolean;
  parentId?: string | null;
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const handleSubmit = () => {
    if (name.trim()) onSave(name.trim(), parentId);
  };
  return (
    <form action={handleSubmit} className="flex items-center gap-2 py-2">
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название..."
        className="w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm text-white hover:bg-indigo-500"
      >
        ✓
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-200 text-sm text-gray-700 hover:bg-gray-300"
      >
        ×
      </button>
    </form>
  );
};

const ItemRow = ({
  item,
  onUpdate,
  onDelete,
  isPending,
  isSystem = false,
  children,
  level = 0,
}: {
  item: Item & { parentId?: string | null; order?: number };
  onUpdate: (id: string, data: Partial<Item>) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
  isSystem?: boolean;
  children?: React.ReactNode;
  level?: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const levelClasses = [
    'font-semibold',
    'font-normal',
    'font-normal text-gray-600',
  ];

  const handleSave = () => {
    if (name.trim() && name.trim() !== item.name)
      onUpdate(item.id, { name: name.trim() });
    setIsEditing(false);
  };

  return (
    <div
      className="group flex items-center justify-between border-b py-1.5"
      onDoubleClick={() => !isSystem && setIsEditing(true)}
    >
      <div className="flex flex-grow items-center gap-2">
        <ColorPicker
          color={item.color}
          onSave={(color) => onUpdate(item.id, { color })}
        />
        {isEditing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full rounded-md border px-2 py-1 text-sm"
            autoFocus
            disabled={isPending}
          />
        ) : (
          <span className={`text-sm ${levelClasses[level]}`}>{item.name}</span>
        )}
      </div>
      <div className="flex items-center gap-x-3 text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100">
        {children}
        {!isSystem && (
          <button
            onClick={() => onDelete(item.id)}
            disabled={isPending}
            className="text-red-500 hover:text-red-700"
          >
            Удалить
          </button>
        )}
      </div>
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
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [tags, setTags] = useState(initialTags);
  const [addingToParent, setAddingToParent] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const buildTree = useCallback(
    (
      cats: Category[],
      parentId: string | null = null,
    ): CategoryWithChildren[] => {
      return cats
        .filter((c) => c.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map((category) => ({
          ...category,
          children: buildTree(cats, category.id),
        }));
    },
    [],
  );

  useEffect(() => {
    setCategories(buildTree(initialCategories));
    setTags(initialTags.sort((a, b) => a.order - b.order));
  }, [initialCategories, initialTags, buildTree]);

  const handleCreateCategory = (name: string, parentId: string | null) =>
    startTransition(() => {
      createCategory(name, parentId);
      setAddingToParent(null);
    });
  const handleDeleteCategory = (id: string) =>
    startTransition(() => {
      deleteCategory(id);
    });
  const handleCreateTag = (name: string) =>
    startTransition(() => {
      createTag(name);
    });
  const handleDeleteTag = (id: string) =>
    startTransition(() => {
      deleteTag(id);
    });

  const updateItem = <T extends { id: string }>(
    items: T[],
    setItems: React.Dispatch<React.SetStateAction<T[]>>,
    id: string,
    data: Partial<T>,
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item)),
    );
    setIsDirty(true);
  };

  const onDragEnd: OnDragEndResponder = (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    setIsDirty(true);

    if (type === 'TAGS') {
      const newTags = Array.from(tags);
      const [moved] = newTags.splice(source.index, 1);
      newTags.splice(destination.index, 0, moved);
      setTags(newTags);
    }
  };

  const handleSaveAll = () => {
    const flatten = (items: CategoryWithChildren[]): Category[] =>
      items.flatMap((item) => [
        { ...item, children: undefined },
        ...flatten(item.children),
      ]);
    const flatCategories = flatten(categories);

    startTransition(() => {
      saveAllClassifications(
        flatCategories.map((c, i) => ({ ...c, order: i })), // Пересчитываем порядок при сохранении
        tags.map((t, i) => ({ ...t, order: i })),
      );
      setIsDirty(false);
    });
  };

  const systemTags = ['скидка', 'новинка'];

  const CategoryTree = ({
    items,
    level = 0,
  }: {
    items: CategoryWithChildren[];
    level?: number;
  }) => (
    <>
      {items.map((cat, index) => (
        <div key={cat.id} className="relative pl-4">
          <div className="absolute top-0 left-0 h-full w-4 border-l border-gray-200"></div>
          <div className="absolute top-1/2 left-0 h-1/2 w-4 border-b border-gray-200"></div>

          <Draggable key={cat.id} draggableId={cat.id} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                className="flex items-center gap-1"
              >
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab text-gray-300 hover:text-gray-500"
                >
                  <DragHandleIcon />
                </div>
                <div className="flex-grow">
                  <ItemRow
                    item={cat}
                    onUpdate={(id, data) =>
                      updateItem(
                        initialCategories as any,
                        setCategories as any,
                        id,
                        data,
                      )
                    }
                    onDelete={handleDeleteCategory}
                    isPending={isPending}
                    level={level}
                  >
                    {level < 2 && (
                      <button
                        onClick={() => setAddingToParent(cat.id)}
                        className="text-sm font-semibold text-gray-500 hover:text-gray-800"
                      >
                        +
                      </button>
                    )}
                  </ItemRow>
                </div>
              </div>
            )}
          </Draggable>

          {addingToParent === cat.id && (
            <div className="pl-12">
              <AddItemForm
                parentId={cat.id}
                onSave={handleCreateCategory}
                onCancel={() => setAddingToParent(null)}
                isPending={isPending}
              />
            </div>
          )}
          {cat.children.length > 0 && (
            <CategoryTree items={cat.children} level={level + 1} />
          )}
        </div>
      ))}
    </>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={!isDirty || isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Категории
          </h2>
          <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-2 font-medium">Добавить новый тип</div>
            {addingToParent === 'root' ? (
              <AddItemForm
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
          <div className="text-md mb-2 font-semibold">
            Существующие категории
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <Droppable droppableId="ROOT" type="CATEGORIES-ROOT">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {categories.map((root, index) => (
                    <Draggable
                      key={root.id}
                      draggableId={root.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center gap-1"
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab text-gray-300 hover:text-gray-500"
                          >
                            <DragHandleIcon />
                          </div>
                          <div className="flex-grow">
                            <ItemRow
                              item={root}
                              onUpdate={(id, data) =>
                                updateItem(
                                  initialCategories as any,
                                  setCategories as any,
                                  id,
                                  data,
                                )
                              }
                              onDelete={handleDeleteCategory}
                              isPending={isPending}
                              level={0}
                            >
                              <button
                                onClick={() => setAddingToParent(root.id)}
                                className="text-sm font-semibold text-gray-500 hover:text-gray-800"
                              >
                                +
                              </button>
                            </ItemRow>
                            {addingToParent === root.id && (
                              <div className="pl-6">
                                <AddItemForm
                                  parentId={root.id}
                                  onSave={handleCreateCategory}
                                  onCancel={() => setAddingToParent(null)}
                                  isPending={isPending}
                                />
                              </div>
                            )}
                            {root.children.length > 0 && (
                              <CategoryTree items={root.children} level={1} />
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Метки (Теги)
          </h2>
          <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-2 font-medium">Добавить новую метку</div>
            <AddItemForm
              onSave={(name) => handleCreateTag(name)}
              onCancel={() => {}}
              isPending={isPending}
            />
          </div>
          <div className="text-md mb-2 font-semibold">Существующие метки</div>
          <Droppable droppableId="tags-list" type="TAGS">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="rounded-lg border bg-white p-4 shadow-sm"
              >
                {tags.map((tag, index) => (
                  <Draggable key={tag.id} draggableId={tag.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-1"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab text-gray-300 hover:text-gray-500"
                        >
                          <DragHandleIcon />
                        </div>
                        <div className="flex-grow">
                          <ItemRow
                            item={tag}
                            onUpdate={(id, data) =>
                              updateItem(tags, setTags, id, data)
                            }
                            onDelete={handleDeleteTag}
                            isPending={isPending}
                            isSystem={systemTags.includes(
                              tag.name.toLowerCase(),
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </section>
      </div>
    </DragDropContext>
  );
}
