// src/context/FooterContext.tsx
'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

interface FooterContextType {
  footerHeight: number;
  setFooterHeight: (height: number) => void;
  isFooterVisible: boolean;
  setIsFooterVisible: (isVisible: boolean) => void;
}

const FooterContext = createContext<FooterContextType | undefined>(undefined);

export const FooterProvider = ({ children }: { children: ReactNode }) => {
  const [footerHeight, setFooterHeight] = useState(0);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  return (
    <FooterContext.Provider
      value={{
        footerHeight,
        setFooterHeight,
        isFooterVisible,
        setIsFooterVisible,
      }}
    >
      {children}
    </FooterContext.Provider>
  );
};

export const useFooter = () => {
  const context = useContext(FooterContext);
  if (context === undefined) {
    throw new Error('useFooter must be used within a FooterProvider');
  }
  return context;
};