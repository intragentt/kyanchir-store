// Местоположение: /src/components/admin/MappingsTable.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { CodeRule, CategorySynonym } from '@prisma/client';
import toast, { Toaster } from 'react-hot-toast';
import {
  createRuleWithSynonym,
  deleteRule,
  deleteSynonym,
  addSynonymToRule,
} from '@/app/admin/mappings/actions';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

// Определяем новый тип для пропсов
interface CodeRuleWithSynonyms extends CodeRule {
  synonyms: CategorySynonym[];
}

interface MappingsTableProps {
  mappings: CodeRuleWithSynonyms[];
}

export default function MappingsTable({ mappings }: MappingsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Состояние для формы создания нового правила
  const [newSynonymName, setNewSynonymName] = useState('');
  const [newAssignedCode, setNewAssignedCode] = useState('');

  // Состояние для inline-добавления синонима к существующему правилу
  const [addingToRuleId, setAddingToRuleId] = useState<string | null>(null);
  const [synonymText, setSynonymText] = useState('');

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSynonymName.trim() || !newAssignedCode.trim()) {
      toast.error('Код и синоним должны быть заполнены.');
      return;
    }
    startTransition(async () => {
      const result = await createRuleWithSynonym(
        newAssignedCode,
        newSynonymName,
      );
      if (!result.success) {
        toast.error(result.error!); // Используем ! т.к. при !success error всегда будет
      } else {
        toast.success('Правило добавлено!');
        setNewSynonymName('');
        setNewAssignedCode('');
        router.refresh();
      }
    });
  };

  const handleDeleteRule = (id: string) => {
    startTransition(async () => {
      const result = await deleteRule(id);
      if (!result.success) {
        toast.error(result.error!);
      } else {
        toast.success('Правило и все его синонимы удалены.');
        router.refresh();
      }
    });
  };

  const handleDeleteSynonym = (id: string) => {
    startTransition(async () => {
      const result = await deleteSynonym(id);
      if (!result.success) {
        toast.error(result.error!);
      } else {
        toast.success('Синоним удален.');
        router.refresh();
      }
    });
  };

  const handleAddSynonym = (ruleId: string) => {
    if (!synonymText.trim()) {
      setAddingToRuleId(null);
      return;
    }
    startTransition(async () => {
      const result = await addSynonymToRule(ruleId, synonymText);
      if (!result.success) {
        toast.error(result.error!);
      } else {
        toast.success('Синоним добавлен!');
        setAddingToRuleId(null);
        setSynonymText('');
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
        Сгруппируйте разные названия категорий из "МойСклад" под одним кодом.
      </p>

      {/* Форма создания нового правила */}
      <form
        onSubmit={handleCreateRule}
        className="rounded-lg border bg-white p-4 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold">
          Добавить новое правило и первый синоним
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            value={newSynonymName}
            onChange={(e) => setNewSynonymName(e.target.value)}
            placeholder="Название категории (как в МойСклад)"
            className="rounded-md border-gray-300 shadow-sm"
            disabled={isPending}
          />
          <input
            value={newAssignedCode}
            onChange={(e) => setNewAssignedCode(e.target.value.toUpperCase())}
            placeholder="Присваиваемый код (напр., BE, KP2)"
            className="rounded-md border-gray-300 shadow-sm"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {isPending ? 'Добавление...' : '+ Добавить правило'}
          </button>
        </div>
      </form>

      {/* Таблица с правилами и синонимами */}
      <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Присвоенный Код
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Синонимы (Названия из МойСклад)
              </th>
              <th className="relative w-40 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {mappings.map((rule) => (
              <tr key={rule.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                  {rule.assignedCode}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {rule.synonyms.map((synonym) => (
                      <span
                        key={synonym.id}
                        className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                      >
                        {synonym.name}
                        <button
                          onClick={() => handleDeleteSynonym(synonym.id)}
                          disabled={isPending}
                          className="ml-2 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {/* Поле для добавления нового синонима */}
                    {addingToRuleId === rule.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={synonymText}
                          onChange={(e) => setSynonymText(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleAddSynonym(rule.id)
                          }
                          className="rounded-md border-gray-300 py-1 text-sm shadow-sm"
                          placeholder="Новый синоним"
                          disabled={isPending}
                        />
                        <button
                          onClick={() => handleAddSynonym(rule.id)}
                          disabled={isPending}
                          className="rounded-md bg-green-600 px-3 py-1 text-white hover:bg-green-500"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setAddingToRuleId(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingToRuleId(rule.id);
                          setSynonymText('');
                        }}
                        disabled={isPending}
                        className="flex items-center gap-1 rounded-full border border-dashed border-gray-400 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Добавить
                      </button>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={isPending}
                    className="flex items-center gap-1 text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Удалить правило
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
