'use client';

import { createContext, useContext } from 'react';

export interface SiteModeClientSettings {
  testModeEnabled: boolean;
  testModeMessage: string;
  testModeMarqueeSpeed: number;
  hideTestBannerForAdmins: boolean;
  maintenanceModeEnabled: boolean;
  maintenanceMessage: string;
  maintenanceEndsAt: string | null;
  hideMaintenanceForAdmins: boolean;
  maintenanceCtaEnabled: boolean;
  maintenanceCtaLabel: string;
  maintenanceCtaHref: string;
  maintenanceBackdropColor: string;
  maintenanceBackdropOpacity: number;
}

const DEFAULT_VALUE: SiteModeClientSettings = {
  testModeEnabled: false,
  testModeMessage: 'Сайт работает в тестовом режиме. Возможны временные сбои.',
  testModeMarqueeSpeed: 18,
  hideTestBannerForAdmins: false,
  maintenanceModeEnabled: false,
  maintenanceMessage: 'Идут технические работы. Пожалуйста, зайдите позже.',
  maintenanceEndsAt: null,
  hideMaintenanceForAdmins: true,
  maintenanceCtaEnabled: false,
  maintenanceCtaLabel: 'Написать в поддержку',
  maintenanceCtaHref: '',
  maintenanceBackdropColor: '#020617',
  maintenanceBackdropOpacity: 80,
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
