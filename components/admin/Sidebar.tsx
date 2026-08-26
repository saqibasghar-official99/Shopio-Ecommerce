'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, LayoutDashboard, ShoppingBag, Package, FolderTree, Users, Ticket, MapPin, ChartBar as BarChart3, FileText, Settings, X, UserCog, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Deals', href: '/admin/deals', icon: Flame },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Delivery Zones', href: '/admin/delivery-zones', icon: MapPin },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Invoices & Ledger', href: '/admin/invoices-ledger', icon: FileText },
  { label: 'Site Settings', href: '/admin/site-settings', icon: Settings },
  { label: 'Admin Users', href: '/admin/admin-users', icon: UserCog },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Link href="/admin" className="text-base font-semibold text-gray-900">
          Store Admin
        </Link>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-green-700 font-semibold  text-white'
                      : 'text-gray-700 font-semibold hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-white lg:block">
        {sidebarContent}
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-white transition-transform duration-200 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
