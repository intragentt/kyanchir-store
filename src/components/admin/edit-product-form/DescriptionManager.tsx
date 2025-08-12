// Местоположение: src/components/admin/edit-product-form/DescriptionManager.tsx
'use client';

import React, { useRef, useEffect } from 'react';

const AutoResizeTextarea = (
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [props.value]);
  return <textarea ref={textareaRef} {...props} />;
};

interface DescriptionManagerProps {
  value: string;
  onChange: (newValue: string) => void;
}

export default function DescriptionManager({
  value,
  onChange,
}: DescriptionManagerProps) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <label className="mb-4 block text-lg font-semibold text-gray-800">
        Описание
      </label>
      <AutoResizeTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Введите подробное описание..."
        className="user-select-text block min-h-[120px] w-full resize-none overflow-hidden rounded-md border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
    </div>
  );
}
