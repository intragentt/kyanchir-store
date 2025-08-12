// Местоположение: src/components/FloatingLogoButton.tsx
"use client";

import React, { useState, useEffect } from 'react';
import ShortLogo from './icons/ShortLogo';

interface FloatingLogoButtonProps {
  onClick: () => void;
  isMenuOpen: boolean; 
}

export default function FloatingLogoButton({ onClick, isMenuOpen }: FloatingLogoButtonProps) {
  const [opacity, setOpacity] = useState(0.5);

  useEffect(() => {
    if (isMenuOpen) {
      setOpacity(1);
      return;
    }
    const minOpacity = 0.5;
    const maxOpacity = 1;
    const transitionDistance = 200;
    const scrollY = window.scrollY;
    const scrollProgress = Math.min(scrollY / transitionDistance, 1);
    const newOpacity = minOpacity + (maxOpacity - minOpacity) * scrollProgress;
    setOpacity(newOpacity);
  }, [isMenuOpen]);

  return (
    <button
      onClick={onClick}
      style={{ opacity: opacity }}
      className={`
        fixed            
        bottom-6         
        right-6          
        ${isMenuOpen ? 'z-[110]' : 'z-50'} 
        h-24 w-24        
        rounded-full     
        bg-white/70      
        backdrop-blur-sm 
        border-2 border-[#E6E7EE]
        flex             
        items-center     
        justify-center   
        transition-all 
        duration-300     
      `}
    >
      {/* --- ГЛАВНОЕ ИЗМЕНЕНИЕ: Управляем видом иконки --- */}
      {isMenuOpen ? (
        // Если меню открыто, показываем логотип в новом цвете
        <ShortLogo className="h-8 w-auto text-[#6B80C5]" /> 
      ) : (
        // Если меню закрыто, показываем логотип в стандартном цвете
        <ShortLogo className="h-8 w-auto text-[#E6E7EE]" /> 
      )}
    </button>
  );
}

FloatingLogoButton.displayName = 'FloatingLogoButton';