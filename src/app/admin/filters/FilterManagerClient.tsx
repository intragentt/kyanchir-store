// Местоположение: src/components/admin/filters/FilterManagerClient.tsx
'use client';

import { useState } from 'react';
import type { Category, FilterPreset, Prisma } from '@prisma/client';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// ИСПРАВЛЕНО: Устранена опечатка в имени библиотеки. Было "@d-kit/core", стало "@dnd-kit/core".
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCategoryItem } from './SortableCategoryItem';

type PresetWithItems = Prisma.FilterPresetGetPayload<{
  include: {
    items: {
      include: {
        category: true;
      };
    };
  };
}>;

export type ManagedCategory = {
  id: string;
  name: string;
  isActive: boolean;
};

interface FilterManagerProps {
  preset: PresetWithItems;
  allCategories: Category[];
}

export default function FilterManagerClient({
  preset,
  allCategories,
}: FilterManagerProps) {
  const [activeItems, setActiveItems] = useState<ManagedCategory[]>(() =>
    preset.items
      .filter((item) => item.category)
      .map((item) => ({
        id: item.category!.id,
        name: item.category!.name,
        isActive: true,
      })),
  );

  const [inactiveItems, setInactiveItems] = useState<ManagedCategory[]>(() => {
    const activeCategoryIds = new Set(
      preset.items.map((item) => item.categoryId),
    );
    return allCategories
      .filter((cat) => !activeCategoryIds.has(cat.id))
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        isActive: false,
      }));
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setActiveItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        setIsDirty(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleToggle = (categoryId: string) => {
    const itemInInactive = inactiveItems.find((item) => item.id === categoryId);
    if (itemInInactive) {
      setInactiveItems(inactiveItems.filter((item) => item.id !== categoryId));
      setActiveItems([...activeItems, { ...itemInInactive, isActive: true }]);
    } else {
      const itemInActive = activeItems.find((item) => item.id === categoryId);
      if (itemInActive) {
        setActiveItems(activeItems.filter((item) => item.id !== categoryId));
        setInactiveItems(
          [...inactiveItems, { ...itemInActive, isActive: false }].sort(
            (a, b) => a.name.localeCompare(b.name),
          ),
        );
      }
    }
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      presetId: preset.id,
      items: activeItems.map((item, index) => ({
        categoryId: item.id,
        order: index,
      })),
    };

    try {
      const response = await fetch('/api/admin/filters/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Ошибка при сохранении. Попробуйте еще раз.');
      }
      setIsDirty(false);
      alert('Фильтр успешно сохранен!');
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Фильтр категорий на главной</h2>
          <p className="text-sm text-gray-500">
            Перетащите активные категории, чтобы изменить их порядок.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-md mb-4 font-semibold text-gray-800">
            Активные категории ({activeItems.length})
          </h3>
          <div className="flex min-h-[200px] flex-col gap-2 rounded-md border p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeItems}
                strategy={verticalListSortingStrategy}
              >
                {activeItems.map((item) => (
                  <SortableCategoryItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {activeItems.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                Нет активных категорий
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-md mb-4 font-semibold text-gray-800">
            Неактивные категории ({inactiveItems.length})
          </h3>
          <div className="flex min-h-[200px] flex-col gap-2 rounded-md border p-4">
            {inactiveItems.map((item) => (
              <SortableCategoryItem
                key={item.id}
                item={item}
                onToggle={handleToggle}
                isSortable={false}
              />
            ))}
            {inactiveItems.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                Все категории активны
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
