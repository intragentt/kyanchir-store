// Местоположение: src/components/admin/edit-product-form/DetailManager.tsx
'use client';

import { AlternativeName } from '@prisma/client';
import { Dispatch, SetStateAction } from 'react';

interface DetailManagerProps {
  name: string;
  setName: (name: string) => void;
  alternativeNames: AlternativeName[];
  setAlternativeNames: Dispatch<SetStateAction<AlternativeName[]>>;
}

export default function DetailManager({
  name,
  setName,
  alternativeNames,
  setAlternativeNames,
}: DetailManagerProps) {
  const handleAltNameChange = (index: number, value: string) => {
    const newAltNames = [...alternativeNames];
    newAltNames[index].value = value;
    setAlternativeNames(newAltNames);
  };

  const addAltName = () => {
    const newAltName: AlternativeName = {
      id: `new_${Date.now()}`,
      value: '',
      productId: '',
    };
    setAlternativeNames([...alternativeNames, newAltName]);
  };

  const removeAltName = (idToRemove: string) => {
    setAlternativeNames(
      alternativeNames.filter((name) => name.id !== idToRemove),
    );
  };

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="space-y-4">
        {/* VVV--- ИЗМЕНЕНИЕ: Добавлен главный заголовок и изменен лейбл основного названия ---VVV */}
        <div className="text-lg font-semibold text-gray-800">
          Название товара
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Основное название
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="user-select-text block w-full rounded-md border-gray-300 bg-gray-50 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {alternativeNames.map((altName, index) => (
          <div key={altName.id}>
            <label
              htmlFor={`alt-name-${altName.id}`}
              className="block text-sm font-medium text-gray-500"
            >
              Альтернативное название
            </label>
            <div className="mt-1 flex items-center space-x-2">
              <input
                id={`alt-name-${altName.id}`}
                type="text"
                value={altName.value}
                onChange={(e) => handleAltNameChange(index, e.target.value)}
                className="user-select-text block w-full rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => removeAltName(altName.id)}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        <div>
          <button
            type="button"
            onClick={addAltName}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            + Добавить альтернативное название
          </button>
        </div>
      </div>
    </div>
  );
}
