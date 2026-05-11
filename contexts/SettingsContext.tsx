'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings } from '@/lib/types';

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({ settings: null, loading: true });

interface SettingsProviderProps {
  children: React.ReactNode;
  // When provided (from the server layout), no client fetch is needed —
  // settings render with the very first paint.
  initial?: SiteSettings | null;
}

export function SettingsProvider({ children, initial }: SettingsProviderProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) return; // already hydrated from the server, skip the fetch
    let mounted = true;
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data.data) setSettings(data.data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [initial]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
