'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export default function AnnouncementBar() {
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  const text = settings?.announcement_bar?.text || '';
  const isActive =
    settings?.announcement_bar?.isActive && !!text;

  if (!isActive || dismissed) return null;

  return (
    <div className="relative w-full overflow-hidden bg-[#7A1F3D] text-white text-xs py-1.5 pr-10">
      {/* Scrolling Content */}
      <div className="overflow-hidden whitespace-nowrap">
        <div className="announcement-marquee inline-flex min-w-max">
          <span className="px-16">
            {text}
          </span>

          <span className="px-16">
            {text}
          </span>

          <span className="px-16">
            {text}
          </span>

          <span className="px-16">
            {text}
          </span>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 bg-[#7A1F3D] hover:bg-[#5C1A2F] transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Animation */}
      <style jsx>{`
        .announcement-marquee {
          animation: announcement-scroll 22s linear infinite;
        }

        @keyframes announcement-scroll {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        @media (max-width: 640px) {
          .announcement-marquee {
            animation-duration: 14s;
          }
        }
      `}</style>
    </div>
  );
}