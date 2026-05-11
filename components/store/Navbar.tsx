'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Menu, House, Grid3x3, User, ClipboardList, X } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CartDrawer from './CartDrawer';
import { formatCurrency } from '@/lib/utils';

interface SearchResult {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  compare_price: number;
}

export default function Navbar() {
  const router = useRouter();
  const { settings } = useSettings();
  const { totalItems, hydrated } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const storeName = settings?.store_name || 'Store';
  const currency = settings?.currency || '$';

  // Live search with debounce + cancel-in-flight to avoid stale results
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const controller = new AbortController();
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(q)}&limit=6`,
          { signal: controller.signal }
        );
        const data = await res.json();
        const items = (data.data || []).map((p: SearchResult & { _id?: string }) => ({
          ...p,
          id: p._id || p.id,
        }));
        setSearchResults(items);
        setSearchOpen(items.length > 0);
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      // Client-side nav — preserves cache, no full reload
      router.push(`/products?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: House },
    { href: '/products', label: 'Products', icon: Grid3x3 },
    { href: '/orders', label: 'Orders', icon: ClipboardList },
    { href: '/account', label: 'Account', icon: User },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="text-green-600">{storeName}</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <link.icon className="h-4 w-4 text-green-600" />
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Store name / Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {settings?.logo && (
              <img
                src={settings.logo}
                alt={storeName}
                width={32}
                height={32}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-8 w-auto object-contain"
              />
            )}
            <span className="text-lg font-semibold text-green-600 hidden sm:inline">
              {storeName}
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-gray-600 rounded-md hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search with live results */}
          <div className="flex-1 max-w-md ml-auto md:mx-auto relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  className="pl-9 pr-8 h-9 text-sm rounded-md border-gray-200 focus:border-green-600 focus:ring-green-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Live search dropdown */}
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-xs text-gray-400">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((product) => (
                      <Link
                        key={product.id || product._id}
                        href={`/products/${product.slug}`}
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b last:border-0"
                      >
                        <div className="w-10 h-10 rounded bg-gray-100 shrink-0 overflow-hidden">
                          <img
                            src={product.images?.[0] || '/placeholder.png'}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{product.name}</p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-semibold text-green-600">
                              {formatCurrency(product.price, currency)}
                            </span>
                            {product.compare_price > product.price && (
                              <span className="text-[10px] text-gray-400 line-through">
                                {formatCurrency(product.compare_price, currency)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => setSearchOpen(false)}
                      className="block px-3 py-2.5 text-xs text-center text-green-600 hover:bg-green-50 font-medium border-t"
                    >
                      View all results for &quot;{searchQuery}&quot;
                    </Link>
                  </>
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">No products found</div>
                )}
              </div>
            )}
          </div>

          {/* Cart icon */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5 text-gray-700" />
            {hydrated && totalItems > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] flex items-center justify-center bg-green-600 text-white text-[10px] px-1.5">
                {totalItems}
              </Badge>
            )}
          </button>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
