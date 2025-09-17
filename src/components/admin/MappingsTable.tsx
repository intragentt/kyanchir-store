// Местоположение: /src/components/admin/MappingsTable.tsx
'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { CategoryCodeMapping } from '@prisma/client';
import toast, { Toaster } from 'react-hot-toast';
import {
  createMapping,
  deleteMapping,
  updateMapping,
} from '@/app/admin/mappings/actions';

// --- НАЧАЛО НОВОГО, УМНОГО КОМПОНЕНТА СТРОКИ ---
function MappingRow({ mapping }: { mapping: CategoryCodeMapping }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  // Локальные состояния для полей ввода
  const [name, setName] = useState(mapping.categoryName);
  const [code, setCode] = useState(mapping.assignedCode);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    // Не отправляем запрос, если ничего не изменилось
    if (name === mapping.categoryName && code === mapping.assignedCode) {
      setIsEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await updateMapping(mapping.id, {
        categoryName: name,
        assignedCode: code,
      });
      if (result?.error) {
        toast.error(result.error);
        // Возвращаем старые значения в случае ошибки
        setName(mapping.categoryName);
        setCode(mapping.assignedCode);
      } else {
        toast.success('Правило обновлено!');
        router.refresh(); // Обновляем данные на всей странице
      }
      setIsEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMapping(mapping.id);
      toast.success('Правило удалено.');
      router.refresh();
    });
  };

  if (isEditing) {
    return (
      <tr>
        <td className="px-6 py-4">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            disabled={isPending}
          />
        </td>
        <td className="px-6 py-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            disabled={isPending}
          />
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
          <button
            onClick={() => setIsEditing(false)}
            disabled={isPending}
            className="text-gray-500 hover:text-gray-700"
          >
            Отмена
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr
      onDoubleClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-gray-50"
    >
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
        {mapping.categoryName}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {mapping.assignedCode}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-red-600 hover:text-red-900 disabled:opacity-50"
        >
          Удалить
        </button>
      </td>
    </tr>
  );
}
// --- КОНЕЦ КОМПОНЕНТА СТРОКИ ---

interface MappingsTableProps {
  mappings: CategoryCodeMapping[];
}

export default function MappingsTable({ mappings }: MappingsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categoryName, setCategoryName] = useState('');
  const [assignedCode, setAssignedCode] = useState('');

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !assignedCode.trim()) {
      toast.error('Название и код должны быть заполнены.');
      return;
    }

    startTransition(async () => {
      const result = await createMapping(categoryName, assignedCode);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Правило добавлено!');
        setCategoryName('');
        setAssignedCode('');
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold text-gray-800">
        Словарь Кодов Категорий
      </h1>
      <p className="text-sm text-gray-500">
        Кликните дважды на строку, чтобы редактировать правило.
      </p>

      <form
        onSubmit={handleAddMapping}
        className="rounded-lg border bg-white p-4 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold">Добавить новое правило</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Название категории (как в МойСклад)"
            className="rounded-md border-gray-300 shadow-sm"
            disabled={isPending}
          />
          <input
            value={assignedCode}
            onChange={(e) => setAssignedCode(e.target.value.toUpperCase())}
            placeholder="Присваиваемый код (напр., BE, KP2)"
            className="rounded-md border-gray-300 shadow-sm"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {isPending ? 'Добавление...' : '+ Добавить'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Название категории в МойСклад
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Присваиваемый Код
              </th>
              <th className="relative px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {mappings.map((mapping) => (
              <MappingRow key={mapping.id} mapping={mapping} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
