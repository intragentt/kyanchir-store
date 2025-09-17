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

interface MappingsTableProps {
  mappings: CategoryCodeMapping[];
}

export default function MappingsTable({ mappings }: MappingsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categoryName, setCategoryName] = useState('');
  const [assignedCode, setAssignedCode] = useState('');

  // --- НАЧАЛО НОВОЙ АРХИТЕКТУРЫ: Единый "Пульт Управления" ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Автофокус на инпут при переключении в режим редактирования
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const handleStartEdit = (mapping: CategoryCodeMapping) => {
    setEditingId(mapping.id);
    setEditName(mapping.categoryName);
    setEditCode(mapping.assignedCode);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id: string) => {
    // Если данные не изменились, просто выходим из режима редактирования
    const originalMapping = mappings.find((m) => m.id === id);
    if (
      originalMapping &&
      originalMapping.categoryName === editName &&
      originalMapping.assignedCode === editCode
    ) {
      setEditingId(null);
      return;
    }

    startTransition(async () => {
      const result = await updateMapping(id, {
        categoryName: editName,
        assignedCode: editCode,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Правило обновлено!');
        router.refresh();
      }
      setEditingId(null);
    });
  };
  // --- КОНЕЦ НОВОЙ АРХИТЕКТУРЫ ---

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

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteMapping(id);
      toast.success('Правило удалено.');
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold text-gray-800">
        Словарь Кодов Категорий
      </h1>
      <p className="text-sm text-gray-500">
        Нажмите "Изменить", чтобы редактировать правило.
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
              <th className="relative w-48 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {mappings.map((mapping) => (
              <tr key={mapping.id}>
                {editingId === mapping.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        ref={inputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleSaveEdit(mapping.id)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm"
                        disabled={isPending}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        value={editCode}
                        onChange={(e) =>
                          setEditCode(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleSaveEdit(mapping.id)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm"
                        disabled={isPending}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-x-4">
                        <button
                          onClick={() => handleSaveEdit(mapping.id)}
                          disabled={isPending}
                          className="font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isPending}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Отмена
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {mapping.categoryName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {mapping.assignedCode}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-x-4">
                        <button
                          onClick={() => handleStartEdit(mapping)}
                          disabled={isPending}
                          className="font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => handleDelete(mapping.id)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
