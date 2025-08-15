// Местоположение: src/components/admin/edit-product-form/AboutProductManager.tsx
'use client';

import { Attribute } from '@prisma/client';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import React, { useMemo, useState, useEffect } from 'react';

// --- СТАРЫЙ ToggleSwitch ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ ---
const ToggleSwitch = ({
  enabled,
  setEnabled,
  labelOff,
  labelOn,
}: {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  labelOff: string;
  labelOn: string;
}) => {
  return (
    <div className="flex items-center">
      <span
        className={`mr-3 text-sm font-medium ${enabled ? 'text-gray-400' : 'text-gray-900'}`}
      >
        {labelOff}
      </span>
      <button
        type="button"
        className={`${enabled ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none`}
        onClick={() => setEnabled(!enabled)}
      >
        <span
          className={`${enabled ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
      <span
        className={`ml-3 text-sm font-medium ${enabled ? 'text-gray-900' : 'text-gray-400'}`}
      >
        {labelOn}
      </span>
    </div>
  );
};

// --- VVV--- НОВЫЙ, МОЩНЫЙ КОМПОНЕНТ ДЛЯ УПРАВЛЕНИЯ СОСТАВОМ ---VVV ---
interface CompositionItem {
  id: number;
  material: string;
  percentage: string;
}

const CompositionManager = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (newValue: string) => void;
}) => {
  const [items, setItems] = useState<CompositionItem[]>([]);

  // При первом рендере и при изменении value извне, парсим JSON-строку
  useEffect(() => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setItems(parsed.map((p, i) => ({ ...p, id: i })));
      } else {
        // Если значение пустое или некорректное, начинаем с одной пустой строки
        setItems([{ id: 0, material: '', percentage: '' }]);
      }
    } catch (e) {
      setItems([{ id: 0, material: '', percentage: '' }]);
    }
  }, [value]);

  const notifyParent = (updatedItems: CompositionItem[]) => {
    // Убираем временный id перед сохранением
    const itemsToSave = updatedItems.map(({ id, ...rest }) => rest);
    onChange(JSON.stringify(itemsToSave));
  };

  const handleItemChange = (
    index: number,
    field: 'material' | 'percentage',
    fieldValue: string,
  ) => {
    const newItems = [...items];
    if (field === 'percentage') {
      fieldValue = fieldValue.replace(/[^0-9]/g, ''); // Разрешаем вводить только цифры
    }
    newItems[index][field] = fieldValue;
    setItems(newItems);
    notifyParent(newItems);
  };

  const addItem = () => {
    const newItems = [
      ...items,
      { id: Date.now(), material: '', percentage: '' },
    ];
    setItems(newItems);
    notifyParent(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    notifyParent(newItems);
  };

  return (
    <div className="w-full space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="flex w-full items-center gap-x-2">
          <input
            type="text"
            value={item.material}
            onChange={(e) =>
              handleItemChange(index, 'material', e.target.value)
            }
            placeholder="Материал"
            className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <span className="text-gray-500">—</span>
          <div className="relative w-24 flex-shrink-0">
            <input
              type="text"
              value={item.percentage}
              onChange={(e) =>
                handleItemChange(index, 'percentage', e.target.value)
              }
              placeholder="0"
              className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 pr-6 text-center shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
              %
            </span>
          </div>
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="flex-shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
      >
        + Добавить материал
      </button>
    </div>
  );
};

interface AboutProductManagerProps {
  systemAttributes: Attribute[];
  customAttributes: Attribute[];
  onAttributeChange: (
    id: string,
    newKey: string,
    newValue: string,
    newIsMain?: boolean,
  ) => void;
  onDragEnd: (result: DropResult) => void;
  onSaveAsTemplate: (attribute: Attribute) => void;
  onRemoveCustomGroup: (id: string) => void;
  onAddCustomGroup: () => void;
  onAddFromTemplate: () => void;
}

export default function AboutProductManager({
  systemAttributes,
  customAttributes,
  onAttributeChange,
  onDragEnd,
  onSaveAsTemplate,
  onRemoveCustomGroup,
  onAddCustomGroup,
  onAddFromTemplate,
}: AboutProductManagerProps) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="text-lg font-semibold text-gray-800">О товаре</div>

      <div className="mt-4 space-y-6">
        {systemAttributes.map((attr, groupIndex) => (
          <div key={attr.id} className="flex items-start gap-x-4">
            <div className="flex-shrink-0 pt-2 text-center">
              <span className="text-lg font-bold text-gray-300">
                {groupIndex + 1}
              </span>
            </div>
            <div className="flex-grow space-y-2">
              <label className="block text-sm font-medium text-gray-600">
                {attr.key}
              </label>
              <div className="flex items-center space-x-2">
                {/* VVV--- ИСПОЛЬЗУЕМ НАШ НОВЫЙ КОМПОНЕНТ ВМЕСТО СТАРОГО ---VVV */}
                {attr.key === 'Состав, %' ? (
                  <CompositionManager
                    value={attr.value}
                    onChange={(newValue) =>
                      onAttributeChange(
                        attr.id,
                        attr.key,
                        newValue,
                        attr.isMain,
                      )
                    }
                  />
                ) : (
                  <input
                    type="text"
                    value={attr.value}
                    onChange={(e) =>
                      onAttributeChange(
                        attr.id,
                        attr.key,
                        e.target.value,
                        attr.isMain,
                      )
                    }
                    placeholder="Введите значение"
                    className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* ... остальной код для кастомных атрибутов без изменений ... */}
        <Droppable droppableId="attributes">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="mt-4 space-y-6"
            >
              {customAttributes.map((attr, groupIndex) => (
                <Draggable
                  key={attr.id}
                  draggableId={attr.id}
                  index={groupIndex}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-start gap-x-4"
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="flex-shrink-0 cursor-grab pt-5 text-center"
                      >
                        <span className="text-lg font-bold text-gray-400">
                          {systemAttributes.length + groupIndex + 1}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mx-auto mt-1 h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                      <div className="flex-grow space-y-4 rounded-md border border-gray-200 p-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-600">
                            Название атрибута
                          </label>
                          <input
                            type="text"
                            value={attr.key}
                            onChange={(e) =>
                              onAttributeChange(
                                attr.id,
                                e.target.value,
                                attr.value,
                                attr.isMain,
                              )
                            }
                            placeholder="Например, Уход"
                            className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="mb-1 block text-sm font-medium text-gray-600">
                            Значение
                          </label>
                          <input
                            type="text"
                            value={attr.value}
                            onChange={(e) =>
                              onAttributeChange(
                                attr.id,
                                attr.key,
                                e.target.value,
                                attr.isMain,
                              )
                            }
                            placeholder="Например, Ручная стирка"
                            className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <ToggleSwitch
                            enabled={attr.isMain}
                            setEnabled={(value) =>
                              onAttributeChange(
                                attr.id,
                                attr.key,
                                attr.value,
                                value,
                              )
                            }
                            labelOff='Прятать в "О товаре"'
                            labelOn="Отображать всегда"
                          />
                          <div className="flex items-center gap-x-4">
                            <button
                              type="button"
                              onClick={() => onSaveAsTemplate(attr)}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              Сохранить как шаблон
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveCustomGroup(attr.id)}
                              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <div className="mt-6 flex items-center gap-x-4">
        <button
          type="button"
          onClick={onAddCustomGroup}
          className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          + Добавить атрибут
        </button>
        <button
          type="button"
          onClick={onAddFromTemplate}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Добавить из шаблона
        </button>
      </div>
    </div>
  );
}
