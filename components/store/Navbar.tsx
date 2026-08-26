'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Search,
  ShoppingCart,
  Menu,
  Grid3x3,
  User,
  ClipboardList,
  X,
  ShieldCheck,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';

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

interface CustomerData {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
}

const AUTH_KEY = 'shopease_customer';

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

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [customerHydrated, setCustomerHydrated] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const storeName = settings?.store_name || 'Store';
  const currency = settings?.currency || '$';

  // ============================================================
  // LOAD CUSTOMER AUTH STATE
  // ============================================================

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);

      if (saved) {
        const data = JSON.parse(saved);

        if (data && data.name && data.email) {
          setCustomer(data);
        }
      }
    } catch (error) {
      console.error('Failed to load customer:', error);
    } finally {
      setCustomerHydrated(true);
    }
  }, []);

  // ============================================================
  // SYNC CUSTOMER LOGIN STATE WHEN TAB/WINDOW FOCUS CHANGES
  // ============================================================

  useEffect(() => {
    const syncCustomer = () => {
      try {
        const saved = localStorage.getItem(AUTH_KEY);

        if (saved) {
          const data = JSON.parse(saved);

          if (data && data.name && data.email) {
            setCustomer(data);
          } else {
            setCustomer(null);
          }
        } else {
          setCustomer(null);
        }
      } catch {
        setCustomer(null);
      }
    };

    window.addEventListener('focus', syncCustomer);
    window.addEventListener('storage', syncCustomer);

    return () => {
      window.removeEventListener('focus', syncCustomer);
      window.removeEventListener('storage', syncCustomer);
    };
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleCustomerLogout = () => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error('Failed to logout:', error);
    }

    setCustomer(null);
    setMobileOpen(false);

    router.refresh();
  };

  // ============================================================
  // LIVE PRODUCT SEARCH
  // ============================================================

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const q = searchQuery.trim();

    if (!q) {
      setSearchResults([]);
      setSearchOpen(false);
      setSearchLoading(false);
      return;
    }

    if (q.length < 2) {
      setSearchResults([]);
      setSearchOpen(true);
      setSearchLoading(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    setSearchOpen(true);
    setSearchLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(q)}&limit=6`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error(
            `Search request failed: ${response.status}`
          );
        }

        const result = await response.json();

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const products = Array.isArray(result?.data)
          ? result.data
          : [];

        const items: SearchResult[] = products.map(
          (product: SearchResult) => ({
            ...product,
            id: product._id || product.id,
          })
        );

        setSearchResults(items);
        setSearchOpen(true);
      } catch (error) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        console.error('Live product search error:', error);

        setSearchResults([]);
        setSearchOpen(true);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setSearchLoading(false);
        }
      }
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [searchQuery]);

  // ============================================================
  // CLOSE SEARCH WHEN CLICKING OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  // ============================================================
  // SEARCH SUBMIT
  // ============================================================

  const handleSearchSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const q = searchQuery.trim();

    if (!q) {
      return;
    }

    setSearchOpen(false);

    router.push(
      `/products?search=${encodeURIComponent(q)}`
    );
  };

  // ============================================================
  // CLEAR SEARCH
  // ============================================================

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    setSearchLoading(false);

    requestIdRef.current++;
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navLinks = [
    {
      href: '/products',
      label: 'Shop',
      icon: Grid3x3,
    },
    {
      href: '/orders',
      label: 'My Orders',
      icon: ClipboardList,
    },
    {
      href: '/account',
      label: 'Account',
      icon: User,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">

        {/* ====================================================
            MAIN HEADER
        ==================================================== */}

        <div className="max-w-7xl mx-auto px-3 sm:px-4">

          <div className="h-16 flex items-center gap-2 sm:gap-4">

            {/* =================================================
                MOBILE MENU
            ================================================= */}

            <div className="md:hidden shrink-0">
              <Sheet
                open={mobileOpen}
                onOpenChange={setMobileOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                    className="h-9 w-9 hover:bg-[#7A1F3D]/5"
                  >
                    <Menu className="h-5 w-5 text-gray-700" />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-80 flex flex-col"
                >

                  {/* =================================================
                      MOBILE HEADER
                  ================================================= */}

                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-[#7A1F3D]">

                      {settings?.logo && (
                        <img
                          src={settings.logo}
                          alt={storeName}
                          className="h-8 w-auto object-contain"
                        />
                      )}

                      <span>
                        {storeName}
                      </span>

                    </SheetTitle>
                  </SheetHeader>

                  {/* =================================================
                      MOBILE NAVIGATION
                  ================================================= */}

                  <nav className="mt-6 flex flex-col gap-1">

                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() =>
                          setMobileOpen(false)
                        }
                        className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-[#7A1F3D]/5 hover:text-[#7A1F3D] transition-colors"
                      >
                        <link.icon className="h-4 w-4 text-[#7A1F3D]" />

                        {link.label}
                      </Link>
                    ))}

                  </nav>

                  {/* =================================================
                      MOBILE ACCOUNT SECTION
                  ================================================= */}

                  <div className="mt-auto pt-6">

                    <div className="border-t border-gray-100 pt-5">

                      {!customerHydrated ? (

                        /* =================================================
                           AUTH LOADING
                        ================================================= */

                        <div className="px-3 py-4">

                          <div className="flex items-center gap-3">

                            <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />

                            <div className="space-y-2">
                              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                              <div className="h-2.5 w-32 bg-gray-100 rounded animate-pulse" />
                            </div>

                          </div>

                        </div>

                      ) : customer ? (

                        /* =================================================
                           LOGGED IN CUSTOMER
                        ================================================= */

                        <div className="space-y-3">

                          {/* Customer Profile */}

                          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#7A1F3D]/5">

                            <div className="h-10 w-10 rounded-full bg-[#7A1F3D] flex items-center justify-center shrink-0">

                              <User className="h-5 w-5 text-white" />

                            </div>

                            <div className="min-w-0">

                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {customer.name}
                              </p>

                              <p className="text-xs text-gray-500 truncate">
                                {customer.email}
                              </p>

                            </div>

                          </div>

                          {/* My Account */}

                          <Link
                            href="/account"
                            onClick={() =>
                              setMobileOpen(false)
                            }
                            className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <User className="h-4 w-4 text-[#7A1F3D]" />

                            My Account
                          </Link>

                          {/* Logout */}

                          <button
                            type="button"
                            onClick={handleCustomerLogout}
                            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left"
                          >
                            <LogOut className="h-4 w-4" />

                            Log Out
                          </button>

                        </div>

                      ) : (

                        /* =================================================
                           GUEST CUSTOMER
                        ================================================= */

                        <div className="space-y-3">

                          <div className="px-3 mb-3">

                            <p className="text-sm font-semibold text-gray-900">
                              Welcome!
                            </p>

                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              Sign in to track your orders and manage your account.
                            </p>

                          </div>

                          {/* Login */}

                          <Link
                            href="/account"
                            onClick={() =>
                              setMobileOpen(false)
                            }
                            className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#7A1F3D] text-white text-sm font-semibold hover:bg-[#681a34] transition-colors"
                          >
                            <LogIn className="h-4 w-4" />

                            Login
                          </Link>

                          {/* Create Account */}

                          <Link
                            href="/account?tab=register"
                            onClick={() =>
                              setMobileOpen(false)
                            }
                            className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[#7A1F3D] text-[#7A1F3D] text-sm font-semibold hover:bg-[#7A1F3D]/5 transition-colors"
                          >
                            <UserPlus className="h-4 w-4" />

                            Create Account
                          </Link>

                        </div>

                      )}

                    </div>

                  </div>

                </SheetContent>
              </Sheet>
            </div>

            {/* =================================================
                LOGO
            ================================================= */}

            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 group"
            >

              {settings?.logo ? (

                <img
                  src={settings.logo}
                  alt={storeName}
                  width={56}
                  height={56}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-12 sm:h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                />

              ) : (

                <div className="h-12 w-12 rounded-lg bg-[#7A1F3D] flex items-center justify-center">

                  <span className="text-white font-bold text-sm">
                    {storeName.charAt(0)}
                  </span>

                </div>

              )}

              <div className="hidden sm:block">

                <span className="block text-lg font-bold tracking-tight text-[#7A1F3D] leading-none">
                  {storeName}
                </span>

                <span className="block text-[9px] text-gray-400 mt-1 tracking-wide uppercase">
                  Shop with confidence
                </span>

              </div>

            </Link>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}

            <nav className="hidden lg:flex items-center gap-1 ml-3">

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-[#7A1F3D]/5 hover:text-[#7A1F3D] transition-all"
                >

                  <link.icon className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#7A1F3D] transition-colors" />

                  {link.label}

                </Link>
              ))}

            </nav>

            {/* =================================================
                SEARCH
            ================================================= */}

            <div
              ref={searchRef}
              className="flex-1 min-w-0 max-w-xl ml-auto lg:ml-4 relative"
            >

              <form onSubmit={handleSearchSubmit}>

                <div className="relative">

                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

                  <Input
                    type="search"
                    placeholder="Search for watches, earbuds & more..."
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    onFocus={() => {
                      if (searchQuery.trim()) {
                        setSearchOpen(true);
                      }
                    }}
                    className="
                      pl-9
                      pr-9
                      h-10
                      text-sm
                      rounded-full
                      bg-gray-50
                      border-gray-200
                      hover:border-gray-300
                      focus:bg-white
                      focus:border-[#7A1F3D]
                      focus:ring-2
                      focus:ring-[#7A1F3D]/10
                      focus-visible:ring-2
                      focus-visible:ring-[#7A1F3D]/10
                      transition-all
                      [&::-webkit-search-cancel-button]:appearance-none
                      [&::-webkit-search-decoration]:appearance-none
                    "
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7A1F3D] transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                </div>

              </form>

              {/* =================================================
                  SEARCH DROPDOWN
              ================================================= */}

              {searchOpen && searchQuery.trim() && (

                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">

                  {searchLoading ? (

                    <div className="p-5 text-center">

                      <div className="h-5 w-5 mx-auto mb-2 rounded-full border-2 border-gray-200 border-t-[#7A1F3D] animate-spin" />

                      <p className="text-xs text-gray-400">
                        Searching products...
                      </p>

                    </div>

                  ) : searchResults.length > 0 ? (

                    <>

                      <div className="max-h-80 overflow-y-auto">

                        {searchResults.map((product) => (

                          <Link
                            key={
                              product.id ||
                              product._id ||
                              product.slug
                            }
                            href={`/products/${product.slug}`}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors border-b last:border-0"
                          >

                            <div className="w-11 h-11 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-gray-100">

                              <img
                                src={
                                  product.images?.[0] ||
                                  '/placeholder.png'
                                }
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />

                            </div>

                            <div className="flex-1 min-w-0">

                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>

                              <div className="flex items-baseline gap-1.5 mt-0.5">

                                <span className="text-sm font-bold text-[#7A1F3D]">
                                  {formatCurrency(
                                    product.price,
                                    currency
                                  )}
                                </span>

                                {product.compare_price >
                                  product.price && (
                                    <span className="text-xs text-gray-400 line-through">
                                      {formatCurrency(
                                        product.compare_price,
                                        currency
                                      )}
                                    </span>
                                  )}

                              </div>

                            </div>

                          </Link>

                        ))}

                      </div>

                      <Link
                        href={`/products?search=${encodeURIComponent(
                          searchQuery.trim()
                        )}`}
                        onClick={() =>
                          setSearchOpen(false)
                        }
                        className="block px-4 py-3 text-xs text-center text-[#7A1F3D] font-semibold border-t bg-white hover:bg-[#7A1F3D]/5 transition-colors"
                      >
                        View all results →
                      </Link>

                    </>

                  ) : (

                    <div className="p-6 text-center">

                      <div className="h-10 w-10 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">

                        <Search className="h-4 w-4 text-gray-300" />

                      </div>

                      <p className="text-sm font-medium text-gray-700">
                        No products found
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Try searching for something else
                      </p>

                    </div>

                  )}

                </div>

              )}

            </div>

            {/* =================================================
                TRUST INDICATOR - DESKTOP
            ================================================= */}

            <div className="hidden xl:flex items-center gap-2 shrink-0">

              <div className="h-8 w-8 rounded-full bg-[#7A1F3D]/5 flex items-center justify-center">

                <ShieldCheck className="h-4 w-4 text-[#7A1F3D]" />

              </div>

              <div className="leading-none">

                <p className="text-[10px] font-semibold text-gray-700">
                  Secure Shopping
                </p>

                <p className="text-[9px] text-gray-400 mt-1">
                  Safe & trusted
                </p>

              </div>

            </div>

            {/* =================================================
                CART
            ================================================= */}

            <button
              onClick={() => setCartOpen(true)}
              className="relative shrink-0 inline-flex items-center gap-2 h-10 px-2 sm:px-3 rounded-full hover:bg-[#7A1F3D]/5 transition-colors group"
              aria-label="Open cart"
            >

              <div className="relative">

                <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-[#7A1F3D] transition-colors" />

                {hydrated && totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 min-w-[16px] flex items-center justify-center bg-[#7A1F3D] text-white text-[9px] font-bold px-1 border-2 border-white">
                    {totalItems}
                  </Badge>
                )}

              </div>

              <span className="hidden sm:block text-xs font-semibold text-gray-700 group-hover:text-[#7A1F3D]">
                Cart
              </span>

            </button>

          </div>

        </div>

      </header>

      {/* ========================================================
          CART DRAWER
      ======================================================== */}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />

    </>
  );
}