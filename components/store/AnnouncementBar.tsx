'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export default function AnnouncementBar() {
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  const text = settings?.announcement_bar?.text || '';
  const isActive = settings?.announcement_bar?.isActive && !!text;

  if (!isActive || dismissed) return null;

  return (
    <div className="relative w-full bg-green-600 text-white text-xs text-center py-1.5 px-8">
      <p className="truncate">{text}</p>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-green-700 rounded transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
