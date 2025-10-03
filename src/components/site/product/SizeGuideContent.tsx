// Местоположение: src/components/product-details/SizeGuideContent.tsx
'use client';

import Image from 'next/image';
import ArrowStep1 from '@/components/illustrations/ArrowStep1';

const sizeData = [
  { size: 'S', og: '80-86', opg: '70-77', ot: '60-66', ob: '90-94' },
  { size: 'M', og: '87-91', opg: '78-82', ot: '67-72', ob: '95-99' },
  { size: 'L', og: '92-100', opg: '83-86', ot: '73-78', ob: '99-106' },
  { size: 'XL', og: '100-103', opg: '87-90', ot: '79-81', ob: '107-108' },
];

export default function SizeGuideContent() {
  return (
    <>
      <div className="p-4">
        {/* Таблица размеров */}
        <div className="font-body text-sm text-gray-800">
          <div className="grid grid-cols-5 gap-x-2 pb-2 text-xs font-semibold text-gray-400">
            <div />
            <div className="text-center">ОГ</div>
            <div className="text-center">ОПГ</div>
            <div className="text-center">ОТ</div>
            <div className="text-center">ОБ</div>
          </div>
          {sizeData.map(({ size, og, opg, ot, ob }) => (
            <div
              key={size}
              className="grid grid-cols-5 items-center gap-x-2 pt-3"
            >
              <div className="text-left font-semibold">{size}</div>
              <div className="text-center">{og}</div>
              <div className="text-center">{opg}</div>
              <div className="text-center">{ot}</div>
              <div className="text-center">{ob}</div>
            </div>
          ))}
        </div>

        {/* Инструкция */}
        <div className="font-body mt-8 text-left text-sm text-gray-600">
          <div className="font-body mb-2 text-base font-semibold text-gray-800">
            Как определить размер?
          </div>
          {/* --- ИЗМЕНЕНИЕ: Добавляем класс whitespace-pre-line --- */}
          <p className="whitespace-pre-line">
            {`Узнай, как правильно определить свой размер 
нижнего белья — мы собрали простое и наглядное 
руководство, чтобы каждый комплект идеально 
подчёркивал твою фигуру и был удобным 
с первого дня`}
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <ArrowStep1 className="fill-current text-gray-800" />
        </div>
      </div>
    </>
  );
}
