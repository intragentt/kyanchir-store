// Местоположение: src/components/admin/filters/SortableCategoryItem.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ManagedCategory } from './FilterManagerClient';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// ИСПРАВЛЕНО: Атрибут viewBox теперь обернут в кавычки, как того требует синтаксис.
const GripVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24" // <--- ВОТ ИСПРАВЛЕНИЕ
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

interface SortableCategoryItemProps {
  item: ManagedCategory;
  onToggle: (id: string) => void;
  isSortable?: boolean;
}

export function SortableCategoryItem({
  item,
  onToggle,
  isSortable = true,
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !isSortable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-md border bg-white p-3 text-sm"
    >
      {isSortable && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-gray-400 hover:text-gray-700"
        >
          <GripVerticalIcon className="h-5 w-5" />
        </button>
      )}

      <input
        type="checkbox"
        checked={item.isActive}
        onChange={() => onToggle(item.id)}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="flex-grow">{item.name}</span>
    </div>
  );
}
