// Местоположение: src/app/admin/categories/ClassificationClient.tsx
'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Category, Tag } from '@prisma/client';
import toast from 'react-hot-toast';
import {
  createCategory,
  deleteCategory,
  createTag,
  deleteTag,
  saveAllClassifications,
  createRuleWithSynonym,
} from './actions';
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from '@hello-pangea/dnd';
import DryRunModal from '@/components/admin/DryRunModal';
import type { SyncPlan } from '@/app/api/admin/sync/dry-run/route';
import { ArrowPathIcon, BookOpenIcon } from '@heroicons/react/24/outline';

type CategoryWithChildren = Category & { children: CategoryWithChildren[] };
type Item = { id: string; name: string; color: string | null; code?: string };

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
  needsCode = false,
}: {
  onSave: (name: string, code: string, parentId: string | null) => void;
  onCancel: () => void;
  isPending: boolean;
  parentId?: string | null;
  needsCode?: boolean;
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && (!needsCode || code.trim())) {
      onSave(name.trim(), code.trim(), parentId);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 py-2">
      {' '}
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название..."
        className="w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
        disabled={isPending}
      />{' '}
      {needsCode && (
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Код (BE, KP)"
          className="w-1/2 rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
          disabled={isPending}
        />
      )}{' '}
      <button
        type="submit"
        disabled={isPending}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm text-white hover:bg-indigo-500"
      >
        ✓
      </button>{' '}
      <button
        type="button"
        onClick={onCancel}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-200 text-sm text-gray-700 hover:bg-gray-300"
      >
        ×
      </button>{' '}
    </form>
  );
};
const ItemRow = ({
  item,
  onUpdate,
  onDelete,
  isPending,
  isSystem = false,
  isCategory = false,
  children,
  level = 0,
}: {
  item: Item & { parentId?: string | null; order?: number };
  onUpdate: (id: string, data: Partial<Item>) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
  isSystem?: boolean;
  isCategory?: boolean;
  children?: React.ReactNode;
  level?: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [code, setCode] = useState(item.code || '');
  const levelClasses = [
    'font-semibold',
    'font-normal',
    'font-normal text-gray-600',
  ];
  const handleSave = () => {
    if (
      (name.trim() && name.trim() !== item.name) ||
      (code.trim() && code.trim() !== item.code)
    ) {
      onUpdate(item.id, { name: name.trim(), code: code.trim() });
    }
    setIsEditing(false);
  };
  return (
    <div
      className="group flex items-center justify-between border-b py-1.5"
      onDoubleClick={() => !isSystem && setIsEditing(true)}
    >
      {' '}
      <div className="flex flex-grow items-center gap-2">
        {' '}
        <ColorPicker
          color={item.color}
          onSave={(color) => onUpdate(item.id, { color })}
        />{' '}
        {isEditing ? (
          <div className="flex w-full items-center gap-2">
            {' '}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full rounded-md border px-2 py-1 text-sm"
              autoFocus
              disabled={isPending}
            />{' '}
            {isCategory && (
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Код"
                className="w-1/3 rounded-md border px-2 py-1 text-sm"
                disabled={isPending}
              />
            )}{' '}
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className={`text-sm ${levelClasses[level]}`}>
              {item.name}
            </span>
            {isCategory && (
              <span className="text-xs text-gray-400">{item.code}</span>
            )}
          </div>
        )}{' '}
      </div>{' '}
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
      </div>{' '}
    </div>
  );
};

export function ClassificationClient({
  initialCategories,
  initialTags,
}: {
  initialCategories: Category[];
  initialTags: Tag[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [tags, setTags] = useState(initialTags);
  const [addingToParent, setAddingToParent] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncPlan, setSyncPlan] = useState<SyncPlan | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
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

  const handleCheckSync = async (showLoadingToast = true) => {
    setIsChecking(true);
    if (showLoadingToast) {
      toast.loading('Анализ данных из "МойСклад"...', { id: 'dry-run' });
    }
    try {
      const response = await fetch('/api/admin/sync/dry-run', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при проверке');
      setSyncPlan(data.plan);
      if (!isModalOpen) setIsModalOpen(true);
      if (showLoadingToast) {
        toast.success('План синхронизации готов!', { id: 'dry-run' });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Неизвестная ошибка',
        { id: 'dry-run' },
      );
    } finally {
      setIsChecking(false);
    }
  };
  const handleAddToDictionaryFromModal = async (name: string, code: string) => {
    const result = await createRuleWithSynonym(code, name);
    if (result.success) {
      toast.success(`Правило "${name}" → ${code} добавлено в словарь!`);
      await handleCheckSync(false);
    } else {
      toast.error(result.error || 'Не удалось добавить правило.');
    }
    return { success: !!result.success };
  };
  const handleConfirmSync = (plan: SyncPlan) => {
    startTransition(async () => {
      setIsExecuting(true);
      toast.loading('Выполнение плана...', { id: 'execute-plan' });
      try {
        const response = await fetch('/api/admin/sync/execute-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || 'Ошибка при выполнении плана');
        toast.success(
          `Синхронизация завершена! Создано: ${data.created}, Обновлено: ${data.updated}.`,
          { id: 'execute-plan' },
        );
        setIsModalOpen(false);
        setSyncPlan(null);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Неизвестная ошибка',
          { id: 'execute-plan' },
        );
      } finally {
        setIsExecuting(false);
      }
    });
  };
  const handleCreateCategory = (
    name: string,
    code: string,
    parentId: string | null,
  ) => {
    startTransition(async () => {
      const result = await createCategory(name, code, parentId);
      if (result?.error) {
        toast.error(result.error);
      }
      setAddingToParent(null);
    });
  };
  const handleDeleteCategory = (id: string) => {
    startTransition(async () => {
      await deleteCategory(id);
    });
  };
  const handleCreateTag = (name: string) => {
    startTransition(async () => {
      const result = await createTag(name);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };
  const handleDeleteTag = (id: string) => {
    startTransition(async () => {
      await deleteTag(id);
    });
  };
  const updateCategoryState = (
    items: CategoryWithChildren[],
    id: string,
    data: Partial<Category>,
  ): CategoryWithChildren[] => {
    return items.map((item) => {
      if (item.id === id) {
        return { ...item, ...data };
      }
      if (item.children.length > 0) {
        return {
          ...item,
          children: updateCategoryState(item.children, id, data),
        };
      }
      return item;
    });
  };
  const updateTagState = (id: string, data: Partial<Tag>) => {
    setTags((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item)),
    );
    setIsDirty(true);
  };
  const onDragEnd: OnDragEndResponder = (result) => {
    const { source, destination, type } = result;
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
      items.flatMap((item) => {
        const { children, ...rest } = item;
        return [rest, ...flatten(children || [])];
      });
    const flatCategories = flatten(categories);
    startTransition(async () => {
      await saveAllClassifications(
        flatCategories.map((c, i) => ({ ...c, order: i })),
        tags.map((t, i) => ({ ...t, order: i })),
      );
      toast.success('Все изменения сохранены!');
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
        <Draggable key={cat.id} draggableId={cat.id} index={index}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              className="relative pl-4"
            >
              <div className="absolute left-0 top-0 h-full w-4 border-l border-gray-200"></div>
              <div className="absolute left-0 top-1/2 h-1/2 w-4 border-b border-gray-200"></div>
              <div className="flex items-center gap-1">
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab text-gray-300 hover:text-gray-500"
                >
                  <DragHandleIcon />
                </div>
                <div className="flex-grow">
                  <ItemRow
                    item={cat}
                    onUpdate={(id, data) => {
                      setCategories((prev) =>
                        updateCategoryState(prev, id, data),
                      );
                      setIsDirty(true);
                    }}
                    onDelete={handleDeleteCategory}
                    isPending={isPending}
                    isCategory={true}
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
              {addingToParent === cat.id && (
                <div className="pl-12">
                  <AddItemForm
                    parentId={cat.id}
                    onSave={handleCreateCategory}
                    onCancel={() => setAddingToParent(null)}
                    isPending={isPending}
                    needsCode={true}
                  />
                </div>
              )}
              {cat.children.length > 0 && (
                <CategoryTree items={cat.children} level={level + 1} />
              )}
            </div>
          )}
        </Draggable>
      ))}
    </>
  );

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleSaveAll}
            disabled={!isDirty || isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Сохранение...' : 'Сохранить все изменения'}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Категории
            </h2>
            <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 font-medium">Синхронизация с "МойСклад"</div>
              <p className="mb-4 text-xs text-gray-500">
                Проверьте данные из "МойСклад" и примените изменения. Система
                сравнит категории и покажет план действий.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleCheckSync()}
                  disabled={isChecking || isExecuting}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  {isChecking
                    ? 'Анализ...'
                    : 'Проверить актуальность по "МойСклад"'}
                </button>
                <Link
                  href="/admin/mappings"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <BookOpenIcon className="h-5 w-5" />
                  Словарь сайта Kyanchir
                </Link>
              </div>
            </div>
            <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 font-medium">Добавить новую категорию</div>
              {addingToParent === 'root' ? (
                <AddItemForm
                  parentId={null}
                  onSave={handleCreateCategory}
                  onCancel={() => setAddingToParent(null)}
                  isPending={isPending}
                  needsCode={true}
                />
              ) : (
                <button
                  onClick={() => setAddingToParent('root')}
                  className="w-full rounded-md border border-dashed bg-gray-50 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  + Создать новую категорию верхнего уровня
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
                          >
                            <div className="flex items-center gap-1">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab text-gray-300 hover:text-gray-500"
                              >
                                <DragHandleIcon />
                              </div>
                              <div className="flex-grow">
                                <ItemRow
                                  item={root}
                                  onUpdate={(id, data) => {
                                    setCategories((prev) =>
                                      updateCategoryState(prev, id, data),
                                    );
                                    setIsDirty(true);
                                  }}
                                  onDelete={handleDeleteCategory}
                                  isPending={isPending}
                                  isCategory={true}
                                  level={0}
                                >
                                  <button
                                    onClick={() => setAddingToParent(root.id)}
                                    className="text-sm font-semibold text-gray-500 hover:text-gray-800"
                                  >
                                    +
                                  </button>
                                </ItemRow>
                              </div>
                            </div>
                            {addingToParent === root.id && (
                              <div className="pl-6">
                                <AddItemForm
                                  parentId={root.id}
                                  onSave={handleCreateCategory}
                                  onCancel={() => setAddingToParent(null)}
                                  isPending={isPending}
                                  needsCode={true}
                                />
                              </div>
                            )}
                            {root.children.length > 0 && (
                              <CategoryTree items={root.children} level={1} />
                            )}
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
                onSave={(name, code) => handleCreateTag(name)}
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
                              onUpdate={updateTagState}
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
      <DryRunModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSync}
        onAddToDictionary={handleAddToDictionaryFromModal}
        plan={syncPlan}
        isExecuting={isExecuting}
      />
    </>
  );
}
