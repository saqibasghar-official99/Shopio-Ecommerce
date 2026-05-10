'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import TopBar from '@/components/admin/TopBar';
import { ToastProvider } from '@/contexts/ToastContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setAdminEmail(data.data?.email || '');
          setAuthChecked(true);
        } else {
          router.replace('/admin/login');
        }
      } catch {
        router.replace('/admin/login');
      }
    };

    checkAuth();
  }, [isLoginPage, router]);

  if (!isLoginPage && !authChecked) {
    return (
      <ToastProvider>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
        </div>
      </ToastProvider>
    );
  }

  if (isLoginPage) {
    return <ToastProvider><>{children}</></ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:pl-60">
          <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} email={adminEmail} />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
