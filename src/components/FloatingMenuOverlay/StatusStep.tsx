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

  const labelOffsetClass =
    align === 'left' ? 'translate-x-[5px] translate-y-3' : '';

  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Убран класс flex-1 ---
    // Теперь компонент не растягивается, а позволяет родительскому flex-контейнеру
    // с justify-between правильно его позиционировать.
    <div
      className={`relative flex ${positionClasses.replace('left-1/2 -translate-x-1/2', 'items-center').replace('left-0', 'items-start').replace('right-0', 'items-end')}`}
    >
    {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
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