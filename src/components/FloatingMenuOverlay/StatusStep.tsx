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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем класс для смещения ---
  // Этот класс сдвинет текст на 5px вправо и на 2px вниз, но только для элемента "Обработан" (align="left")
  const labelOffsetClass =
    align === 'left' ? 'translate-x-[5px] translate-y-0.5' : '';
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <div
      className={`relative flex flex-1 ${positionClasses.replace('left-1/2 -translate-x-1/2', 'items-center').replace('left-0', 'items-start').replace('right-0', 'items-end')}`}
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
