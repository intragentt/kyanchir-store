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
  // Не рендерим ничего, если вложенных элементов нет
  if (count === 0) {
    return <td className={cn('w-12', level === 1 ? 'pl-4' : 'pl-8')}></td>;
  }

  return (
    <td
      className={cn(
        'w-12 cursor-pointer text-center',
        level === 1 ? 'pl-4' : 'pl-8', // Увеличиваем отступ для второго уровня
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-gray-700">{count}</span>
        <ChevronDown
          className={cn('h-5 w-5 text-gray-400 transition-transform', {
            'rotate-180': isExpanded,
          })}
        />
      </div>
    </td>
  );
};
