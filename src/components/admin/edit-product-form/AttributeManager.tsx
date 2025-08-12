// Местоположение: src/components/admin/edit-product-form/AttributeManager.tsx
'use client';

import { Attribute } from '@prisma/client';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import React, { useMemo, useState, useRef, useEffect } from 'react';

const AutoResizeTextarea = (
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [props.value]);
  return <textarea ref={textareaRef} {...props} />;
};

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
const CompositionInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (newValue: string) => void;
}) => {
  const { material, percentage } = useMemo(() => {
    const parts = value.split('—');
    const material = parts[0]?.trim() || '';
    const percentage = parts[1]?.replace('%', '').trim() || '';
    return { material, percentage };
  }, [value]);
  const handleChange = (newMaterial: string, newPercentage: string) => {
    const cleanPercentage = newPercentage.replace(/[^0-9]/g, '');
    if (newMaterial.trim() || cleanPercentage.trim()) {
      onChange(`${newMaterial.trim()} — ${cleanPercentage}%`);
    } else {
      onChange('');
    }
  };
  return (
    <div className="flex w-full items-center gap-x-2">
      <input
        type="text"
        value={material}
        onChange={(e) => handleChange(e.target.value, percentage)}
        placeholder="Материал"
        className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
      <span className="text-gray-500">—</span>
      <div className="relative w-24 flex-shrink-0">
        <input
          type="text"
          value={percentage}
          onChange={(e) => handleChange(material, e.target.value)}
          placeholder="0"
          className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 pr-6 text-center shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
          %
        </span>
      </div>
    </div>
  );
};

interface AttributeManagerProps {
  sku: string | null;
  setSku: (sku: string) => void;
  attributes: Attribute[];
  setAttributes: (attributes: Attribute[]) => void;
}
type UIAttribute = {
  id: string;
  key: string;
  isMain: boolean;
  values: { id: string; value: string }[];
};

const convertToUIAttributes = (
  prismaAttributes: Attribute[],
): UIAttribute[] => {
  const attributeMap: { [key: string]: UIAttribute } = {};
  prismaAttributes.forEach((attr) => {
    if (!attributeMap[attr.key]) {
      attributeMap[attr.key] = {
        id: `group_${attr.key || Date.now()}`,
        key: attr.key,
        isMain: attr.isMain,
        values: [],
      };
    }
    attributeMap[attr.key].values.push({ id: attr.id, value: attr.value });
  });
  return Object.values(attributeMap);
};
const convertFromUIAttributes = (uiAttributes: UIAttribute[]): Attribute[] => {
  const prismaAttributes: Attribute[] = [];
  uiAttributes.forEach((uiAttr) => {
    uiAttr.values.forEach((val) => {
      if (uiAttr.key.trim() === '' && val.value.trim() === '') return;
      prismaAttributes.push({
        id: val.id.startsWith('val_new_') ? '' : val.id,
        productId: '',
        key: uiAttr.key,
        value: val.value,
        isMain: uiAttr.isMain,
      });
    });
  });
  return prismaAttributes;
};

// VVV--- ИЗМЕНЕНИЕ: "Описание" удалено из системных атрибутов вкладки "О товаре" ---VVV
const SYSTEM_ATTRIBUTE_KEYS = ['Цвет', 'Состав, %'];

