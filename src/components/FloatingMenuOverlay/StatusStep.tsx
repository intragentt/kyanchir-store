import React from 'react';

const StatusStep = ({
  label,
  status,
  align = 'center',
}: {
  label: string;
  status: 'done' | 'current' | 'pending';
  align?: 'left' | 'center' | 'right';
}) => {
  const textColor = status === 'pending' ? 'text-gray-400' : 'text-gray-800';

  let circleClasses = 'h-4 w-4 rounded-full ';
  if (status === 'done') {
    circleClasses += 'bg-gray-800';
  } else if (status === 'current') {
    circleClasses += 'bg-white border-2 border-gray-800';
  } else {
    circleClasses += 'bg-gray-200';
  }

  const positionClasses = {
    left: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0',
  }[align];

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Общее смещение для всех статусов ---
  // translate-y-6 (~24px) применяется ко всем текстам для выравнивания по одной линии.
  const verticalOffset = 'translate-y-6';
  // Горизонтальный отступ применяется только к первому элементу.
  const horizontalOffset = align === 'left' ? 'translate-x-[5px]' : '';
  const labelOffsetClass = `${verticalOffset} ${horizontalOffset}`;
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <div
      className={`relative flex ${positionClasses.replace('left-1/2 -translate-x-1/2', 'items-center').replace('left-0', 'items-start').replace('right-0', 'items-end')}`}
    >
      <div className={`relative mx-auto ${circleClasses}`}></div>
      <span
        className={`absolute mt-2 block whitespace-nowrap text-[10px] font-medium ${textColor} ${positionClasses} ${labelOffsetClass}`}
      >
        {label}
      </span>
    </div>
  );
};

export default StatusStep;
