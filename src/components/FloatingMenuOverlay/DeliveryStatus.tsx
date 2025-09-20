'use client';

import React, { useState } from 'react';
import TruckIcon from '../icons/TruckIcon';
import ChevronIcon from '../icons/ChevronIcon';
import StatusStep from './StatusStep';

const DeliveryStatus = () => {
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(true);

  return (
    <div className="mt-10 rounded-lg border border-gray-200 transition-colors">
      <button
        onClick={() => setIsDeliveryOpen(!isDeliveryOpen)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center space-x-3">
          <TruckIcon className="h-6 w-6 flex-none text-gray-800" />
          <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
            Доставка
          </div>
        </div>
        <div className="-mr-8 flex items-center space-x-2">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
          <ChevronIcon
            isOpen={isDeliveryOpen}
            direction="down"
            className="h-5 w-5 text-gray-400"
          />
        </div>
      </button>
      {isDeliveryOpen && (
        <div className="animate-in fade-in px-4 pb-4 duration-300">
          <div className="font-body">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold text-gray-800">Заказ #337</p>
            </div>
            <p className="mt-1 text-sm text-gray-600">Розовая пижама</p>
          </div>
          <div className="relative mt-8">
            <div className="absolute left-2 right-2 top-1/2 h-1.5 -translate-y-[55%] rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gray-800"
                style={{ width: '33.33%' }}
              ></div>
            </div>
            <div className="relative flex justify-between">
              <StatusStep label="Обработан" status="done" align="left" />
              <StatusStep label="В пути" status="current" />
              <StatusStep label="Ожидает" status="pending" />
              <StatusStep label="Получен" status="pending" align="right" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryStatus;