'use client';

import { createContext, useContext } from 'react';

export interface SiteModeClientSettings {
  testModeEnabled: boolean;
  testModeMessage: string;
  hideTestBannerForAdmins: boolean;
  maintenanceModeEnabled: boolean;
  maintenanceMessage: string;
  maintenanceEndsAt: string | null;
  hideMaintenanceForAdmins: boolean;
}

const DEFAULT_VALUE: SiteModeClientSettings = {
  testModeEnabled: false,
  testModeMessage: 'Сайт работает в тестовом режиме. Возможны временные сбои.',
  hideTestBannerForAdmins: false,
  maintenanceModeEnabled: false,
  maintenanceMessage: 'Идут технические работы. Пожалуйста, зайдите позже.',
  maintenanceEndsAt: null,
  hideMaintenanceForAdmins: true,
};

const SiteModeContext = createContext<SiteModeClientSettings>(DEFAULT_VALUE);

interface SiteModeProviderProps {
  value: SiteModeClientSettings;
  children: React.ReactNode;
}

export function SiteModeProvider({ value, children }: SiteModeProviderProps) {
  return <SiteModeContext.Provider value={value}>{children}</SiteModeContext.Provider>;
}

export function useSiteModeSettings() {
  return useContext(SiteModeContext);
}
