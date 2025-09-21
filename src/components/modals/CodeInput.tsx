'use client';

import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';

interface CodeInputProps {
  length: number;
  onComplete: (code: string) => void;
  // eslint-disable-next-line no-unused-vars
  onChange: (code: string) => void;
}

export default function CodeInput({
  length,
  onComplete,
  onChange,
}: CodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const processInput = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    const fullCode = newCode.join('');
    onChange(fullCode); // Уведомляем родителя об изменении

    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (fullCode.length === length) {
      onComplete(fullCode);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Только цифры
    if (value) {
      processInput(value, index);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (pastedData.match(new RegExp(`^\\d{${length}}$`))) {
      const newCode = pastedData.split('');
      setCode(newCode);
      onChange(newCode.join(''));
      onComplete(newCode.join(''));
      inputsRef.current[length - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center space-x-2">
      {code.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined} // Паст только в первом поле
          className="h-14 w-12 rounded-lg border border-gray-300 text-center text-2xl font-semibold text-gray-800 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      ))}
    </div>
  );
}
