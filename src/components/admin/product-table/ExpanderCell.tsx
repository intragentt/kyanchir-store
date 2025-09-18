// /src/components/admin/product-table/ExpanderCell.tsx

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpanderCellProps {
  count: number;
  isExpanded: boolean;
  onClick: () => void;
  level: 1 | 2;
}

export const ExpanderCell = ({
  count,
  isExpanded,
  onClick,
  level,
}: ExpanderCellProps) => {
  if (count === 0) {
    return <td className={cn('w-12', level === 1 ? 'pl-4' : 'pl-8')}></td>;
  }

  return (
    <td
      className={cn(
        'w-12 cursor-pointer text-center',
        // --- НАЧАЛО ИЗМЕНЕНИЙ: Убираем отступы отсюда... ---
        // level === 1 ? 'pl-4' : 'pl-8',
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
      )}
      onClick={onClick}
    >
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: ...и добавляем их внутрь div для лучшего контроля --- */}
      <div
        className={cn(
          'flex flex-col items-center',
          level === 1 ? 'pl-4' : 'pl-8',
        )}
      >
        {/* Меняем цвет текста на более светлый gray-500 */}
        <span className="text-xs font-medium text-gray-500">{count}</span>
        <ChevronDown
          className={cn('h-5 w-5 text-gray-400 transition-transform', {
            // Стрелка уже достаточно светлая
            'rotate-180': isExpanded,
          })}
        />
      </div>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </td>
  );
};
