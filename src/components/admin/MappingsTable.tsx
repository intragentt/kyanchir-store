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

// --- НАЧАЛО ИЗМЕНЕНИЙ: Умная строка, управляемая извне ---
function MappingRow({
  mapping,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
}: {
  mapping: CategoryCodeMapping;
  isEditing: boolean;
  onStartEdit: (id: string, initialName: string, initialCode: string) => void;
  onCancelEdit: () => void;
  onSave: (id: string, newName: string, newCode: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter(); // router теперь нужен только для удаления

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMapping(mapping.id);
      toast.success('Правило удалено.');
      router.refresh();
    });
  };

  if (isEditing) {
    // В режиме редактирования строка не управляет своим состоянием,
    // она просто вызывает функции, переданные от родителя.
    return null; // Рендеринг редактируемой строки теперь в родителе
  }

  return (
    <tr>
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
        {mapping.categoryName}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {mapping.assignedCode}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-x-4">
          <button
            onClick={() =>
              onStartEdit(
                mapping.id,
                mapping.categoryName,
                mapping.assignedCode,
              )
            }
            className="font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Изменить
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-600 hover:text-red-900 disabled:opacity-50"
          >
            Удалить
          </button>
        </div>
      </td>
    </tr>
  );
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function MappingsTable({
  mappings,
}: {
  mappings: CategoryCodeMapping[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categoryName, setCategoryName] = useState('');
  const [assignedCode, setAssignedCode] = useState('');

  // --- НАЧАЛО ИЗМЕНЕНИЙ: "Центральный Диспетчер" ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) {
      inputRef.current?.focus();
    }
  }, [editingId]);

  const handleStartEdit = (
    id: string,
    initialName: string,
    initialCode: string,
  ) => {
    setEditingId(id);
    setEditName(initialName);
    setEditCode(initialCode);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = (id: string, newName: string, newCode: string) => {
    startTransition(async () => {
      const result = await updateMapping(id, {
        categoryName: newName,
        assignedCode: newCode,
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
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
        Нажмите "Изменить", чтобы редактировать правило.
      </p>

      {/* ... (Форма добавления без изменений) ... */}
      <form
        onSubmit={handleAddMapping}
        className="rounded-lg border bg-white p-4 shadow-sm"
      >
        {/* ... */}
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
            {mappings.map((mapping) =>
              editingId === mapping.id ? (
                // --- Рендерим инпуты прямо здесь, в родителе ---
                <tr key={mapping.id}>
                  <td className="px-6 py-4">
                    <input
                      ref={inputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
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
                      className="w-full rounded-md border-gray-300 shadow-sm"
                      disabled={isPending}
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-x-4">
                      <button
                        onClick={() =>
                          handleSave(mapping.id, editName, editCode)
                        }
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
                </tr>
              ) : (
                <MappingRow
                  key={mapping.id}
                  mapping={mapping}
                  isEditing={false}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSave={handleSave}
                />
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