export default function AttributeManager({
  sku,
  setSku,
  attributes: prismaAttributes,
  setAttributes: setPrismaAttributes,
}: AttributeManagerProps) {
  // VVV--- ИЗМЕНЕНИЕ: Логика разделения усложняется, чтобы выделить все 4 типа атрибутов ---VVV
  const {
    systemAttributes,
    customAttributes,
    descriptionAttribute,
    articleAttribute,
  } = useMemo(() => {
    const allUIAttributes = convertToUIAttributes(prismaAttributes);

    const foundSystemAttributes = SYSTEM_ATTRIBUTE_KEYS.map((key) => {
      return (
        allUIAttributes.find((attr) => attr.key === key) || {
          id: `group_sys_${key}`,
          key,
          isMain: true,
          values: [{ id: `val_sys_${key}`, value: '' }],
        }
      );
    }).filter(Boolean) as UIAttribute[];

    const foundDescriptionAttribute = allUIAttributes.find(
      (attr) => attr.key === 'Описание',
    ) || {
      id: 'group_sys_Описание',
      key: 'Описание',
      isMain: true,
      values: [{ id: 'val_sys_Описание', value: '' }],
    };

    const foundCustomAttributes = allUIAttributes.filter(
      (attr) =>
        !SYSTEM_ATTRIBUTE_KEYS.includes(attr.key) &&
        attr.key !== 'Описание' &&
        attr.key.toLowerCase() !== 'артикул',
    );

    const foundArticleAttribute = allUIAttributes.find(
      (attr) => attr.key.toLowerCase() === 'артикул',
    );

    return {
      systemAttributes: foundSystemAttributes,
      customAttributes: foundCustomAttributes,
      descriptionAttribute: foundDescriptionAttribute,
      articleAttribute: foundArticleAttribute,
    };
  }, [prismaAttributes]);

  const [customArticle, setCustomArticle] = useState(
    articleAttribute?.values[0]?.value || '',
  );

  const updatePrismaState = (
    newCustomAttributes: UIAttribute[],
    newSystemAttributes: UIAttribute[] = systemAttributes,
    newDescriptionAttribute: UIAttribute = descriptionAttribute,
  ) => {
    const finalAttributes = [
      ...newSystemAttributes,
      newDescriptionAttribute,
      ...newCustomAttributes,
    ];
    const existingArticleIndex = finalAttributes.findIndex(
      (a) => a.key.toLowerCase() === 'артикул',
    );
    if (existingArticleIndex > -1) {
      finalAttributes[existingArticleIndex].values = [
        {
          id:
            finalAttributes[existingArticleIndex].values[0]?.id ||
            'val_new_article',
          value: customArticle,
        },
      ];
    } else if (customArticle) {
      finalAttributes.push({
        id: 'group_артикул',
        key: 'Артикул',
        isMain: true,
        values: [{ id: 'val_new_article', value: customArticle }],
      });
    }
    setPrismaAttributes(convertFromUIAttributes(finalAttributes));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(customAttributes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    updatePrismaState(items);
  };

  // Функции для пользовательских атрибутов
  const handleCustomKeyChange = (groupIndex: number, newKey: string) => {
    const newAttrs = [...customAttributes];
    newAttrs[groupIndex].key = newKey;
    updatePrismaState(newAttrs);
  };
  const handleCustomValueChange = (
    groupIndex: number,
    valueIndex: number,
    newValue: string,
  ) => {
    const newAttrs = [...customAttributes];
    newAttrs[groupIndex].values[valueIndex].value = newValue;
    updatePrismaState(newAttrs);
  };
  const handleCustomIsMainChange = (groupIndex: number, newIsMain: boolean) => {
    const newAttrs = [...customAttributes];
    newAttrs[groupIndex].isMain = newIsMain;
    updatePrismaState(newAttrs);
  };
  const addCustomAttributeGroup = () => {
    const newGroup: UIAttribute = {
      id: `group_new_${Date.now()}`,
      key: '',
      isMain: false,
      values: [{ id: `val_new_${Date.now()}`, value: '' }],
    };
    updatePrismaState([...customAttributes, newGroup]);
  };
  const removeCustomAttributeGroup = (groupIndex: number) => {
    const newAttrs = customAttributes.filter(
      (_, index) => index !== groupIndex,
    );
    updatePrismaState(newAttrs);
  };
  const addCustomValue = (groupIndex: number) => {
    const newAttrs = [...customAttributes];
    newAttrs[groupIndex].values.push({
      id: `val_new_${Date.now()}`,
      value: '',
    });
    updatePrismaState(newAttrs);
  };
  const removeCustomValue = (groupIndex: number, valueIdToRemove: string) => {
    const newAttrs = [...customAttributes];
    newAttrs[groupIndex].values = newAttrs[groupIndex].values.filter(
      (val) => val.id !== valueIdToRemove,
    );
    if (newAttrs[groupIndex].values.length === 0) {
      removeCustomAttributeGroup(groupIndex);
    } else {
      updatePrismaState(newAttrs);
    }
  };

  // Функции для системных атрибутов ("Цвет", "Состав")
  const handleSystemValueChange = (
    groupIndex: number,
    valueIndex: number,
    newValue: string,
  ) => {
    const newAttrs = [...systemAttributes];
    newAttrs[groupIndex].values[valueIndex].value = newValue;
    updatePrismaState(customAttributes, newAttrs, descriptionAttribute);
  };
  const addSystemValue = (groupIndex: number) => {
    const newAttrs = [...systemAttributes];
    newAttrs[groupIndex].values.push({
      id: `val_new_${Date.now()}`,
      value: '',
    });
    updatePrismaState(customAttributes, newAttrs, descriptionAttribute);
  };
  const removeSystemValue = (groupIndex: number, valueIdToRemove: string) => {
    const newAttrs = [...systemAttributes];
    newAttrs[groupIndex].values = newAttrs[groupIndex].values.filter(
      (val) => val.id !== valueIdToRemove,
    );
    updatePrismaState(customAttributes, newAttrs, descriptionAttribute);
  };

  // Функция для Описания
  const handleDescriptionChange = (newValue: string) => {
    const newDescAttr = {
      ...descriptionAttribute,
      values: [{ ...descriptionAttribute.values[0], value: newValue }],
    };
    updatePrismaState(customAttributes, systemAttributes, newDescAttr);
  };

  const handleSaveAsTemplate = (attributeGroup: UIAttribute) => {
    console.log('Сохранить как шаблон:', attributeGroup);
  };
  const handleAddFromTemplate = () => {
    console.log('Добавить из шаблона');
  };
  const generateSku = () => {
    const newSku = `KYA-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setSku(newSku);
  };

  return (
    // VVV--- ИЗМЕНЕНИЕ: Компонент теперь возвращает React.Fragment с тремя независимыми блоками ---VVV
    <>
      {/* --- БЛОК 1: "О ТОВАРЕ" --- */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-800">О товаре</div>
        </div>
        <div className="mt-4 space-y-6">
          {systemAttributes.map((group, groupIndex) => (
            <div key={group.id} className="flex items-start gap-x-4">
              <div className="flex-shrink-0 pt-5 text-center">
                <span className="text-lg font-bold text-gray-300">
                  {groupIndex + 1}
                </span>
              </div>
              <div className="flex-grow space-y-2 rounded-md bg-gray-50/50">
                <label className="block text-sm font-medium text-gray-600">
                  {group.key}
                </label>
                {group.values.map((val, valueIndex) => (
                  <div key={val.id} className="flex items-center space-x-2">
                    {group.key === 'Состав, %' ? (
                      <CompositionInput
                        value={val.value}
                        onChange={(newValue) =>
                          handleSystemValueChange(
                            groupIndex,
                            valueIndex,
                            newValue,
                          )
                        }
                      />
                    ) : (
                      <input
                        type="text"
                        value={val.value}
                        onChange={(e) =>
                          handleSystemValueChange(
                            groupIndex,
                            valueIndex,
                            e.target.value,
                          )
                        }
                        placeholder="Введите значение"
                        className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    )}
                    {group.values.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSystemValue(groupIndex, val.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSystemValue(groupIndex)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  + Добавить значение
                </button>
              </div>
            </div>
          ))}
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="attributes">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="mt-4 space-y-6"
              >
                {customAttributes.map((group, groupIndex) => (
                  <Draggable
                    key={group.id}
                    draggableId={group.id}
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
                              value={group.key}
                              onChange={(e) =>
                                handleCustomKeyChange(
                                  groupIndex,
                                  e.target.value,
                                )
                              }
                              placeholder="Например, Уход"
                              className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="mb-1 block text-sm font-medium text-gray-600">
                              Значения
                            </label>
                            {group.values.map((val, valueIndex) => (
                              <div
                                key={val.id}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="text"
                                  value={val.value}
                                  onChange={(e) =>
                                    handleCustomValueChange(
                                      groupIndex,
                                      valueIndex,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Например, Ручная стирка"
                                  className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {group.values.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeCustomValue(groupIndex, val.id)
                                    }
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            {
                              <button
                                type="button"
                                onClick={() => addCustomValue(groupIndex)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                              >
                                + Добавить значение
                              </button>
                            }
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <ToggleSwitch
                              enabled={group.isMain}
                              setEnabled={(value) =>
                                handleCustomIsMainChange(groupIndex, value)
                              }
                              labelOff='Прятать в "О товаре"'
                              labelOn="Отображать всегда"
                            />
                            <div className="flex items-center gap-x-4">
                              <button
                                type="button"
                                onClick={() => handleSaveAsTemplate(group)}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                              >
                                Сохранить как шаблон
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  removeCustomAttributeGroup(groupIndex)
                                }
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
            onClick={addCustomAttributeGroup}
            className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            + Добавить атрибут
          </button>
          <button
            type="button"
            onClick={handleAddFromTemplate}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Добавить из шаблона
          </button>
        </div>
      </div>

      {/* --- БЛОК 2: ОПИСАНИЕ --- */}
      <div className="rounded-lg border bg-white p-6">
        <label className="mb-4 block text-lg font-semibold text-gray-800">
          Описание
        </label>
        <AutoResizeTextarea
          value={descriptionAttribute.values[0].value}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Введите подробное описание..."
          className="user-select-text block min-h-[120px] w-full resize-none overflow-hidden rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {/* --- БЛОК 3: АРТИКУЛ --- */}
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
                  onClick={generateSku}
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
              onChange={(e) => setCustomArticle(e.target.value)}
              onBlur={() =>
                updatePrismaState(
                  customAttributes,
                  systemAttributes,
                  descriptionAttribute,
                )
              }
              placeholder="Например, KYANCHIR/SET/001"
              className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </>
  );
}
