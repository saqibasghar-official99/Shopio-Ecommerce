'use client';

import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface TopBarProps {
  onToggleSidebar: () => void;
  email?: string;
}

export default function TopBar({ onToggleSidebar, email }: TopBarProps) {
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/login', { method: 'DELETE' });
      if (res.ok) {
        document.cookie = 'admin_token=; path=/; max-age=0';
        window.location.href = '/admin/login';
      } else {
        document.cookie = 'admin_token=; path=/; max-age=0';
        window.location.href = '/admin/login';
      }
    } catch {
      document.cookie = 'admin_token=; path=/; max-age=0';
      showToast('Logged out', 'success');
      window.location.href = '/admin/login';
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white px-4">
      {/* Left: mobile sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer for desktop to push right content over */}
      <div className="hidden lg:block" />

      {/* Right: email + logout */}
      <div className="flex items-center gap-3">
        {email && (
          <span className="text-xs text-gray-600">{email}</span>
        )}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}
