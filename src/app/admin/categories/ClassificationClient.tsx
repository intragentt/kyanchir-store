// Местоположение: src/app/admin/categories/ClassificationClient.tsx
'use client';

import { useState, useTransition, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Category, Tag, CodeRule } from '@prisma/client';
import toast from 'react-hot-toast';
import {
  createCategory,
  deleteCategory,
  createTag,
  deleteTag,
  saveAllClassifications,
  createRuleWithSynonym,
  addSynonymToRule,
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

const DragHandleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="6" r="1.5" fill="currentColor" /><circle cx="10" cy="12" r="1.5" fill="currentColor" /><circle cx="10" cy="18" r="1.5" fill="currentColor" /><circle cx="14" cy="6" r="1.5" fill="currentColor" /><circle cx="14" cy="12" r="1.5" fill="currentColor" /><circle cx="14" cy="18" r="1.5" fill="currentColor" /></svg> );
const ColorPicker = ({ color, onSave }: { color: string | null; onSave: (color: string) => void; }) => ( <div className="relative h-5 w-5 rounded-full" style={{ backgroundColor: color || '#E5E7EB' }}><input type="color" value={color || '#E5E7EB'} onChange={(e) => onSave(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" /></div> );
const AddItemForm = ({ onSave, onCancel, isPending, parentId = null, needsCode = false, }: { onSave: (name: string, code: string, parentId: string | null) => void; onCancel: () => void; isPending: boolean; parentId?: string | null; needsCode?: boolean; }) => { const [name, setName] = useState(''); const [code, setCode] = useState(''); const inputRef = useRef<HTMLInputElement>(null); useEffect(() => { inputRef.current?.focus(); }, []); const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (name.trim() && (!needsCode || code.trim())) { onSave(name.trim(), code.trim(), parentId); } }; return ( <form onSubmit={handleSubmit} className="flex items-center gap-2 py-2"> <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="Название..." className="w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500" disabled={isPending}/> {needsCode && (<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Код (BE, KP)" className="w-1/2 rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500" disabled={isPending} />)} <button type="submit" disabled={isPending} className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm text-white hover:bg-indigo-500">✓</button> <button type="button" onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-200 text-sm text-gray-700 hover:bg-gray-300">×</button> </form> ); };
const ItemRow = ({ item, onUpdate, onDelete, isPending, isSystem = false, isCategory = false, children, level = 0, mainFilterConfig, }: { item: Item & { parentId?: string | null; order?: number }; onUpdate: (id: string, data: Partial<Item>) => void; onDelete: (id: string) => void; isPending: boolean; isSystem?: boolean; isCategory?: boolean; children?: React.ReactNode; level?: number; mainFilterConfig?: { checked: boolean; disabled?: boolean; onToggle: () => void }; }) => { const [isEditing, setIsEditing] = useState(false); const [name, setName] = useState(item.name); const [code, setCode] = useState(item.code || ''); const levelClasses = ['font-semibold', 'font-normal', 'font-normal text-gray-600']; const handleSave = () => { if ((name.trim() && name.trim() !== item.name) || (code.trim() && code.trim() !== item.code)) { onUpdate(item.id, { name: name.trim(), code: code.trim() }); } setIsEditing(false); }; const handleToggleMainFilter = () => { if (mainFilterConfig && !mainFilterConfig.disabled) { mainFilterConfig.onToggle(); } }; return ( <div className="group flex items-center justify-between border-b py-1.5" onDoubleClick={() => !isSystem && setIsEditing(true)}> <div className="flex flex-grow items-center gap-2"> <ColorPicker color={item.color} onSave={(color) => onUpdate(item.id, { color })} /> {isCategory && mainFilterConfig ? ( <label className="flex cursor-pointer select-none items-center gap-1 text-xs font-medium text-gray-500" onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}> <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={mainFilterConfig.checked} onChange={(event) => { event.stopPropagation(); handleToggleMainFilter(); }} onClick={(event) => event.stopPropagation()} disabled={isPending || mainFilterConfig.disabled} /> На главной </label> ) : null} {isEditing ? ( <div className="flex w-full items-center gap-2"> <input value={name} onChange={(e) => setName(e.target.value)} onBlur={handleSave} onKeyDown={(e) => e.key === 'Enter' && handleSave()} className="w-full rounded-md border px-2 py-1 text-sm" autoFocus disabled={isPending} /> {isCategory && (<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onBlur={handleSave} onKeyDown={(e) => e.key === 'Enter' && handleSave()} placeholder="Код" className="w-1/3 rounded-md border px-2 py-1 text-sm" disabled={isPending} />)} </div> ) : ( <div className="flex items-baseline gap-2"><span className={`text-sm ${levelClasses[level]}`}>{item.name}</span>{isCategory && (<span className="text-xs text-gray-400">{item.code}</span>)}</div> )} </div> <div className="flex items-center gap-x-3 text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100">{children}{!isSystem && (<button onClick={() => onDelete(item.id)} disabled={isPending} className="text-red-500 hover:text-red-700">Удалить</button>)}</div> </div> ); };

export function ClassificationClient({ initialCategories, initialTags, initialCodeRules, mainFilterPreset, }: { initialCategories: Category[]; initialTags: Tag[]; initialCodeRules: CodeRule[]; mainFilterPreset: { id: string; items: { categoryId: string; order: number; categoryName: string }[] }; }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUpdatingHomeFilter, startHomeFilterTransition] = useTransition();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [tags, setTags] = useState(initialTags);
  const [codeRules, setCodeRules] = useState(initialCodeRules);
  const [addingToParent, setAddingToParent] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncPlan, setSyncPlan] = useState<SyncPlan | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [planJustUpdated, setPlanJustUpdated] = useState(false);
  const buildTree = useCallback((cats: Category[], parentId: string | null = null): CategoryWithChildren[] => { return cats.filter((c) => c.parentId === parentId).sort((a, b) => a.order - b.order).map((category) => ({ ...category, children: buildTree(cats, category.id) })); }, []);
  
  const mainFilterPresetId = mainFilterPreset.id;
  const [homeFilterOrder, setHomeFilterOrder] = useState<string[]>(() =>
    mainFilterPreset.items
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((item) => item.categoryId),
  );
  const homeFilterSet = useMemo(() => new Set(homeFilterOrder), [homeFilterOrder]);

  useEffect(() => {
    setCategories(buildTree(initialCategories));
    setTags(initialTags.sort((a, b) => a.order - b.order));
    setCodeRules(initialCodeRules);
    setHomeFilterOrder(
      mainFilterPreset.items
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item) => item.categoryId),
    );
  }, [initialCategories, initialTags, initialCodeRules, buildTree, mainFilterPreset]);

  const sendHomeFilterUpdate = useCallback(
    (nextOrder: string[], fallback: string[]) => {
      startHomeFilterTransition(async () => {
        try {
          const response = await fetch('/api/admin/filters/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              presetId: mainFilterPresetId,
              items: nextOrder.map((categoryId, index) => ({
                categoryId,
                order: index,
              })),
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.error || 'Не удалось обновить фильтр категорий');
          }

          toast.success('Категории на главной странице обновлены', {
            id: 'home-filter-update',
          });
        } catch (error) {
          setHomeFilterOrder(fallback);
          toast.error(error instanceof Error ? error.message : 'Не удалось обновить фильтр категорий', {
            id: 'home-filter-update',
          });
        }
      });
    },
    [mainFilterPresetId, startHomeFilterTransition],
  );

  const handleToggleHomeFilter = useCallback(
    (categoryId: string) => {
      setHomeFilterOrder((prev) => {
        const fallback = [...prev];
        const isActive = prev.includes(categoryId);
        const nextOrder = isActive ? prev.filter((id) => id !== categoryId) : [...prev, categoryId];

        sendHomeFilterUpdate(nextOrder, fallback);

        return nextOrder;
      });
    },
    [sendHomeFilterUpdate],
  );

  const handleCheckSync = async (isUpdate = false) => { setIsChecking(true); setPlanJustUpdated(false); if (!isUpdate) { toast.loading('Анализ данных из "МойСклад"...', { id: 'dry-run' }); } try { const response = await fetch('/api/admin/sync/dry-run', { method: 'POST' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Ошибка'); setSyncPlan(data.plan); if (!isModalOpen) setIsModalOpen(true); if (isUpdate) { setPlanJustUpdated(true); } else { toast.success('План синхронизации готов!', { id: 'dry-run' }); } } catch (error) { toast.error(error instanceof Error ? error.message : 'Ошибка', { id: 'dry-run' }); } finally { setIsChecking(false); } };
  const handleAddNewRuleFromModal = async (name: string, code: string) => { const result = await createRuleWithSynonym(code, name); if (result.success) { toast.success(`Правило "${name}" → ${code} добавлено!`); await handleCheckSync(true); router.refresh(); } else { toast.error(result.error || 'Ошибка.'); } return { success: !!result.success }; };
  const handleAddNewSynonymFromModal = async (ruleId: string, name: string) => { const result = await addSynonymToRule(ruleId, name); if (result.success) { toast.success(`Синоним "${name}" добавлен.`); await handleCheckSync(true); } else { toast.error(result.error || 'Ошибка.'); } return { success: !!result.success }; };
  const handleConfirmSync = (plan: SyncPlan) => { startTransition(async () => { setIsExecuting(true); setPlanJustUpdated(false); toast.loading('Выполнение плана...', { id: 'execute-plan' }); try { const response = await fetch('/api/admin/sync/execute-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }), }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Ошибка'); toast.success(`Синхронизация завершена! Создано: ${data.created}, Обновлено: ${data.updated}.`, { id: 'execute-plan' }); setIsModalOpen(false); setSyncPlan(null); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : 'Ошибка', { id: 'execute-plan' }); } finally { setIsExecuting(false); } }); };
  const handleCreateCategory = (name: string, code: string, parentId: string | null) => { startTransition(async () => { const result = await createCategory(name, code, parentId); if (result?.error) { toast.error(result.error); } setAddingToParent(null); }); };
  const handleDeleteCategory = (id: string) => { startTransition(async () => { await deleteCategory(id); }); };
  const handleCreateTag = (name: string) => { startTransition(async () => { const result = await createTag(name); if (result?.error) { toast.error(result.error); } }); };
  const handleDeleteTag = (id: string) => { startTransition(async () => { await deleteTag(id); }); };
  const updateCategoryState = (items: CategoryWithChildren[], id: string, data: Partial<Category>): CategoryWithChildren[] => { return items.map((item) => { if (item.id === id) { return { ...item, ...data }; } if (item.children.length > 0) { return { ...item, children: updateCategoryState(item.children, id, data) }; } return item; }); };
  const updateTagState = (id: string, data: Partial<Tag>) => { setTags((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item))); setIsDirty(true); };
  const onDragEnd: OnDragEndResponder = (result) => { const { source, destination, type } = result; if (!destination) return; setIsDirty(true); if (type === 'TAGS') { const newTags = Array.from(tags); const [moved] = newTags.splice(source.index, 1); newTags.splice(destination.index, 0, moved); setTags(newTags); } };
  const handleSaveAll = () => { const flatten = (items: CategoryWithChildren[]): Category[] => items.flatMap((item) => { const { children, ...rest } = item; return [rest, ...flatten(children || [])]; }); const flatCategories = flatten(categories); startTransition(async () => { await saveAllClassifications(flatCategories.map((c, i) => ({ ...c, order: i })), tags.map((t, i) => ({ ...t, order: i })), ); toast.success('Все изменения сохранены!'); setIsDirty(false); }); };
  const systemTags = ['скидка', 'новинка'];

  const CategoryList = ({ items, level = 0, parentId = 'ROOT' }: { items: CategoryWithChildren[]; level?: number; parentId?: string }) => {
    return (
      <Droppable droppableId={parentId} type="CATEGORIES">
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className={`space-y-1 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}>
            {items.map((cat, index) => (
              <Draggable key={cat.id} draggableId={cat.id} index={index}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} className={level > 0 ? "relative pl-6" : ""}>
                    {level > 0 && <div className="absolute left-2 top-0 h-full w-4 border-l border-gray-200"></div>}
                    <div className="flex items-center gap-1">
                      <div {...provided.dragHandleProps} className="cursor-grab text-gray-300 hover:text-gray-500"><DragHandleIcon /></div>
                      <div className="flex-grow">
                        <ItemRow item={cat} onUpdate={(id, data) => { setCategories((prev) => updateCategoryState(prev, id, data)); setIsDirty(true); }} onDelete={handleDeleteCategory} isPending={isPending} isCategory={true} level={level} mainFilterConfig={{ checked: homeFilterSet.has(cat.id), disabled: isUpdatingHomeFilter, onToggle: () => handleToggleHomeFilter(cat.id), }}>
                          {level < 2 && (<button onClick={() => setAddingToParent(cat.id)} className="text-sm font-semibold text-gray-500 hover:text-gray-800">+</button>)}
                        </ItemRow>
                      </div>
                    </div>
                    {addingToParent === cat.id && (<div className="pl-6"><AddItemForm parentId={cat.id} onSave={handleCreateCategory} onCancel={() => setAddingToParent(null)} isPending={isPending} needsCode={true} /></div>)}
                    {cat.children.length > 0 && (<CategoryList items={cat.children} level={level + 1} parentId={cat.id} />)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="mb-4 flex justify-end"> <button onClick={handleSaveAll} disabled={!isDirty || isPending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"> {isPending ? 'Сохранение...' : 'Сохранить все изменения'} </button> </div>
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Категории</h2>
            <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-2 font-medium">Синхронизация с &quot;МойСклад&quot;</div>
                <p className="mb-4 text-xs text-gray-500">Проверьте данные из &quot;МойСклад&quot; и примените изменения. Система сравнит категории и покажет план действий.</p>
                <div className="flex flex-col gap-2">
                    <button onClick={() => handleCheckSync()} disabled={isChecking || isExecuting} className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"> <ArrowPathIcon className="h-5 w-5" /> {isChecking ? 'Анализ...' : 'Проверить актуальность по &quot;МойСклад&quot;'} </button>
                    <Link href="/admin/mappings" className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"> <BookOpenIcon className="h-5 w-5" /> Словарь сайта Kyanchir </Link>
                </div>
            </div>
            <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 font-medium">Добавить новую категорию</div>
              {addingToParent === 'root' ? ( <AddItemForm parentId={null} onSave={handleCreateCategory} onCancel={() => setAddingToParent(null)} isPending={isPending} needsCode={true} /> ) : ( <button onClick={() => setAddingToParent('root')} className="w-full rounded-md border border-dashed bg-gray-50 py-2 text-sm text-gray-600 hover:bg-gray-100">+ Создать новую категорию верхнего уровня</button> )}
            </div>
            <div className="text-md mb-2 font-semibold">Существующие категории</div>
            <p className="mb-2 text-xs text-gray-500">
              Отметьте галочкой «На главной», чтобы категория отображалась в фильтре витрины.
            </p>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <CategoryList items={categories} />
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Метки (Теги)</h2>
            <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 font-medium">Добавить новую метку</div>
              <AddItemForm onSave={(name, code) => handleCreateTag(name)} onCancel={() => {}} isPending={isPending} />
            </div>
            <div className="text-md mb-2 font-semibold">Существующие метки</div>
            <Droppable droppableId="tags-list" type="TAGS">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="rounded-lg border bg-white p-4 shadow-sm">
                  {tags.map((tag, index) => (
                    <Draggable key={tag.id} draggableId={tag.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-center gap-1">
                          <div {...provided.dragHandleProps} className="cursor-grab text-gray-300 hover:text-gray-500"><DragHandleIcon /></div>
                          <div className="flex-grow">
                            <ItemRow item={tag} onUpdate={updateTagState} onDelete={handleDeleteTag} isPending={isPending} isSystem={systemTags.includes(tag.name.toLowerCase())} />
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
        onAddRule={handleAddNewRuleFromModal}
        onAddSynonym={handleAddNewSynonymFromModal}
        plan={syncPlan}
        isExecuting={isExecuting}
        codeRules={codeRules}
        planJustUpdated={planJustUpdated}
      />
    </>
  );
}