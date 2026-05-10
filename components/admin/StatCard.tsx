'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-md border bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
