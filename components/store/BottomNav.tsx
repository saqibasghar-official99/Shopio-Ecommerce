'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Grid3x3, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: House },
  { href: '/products', label: 'Categories', icon: Grid3x3 },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/account', label: 'Account', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems, hydrated } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative',
                isActive ? 'text-[#7A1F3D]' : 'text-gray-500'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.href === '/cart' && hydrated && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-[#7A1F3D] text-white text-[9px] px-1">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
