

'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Search,
  ShoppingCart,
  Menu,
  Grid3x3,
  User,
  ClipboardList,
  X,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  Gift,
  Tag,
  ArrowRight,
  Heart,
  Loader2,
  Trash2,
} from 'lucide-react';

import { cn } from '@/lib/utils';

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

// ============================================================
// TYPES
// ============================================================

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

interface WishlistProduct {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  compare_price: number;
  stock?: number;
}

// ============================================================
// LOCAL STORAGE
// ============================================================

const AUTH_KEY =
  'Veeo_customer';

const WISHLIST_STORAGE_KEY =
  'Veeo_wishlist';

// ============================================================
// ANIMATION VARIANTS
// ============================================================

const fadeInDown = {
  initial: {
    opacity: 0,
    y: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

const itemFade = {
  initial: {
    opacity: 0,
    x: -10,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -10,
  },
};

// ============================================================
// NAVBAR
// ============================================================

export default function Navbar() {
  const router = useRouter();

  const {
    settings,
  } = useSettings();

  const {
    totalItems,
    hydrated,
  } = useCart();

  // ============================================================
  // GENERAL STATE
  // ============================================================

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    searchResults,
    setSearchResults,
  ] = useState<SearchResult[]>([]);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    searchLoading,
    setSearchLoading,
  ] = useState(false);

  const [
    searchFocused,
    setSearchFocused,
  ] = useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    cartOpen,
    setCartOpen,
  ] = useState(false);

  const [
    scrolled,
    setScrolled,
  ] = useState(false);

  // ============================================================
  // CUSTOMER STATE
  // ============================================================

  const [
    customer,
    setCustomer,
  ] = useState<CustomerData | null>(
    null
  );

  const [
    customerHydrated,
    setCustomerHydrated,
  ] = useState(false);

  // ============================================================
  // WISHLIST STATE
  // ============================================================

  const [
    wishlistIds,
    setWishlistIds,
  ] = useState<string[]>([]);

  const [
    wishlistProducts,
    setWishlistProducts,
  ] = useState<WishlistProduct[]>([]);

  const [
    wishlistOpen,
    setWishlistOpen,
  ] = useState(false);

  const [
    wishlistLoading,
    setWishlistLoading,
  ] = useState(false);

  // ============================================================
  // REFS
  // ============================================================

  const searchRef =
    useRef<HTMLDivElement>(null);

  const wishlistRef =
    useRef<HTMLDivElement>(null);

  const debounceRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const requestIdRef =
    useRef(0);

  // ============================================================
  // SETTINGS
  // ============================================================

  const storeName =
    settings?.store_name ||
    'Store';

  const currency =
    settings?.currency ||
    '$';

  // ============================================================
  // SCROLL DETECTION
  // ============================================================

  useEffect(() => {
    const onScroll = () => {
      setScrolled(
        window.scrollY > 20
      );
    };

    onScroll();

    window.addEventListener(
      'scroll',
      onScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        'scroll',
        onScroll
      );
    };
  }, []);

  // ============================================================
  // LOAD CUSTOMER AUTH STATE
  // ============================================================

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          AUTH_KEY
        );

      if (saved) {
        const data =
          JSON.parse(saved);

        if (
          data &&
          data.name &&
          data.email
        ) {
          setCustomer(data);
        }
      }
    } catch (error) {
      console.error(
        'Failed to load customer:',
        error
      );
    } finally {
      setCustomerHydrated(true);
    }
  }, []);

  // ============================================================
  // SYNC CUSTOMER LOGIN STATE
  // ============================================================

  useEffect(() => {
    const syncCustomer = () => {
      try {
        const saved =
          localStorage.getItem(
            AUTH_KEY
          );

        if (saved) {
          const data =
            JSON.parse(saved);

          if (
            data &&
            data.name &&
            data.email
          ) {
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

    window.addEventListener(
      'focus',
      syncCustomer
    );

    window.addEventListener(
      'storage',
      syncCustomer
    );

    return () => {
      window.removeEventListener(
        'focus',
        syncCustomer
      );

      window.removeEventListener(
        'storage',
        syncCustomer
      );
    };
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleCustomerLogout =
    () => {
      try {
        localStorage.removeItem(
          AUTH_KEY
        );
      } catch (error) {
        console.error(
          'Failed to logout:',
          error
        );
      }

      setCustomer(null);
      setMobileOpen(false);

      router.refresh();
    };

  // ============================================================
  // GET WISHLIST IDS FROM LOCAL STORAGE
  // ============================================================

  const getWishlistIds =
    useCallback((): string[] => {
      if (
        typeof window ===
        'undefined'
      ) {
        return [];
      }

      try {
        const stored =
          localStorage.getItem(
            WISHLIST_STORAGE_KEY
          );

        if (!stored) {
          return [];
        }

        const parsed =
          JSON.parse(stored);

        if (
          !Array.isArray(parsed)
        ) {
          return [];
        }

        return parsed.map(String);
      } catch (error) {
        console.error(
          'Failed to read wishlist:',
          error
        );

        return [];
      }
    }, []);

  // ============================================================
  // LOAD WISHLIST PRODUCTS
  // ============================================================

  const loadWishlistProducts =
    useCallback(
      async (
        ids?: string[]
      ) => {
        const currentIds =
          ids || getWishlistIds();

        setWishlistIds(
          currentIds
        );

        if (
          currentIds.length === 0
        ) {
          setWishlistProducts([]);
          return;
        }

        try {
          setWishlistLoading(
            true
          );

          /*
           * Fetch products from the existing
           * products API.
           *
           * We retrieve a large enough list and
           * then match the IDs stored in localStorage.
           */
          const response =
            await fetch(
              '/api/products?limit=1000',
              {
                method: 'GET',
                cache: 'no-store',
              }
            );

          if (!response.ok) {
            throw new Error(
              'Failed to load wishlist products'
            );
          }

          const result =
            await response.json();

          const products =
            Array.isArray(
              result?.data
            )
              ? result.data
              : [];

          /*
           * Match wishlist IDs with
           * product _id / id.
           */
          const matchedProducts =
            currentIds
              .map(
                (wishlistId) =>
                  products.find(
                    (
                      product: WishlistProduct
                    ) =>
                      String(
                        product._id ||
                        product.id
                      ) ===
                      String(
                        wishlistId
                      )
                  )
              )
              .filter(
                Boolean
              ) as WishlistProduct[];

          setWishlistProducts(
            matchedProducts
          );
        } catch (error) {
          console.error(
            'Failed to load wishlist products:',
            error
          );

          setWishlistProducts([]);
        } finally {
          setWishlistLoading(
            false
          );
        }
      },
      [getWishlistIds]
    );

  // ============================================================
  // INITIAL WISHLIST LOAD
  // ============================================================

  useEffect(() => {
    const ids =
      getWishlistIds();

    setWishlistIds(ids);

    /*
     * Load product information if
     * there are wishlist products.
     */
    if (ids.length > 0) {
      loadWishlistProducts(ids);
    }
  }, [
    getWishlistIds,
    loadWishlistProducts,
  ]);

  // ============================================================
  // WISHLIST UPDATED EVENT
  // ============================================================

  useEffect(() => {
    const handleWishlistUpdated =
      () => {
        const ids =
          getWishlistIds();

        setWishlistIds(ids);

        loadWishlistProducts(
          ids
        );
      };

    window.addEventListener(
      'wishlistUpdated',
      handleWishlistUpdated
    );

    return () => {
      window.removeEventListener(
        'wishlistUpdated',
        handleWishlistUpdated
      );
    };
  }, [
    getWishlistIds,
    loadWishlistProducts,
  ]);

  // ============================================================
  // SYNC WISHLIST BETWEEN TABS
  // ============================================================

  useEffect(() => {
    const handleStorage =
      (
        event: StorageEvent
      ) => {
        if (
          event.key !==
          WISHLIST_STORAGE_KEY
        ) {
          return;
        }

        const ids =
          getWishlistIds();

        setWishlistIds(ids);

        loadWishlistProducts(
          ids
        );
      };

    window.addEventListener(
      'storage',
      handleStorage
    );

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, [
    getWishlistIds,
    loadWishlistProducts,
  ]);

  // ============================================================
  // REMOVE PRODUCT FROM WISHLIST
  // ============================================================

  const removeFromWishlist =
    useCallback(
      (
        productId: string
      ) => {
        try {
          const current =
            getWishlistIds();

          const updated =
            current.filter(
              (id) =>
                id !==
                String(
                  productId
                )
            );

          localStorage.setItem(
            WISHLIST_STORAGE_KEY,
            JSON.stringify(
              updated
            )
          );

          setWishlistIds(
            updated
          );

          setWishlistProducts(
            (previous) =>
              previous.filter(
                (product) =>
                  String(
                    product._id ||
                    product.id
                  ) !==
                  String(
                    productId
                  )
              )
          );

          window.dispatchEvent(
            new CustomEvent(
              'wishlistUpdated'
            )
          );
        } catch (error) {
          console.error(
            'Failed to remove wishlist item:',
            error
          );
        }
      },
      [getWishlistIds]
    );

  // ============================================================
  // LIVE PRODUCT SEARCH
  // ============================================================

  useEffect(() => {
    if (
      debounceRef.current
    ) {
      clearTimeout(
        debounceRef.current
      );

      debounceRef.current =
        null;
    }

    const q =
      searchQuery.trim();

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

    const currentRequestId =
      ++requestIdRef.current;

    setSearchOpen(true);
    setSearchLoading(true);

    debounceRef.current =
      setTimeout(
        async () => {
          try {
            const response =
              await fetch(
                `/api/products?search=${encodeURIComponent(
                  q
                )}&limit=6`,
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

            const result =
              await response.json();

            if (
              currentRequestId !==
              requestIdRef.current
            ) {
              return;
            }

            const products =
              Array.isArray(
                result?.data
              )
                ? result.data
                : [];

            const items: SearchResult[] =
              products.map(
                (
                  product: SearchResult
                ) => ({
                  ...product,
                  id:
                    product._id ||
                    product.id,
                })
              );

            setSearchResults(
              items
            );

            setSearchOpen(
              true
            );
          } catch (error) {
            if (
              currentRequestId !==
              requestIdRef.current
            ) {
              return;
            }

            console.error(
              'Live product search error:',
              error
            );

            setSearchResults([]);
            setSearchOpen(true);
          } finally {
            if (
              currentRequestId ===
              requestIdRef.current
            ) {
              setSearchLoading(
                false
              );
            }
          }
        },
        150
      );

    return () => {
      if (
        debounceRef.current
      ) {
        clearTimeout(
          debounceRef.current
        );

        debounceRef.current =
          null;
      }
    };
  }, [searchQuery]);

  // ============================================================
  // CLOSE SEARCH WHEN CLICKING OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside =
      (event: MouseEvent) => {
        if (
          searchRef.current &&
          !searchRef.current.contains(
            event.target as Node
          )
        ) {
          setSearchOpen(false);
          setSearchFocused(false);
        }
      };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

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

  const handleSearchSubmit =
    (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      const q =
        searchQuery.trim();

      if (!q) {
        return;
      }

      setSearchOpen(false);

      router.push(
        `/products?search=${encodeURIComponent(
          q
        )}`
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
      description:
        'Browse all products',
    },
    {
      href: '/orders',
      label: 'My Orders',
      icon: ClipboardList,
      description:
        'Track your purchases',
    },
    {
      href: '/account',
      label: 'Account',
      icon: User,
      description:
        'Manage your profile',
    },
  ];

  // ============================================================
  // QUICK LINKS
  // ============================================================

  const quickLinks = [
    {
      icon: Gift,
      label: 'Gifts',
      href: '/products?category=gifts',
    },
    {
      icon: Tag,
      label: 'Sale',
      href: '/products?onSale=true',
    },
  ];

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <>
      <header
        className={`
          sticky top-0 z-50 w-full transition-all duration-500
          ${scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border-b border-gray-100/50'
            : 'bg-white border-b border-gray-100/30 '
          }
        `}
      >
        {/* ====================================================
            MAIN HEADER
        ==================================================== */}

        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="h-16 md:h-14 flex items-center gap-2 sm:gap-4">

            {/* =================================================
                MOBILE MENU
            ================================================= */}

            <div className="md:hidden shrink-0">
              <Sheet
                open={
                  mobileOpen
                }
                onOpenChange={
                  setMobileOpen
                }
              >
                <SheetTrigger
                  asChild
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                    className="h-9 w-9 hover:bg-[#7A1F3D]/5 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <Menu className="h-5 w-5 text-gray-700" />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-80 flex flex-col bg-gradient-to-b from-white to-gray-50/50"
                >
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-[#7A1F3D]">
                      {settings?.logo && (
                        <img
                          src={
                            settings.logo
                          }
                          alt={
                            storeName
                          }
                          className="h-8 w-auto object-contain"
                        />
                      )}

                      <span className="text-xl font-bold">
                        {
                          storeName
                        }
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <nav className="mt-8 flex flex-col gap-1">
                    {navLinks.map(
                      (
                        link,
                        index
                      ) => (
                        <motion.div
                          key={
                            link.href
                          }
                          initial="initial"
                          animate="animate"
                          variants={
                            itemFade
                          }
                          transition={{
                            delay:
                              index *
                              0.05,
                          }}
                        >
                          <Link
                            href={
                              link.href
                            }
                            onClick={() =>
                              setMobileOpen(
                                false
                              )
                            }
                            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-[#7A1F3D]/5 hover:text-[#7A1F3D] hover:scale-[1.02] transition-all duration-300 group"
                          >
                            <div className="p-2 rounded-lg bg-[#7A1F3D]/5 group-hover:bg-[#7A1F3D]/10 transition-colors">
                              <link.icon className="h-4 w-4 text-[#7A1F3D]" />
                            </div>

                            <div>
                              <div className="font-semibold">
                                {
                                  link.label
                                }
                              </div>

                              <div className="text-[10px] text-gray-400">
                                {
                                  link.description
                                }
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      )
                    )}
                  </nav>

                  {/* QUICK LINKS */}

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
                      Quick Links
                    </p>

                    <div className="grid grid-cols-3 gap-2 px-4">

                      {quickLinks.map(
                        (link) => (
                          <Link
                            key={
                              link.href
                            }
                            href={
                              link.href
                            }
                            onClick={() =>
                              setMobileOpen(
                                false
                              )
                            }
                            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 hover:bg-[#7A1F3D]/5 transition-colors group"
                          >
                            <link.icon className="h-4 w-4 text-gray-400 group-hover:text-[#7A1F3D] transition-colors" />

                            <span className="text-[10px] font-medium text-gray-600 group-hover:text-[#7A1F3D] transition-colors">
                              {
                                link.label
                              }
                            </span>
                          </Link>
                        )
                      )}

                      {/* MOBILE WISHLIST */}

                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          setWishlistOpen(true);
                          loadWishlistProducts();
                        }}
                        className="relative flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 hover:bg-[#7A1F3D]/5 transition-all duration-300 group"
                      >
                        <Heart className="h-4 w-4 text-gray-400 group-hover:text-[#7A1F3D] transition-colors" />

                        {wishlistIds.length >
                          0 && (
                            <span className="absolute top-1 right-1.5 w-4 h-4 rounded-full bg-[#7A1F3D] text-white text-[8px] font-bold leading-none flex items-center justify-center">
                              {wishlistIds.length}
                            </span>
                          )}

                        <span className="text-[10px] font-medium text-gray-600 group-hover:text-[#7A1F3D] transition-colors">
                          Wishlist
                        </span>
                      </button>

                    </div>
                  </div>

                  {/* ACCOUNT SECTION */}

                  <div className="mt-auto pt-6">
                    <div className="border-t border-gray-100 pt-5">

                      {!customerHydrated ? (
                        <div className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gray-100 animate-pulse" />

                            <div className="space-y-2 flex-1">
                              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                              <div className="h-2.5 w-32 bg-gray-100 rounded animate-pulse" />
                            </div>
                          </div>
                        </div>
                      ) : customer ? (
                        <div className="space-y-3 px-4">

                          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#7A1F3D]/5 to-[#7A1F3D]/10">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7A1F3D] to-[#9B2D5A] flex items-center justify-center shrink-0 shadow-lg shadow-[#7A1F3D]/20">
                              <User className="h-5 w-5 text-white" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {
                                  customer.name
                                }
                              </p>

                              <p className="text-xs text-gray-500 truncate">
                                {
                                  customer.email
                                }
                              </p>
                            </div>
                          </div>

                          <Link
                            href="/account"
                            onClick={() =>
                              setMobileOpen(
                                false
                              )
                            }
                            className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <User className="h-4 w-4 text-[#7A1F3D]" />
                            My Account
                          </Link>

                          <button
                            type="button"
                            onClick={
                              handleCustomerLogout
                            }
                            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left"
                          >
                            <LogOut className="h-4 w-4" />
                            Log Out
                          </button>

                        </div>
                      ) : (
                        <div className="space-y-3 px-4">

                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-900">
                              Welcome back! 👋
                            </p>

                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              Sign in to track your orders and manage your account.
                            </p>
                          </div>

                          <Link
                            href="/account"
                            onClick={() =>
                              setMobileOpen(
                                false
                              )
                            }
                            className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-gradient-to-r from-[#7A1F3D] to-[#9B2D5A] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#7A1F3D]/20 transition-all duration-300 hover:scale-[1.02]"
                          >
                            <LogIn className="h-4 w-4" />
                            Login
                          </Link>

                          <Link
                            href="/account?tab=register"
                            onClick={() =>
                              setMobileOpen(
                                false
                              )
                            }
                            className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-xl border-2 border-[#7A1F3D] text-[#7A1F3D] text-sm font-semibold hover:bg-[#7A1F3D]/5 transition-all duration-300 hover:scale-[1.02]"
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
              className="flex items-center gap-3 shrink-0 group"
            >
              {settings?.logo ? (
                <motion.div
                  whileHover={{
                    scale: 1.05,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                  }}
                >
                  <img
                    src={
                      settings.logo
                    }
                    alt={
                      storeName
                    }
                    width={56}
                    height={56}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-12 sm:h-14 w-auto object-contain"
                  />
                </motion.div>
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#7A1F3D] to-[#9B2D5A] flex items-center justify-center shadow-lg shadow-[#7A1F3D]/20">
                  <span className="text-white font-bold text-lg">
                    {storeName.charAt(
                      0
                    )}
                  </span>
                </div>
              )}

              <div className="hidden sm:block">
                <span className="block text-lg font-bold tracking-tight text-[#7A1F3D] leading-none">
                  {
                    storeName
                  }
                </span>

                <span className="block text-[9px] text-gray-400 mt-1 tracking-[0.15em] uppercase flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-[#7A1F3D]" />
                  Premium Quality
                </span>
              </div>
            </Link>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}

            <nav className="hidden lg:flex items-center gap-0.5 ml-4">
              {navLinks.map(
                (link) => (
                  <Link
                    key={
                      link.href
                    }
                    href={
                      link.href
                    }
                    className="group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 rounded-xl hover:text-[#7A1F3D] transition-all duration-300 hover:scale-105"
                  >
                    <link.icon className="h-4 w-4 text-gray-400 group-hover:text-[#7A1F3D] transition-colors" />

                    {
                      link.label
                    }
                  </Link>
                )
              )}
            </nav>

            {/* =================================================
                SEARCH
            ================================================= */}

            <div
              ref={searchRef}
              className="flex-1 min-w-0 max-w-xl ml-auto lg:ml-4 relative"
            >
              <motion.form
                onSubmit={
                  handleSearchSubmit
                }
                initial={false}
                animate={
                  searchFocused
                    ? {
                      scale: 1.02,
                    }
                    : {
                      scale: 1,
                    }
                }
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
              >
                <div className="relative">

                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none transition-colors duration-300" />

                  <Input
                    type="search"
                    placeholder="Search for fashion, bracelets & more..."
                    value={
                      searchQuery
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchQuery(
                        event
                          .target
                          .value
                      )
                    }
                    onFocus={() => {
                      if (
                        searchQuery.trim()
                      ) {
                        setSearchOpen(
                          true
                        );
                      }

                      setSearchFocused(
                        true
                      );
                    }}
                    onBlur={() =>
                      setSearchFocused(
                        false
                      )
                    }
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
                      focus-visible:ring-[#7A1F3D]/15
                      transition-all
                      duration-300
                      [&::-webkit-search-cancel-button]:appearance-none
                      [&::-webkit-search-decoration]:appearance-none
                      focus-visible:ring-[0.5px]
                      focus-visible:ring-[#7A1F3D]
                    "
                  />

                  {searchQuery && (
                    <motion.button
                      type="button"
                      onClick={
                        clearSearch
                      }
                      initial={{
                        scale: 0,
                      }}
                      animate={{
                        scale: 1,
                      }}
                      className="absolute right-3 top-3 -translate-y-1/2 text-gray-400 hover:text-[#7A1F3D] transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </motion.button>
                  )}

                </div>
              </motion.form>

              {/* SEARCH DROPDOWN */}

              <AnimatePresence>
                {searchOpen && searchQuery.trim() && (
                  <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={fadeInDown}
                    transition={{ duration: 0.2 }}
                    className="
    absolute
    top-full
    mt-2
    z-50
    overflow-hidden
    bg-white
    border
    border-gray-100
    rounded-xl
    sm:rounded-2xl
    shadow-2xl

    /* Mobile */
    left-0
    right-0
    w-full

    /* Desktop */
    sm:left-0
    sm:right-0
    sm:w-auto

    max-w-full
  "
                  >
                    {searchLoading ? (
                      <div className="p-5 sm:p-8 text-center">
                        <div className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 rounded-full border-2 border-gray-200 border-t-[#7A1F3D] animate-spin" />

                        <p className="text-[10px] sm:text-sm text-gray-400 font-medium">
                          Searching products...
                        </p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        <div className="max-h-[320px] sm:max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                          {searchResults.map((product, index) => (
                            <motion.div
                              key={
                                product.id ||
                                product._id ||
                                product.slug
                              }
                              initial="initial"
                              animate="animate"
                              variants={itemFade}
                              transition={{
                                delay: index * 0.03,
                              }}
                            >
                              <Link
                                href={`/products/${product.slug}`}
                                onClick={() => {
                                  setSearchOpen(false);
                                  setSearchQuery('');
                                }}
                                className="
                    flex
                    items-center
                    gap-2
                    sm:gap-4
                    px-2.5
                    sm:px-4
                    py-2
                    sm:py-3
                    hover:bg-gray-50/80
                    transition-all
                    duration-200
                    group
                  "
                              >
                                {/* Product Image */}
                                <div
                                  className="
                      w-9
                      h-9
                      sm:w-12
                      sm:h-12
                      rounded-lg
                      sm:rounded-xl
                      bg-gray-100
                      shrink-0
                      overflow-hidden
                      border
                      border-gray-100
                      group-hover:border-[#7A1F3D]/20
                      transition-colors
                    "
                                >
                                  <img
                                    src={
                                      product.images?.[0] ||
                                      '/placeholder.png'
                                    }
                                    alt={product.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="
                        w-full
                        h-full
                        object-cover
                        group-hover:scale-105
                        transition-transform
                        duration-300
                      "
                                  />
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="
                        text-[14px]
                        sm:text-sm
                        font-medium
                        text-gray-900
                        truncate
                        leading-tight
                        group-hover:text-[#7A1F3D]
                        transition-colors
                      "
                                  >
                                    {product.name}
                                  </p>

                                  <div className="flex items-center flex-wrap gap-x-1.5 sm:gap-x-2 mt-0.5">
                                    {/* Current Price */}
                                    <span
                                      className="
                          text-[10px]
                          sm:text-sm
                          font-bold
                          text-[#7A1F3D]
                        "
                                    >
                                      {formatCurrency(
                                        product.price,
                                        currency
                                      )}
                                    </span>

                                    {/* Compare Price */}
                                    {product.compare_price >
                                      product.price && (
                                        <span
                                          className="
                            text-[11px]
                            sm:text-xs
                            text-gray-400
                            line-through
                          "
                                        >
                                          {formatCurrency(
                                            product.compare_price,
                                            currency
                                          )}
                                        </span>
                                      )}

                                    {/* Sale Badge */}
                                    {product.compare_price >
                                      product.price && (
                                        <Badge
                                          className="
                            bg-red-500
                            text-white
                            text-[7px]
                            sm:text-[8px]
                            px-1
                            sm:px-1.5
                            py-0
                            h-3.5
                            sm:h-4
                            leading-none
                          "
                                        >
                                          SALE
                                        </Badge>
                                      )}
                                  </div>
                                </div>

                                {/* Arrow */}
                                <ArrowRight
                                  className="
                      h-3
                      w-3
                      sm:h-4
                      sm:w-4
                      shrink-0
                      text-gray-300
                      group-hover:text-[#7A1F3D]
                      group-hover:translate-x-1
                      transition-all
                    "
                                />
                              </Link>
                            </motion.div>
                          ))}
                        </div>

                        {/* View All Results */}
                        <Link
                          href={`/products?search=${encodeURIComponent(
                            searchQuery.trim()
                          )}`}
                          onClick={() => setSearchOpen(false)}
                          className="
              block
              px-3
              sm:px-4
              py-2.5
              sm:py-3.5
              text-[10px]
              sm:text-xs
              text-center
              font-semibold
              bg-gradient-to-r
              from-[#7A1F3D]/5
              to-[#9B2D5A]/5
              hover:from-[#7A1F3D]/10
              hover:to-[#9B2D5A]/10
              transition-all
              duration-300
            "
                        >
                          <span className="flex items-center justify-center gap-1.5 sm:gap-2 text-[#7A1F3D]">
                            View all results

                            <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </span>
                        </Link>
                      </>
                    ) : (
                      <div className="p-5 sm:p-8 text-center">
                        <div
                          className="
              h-10
              w-10
              sm:h-14
              sm:w-14
              mx-auto
              mb-2
              sm:mb-4
              rounded-full
              bg-gray-50
              flex
              items-center
              justify-center
            "
                        >
                          <Search className="h-4 w-4 sm:h-6 sm:w-6 text-gray-300" />
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-gray-700">
                          No products found
                        </p>

                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                          Try adjusting your search terms
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* =================================================
                QUICK LINKS + WISHLIST
            ================================================= */}

            <div className="hidden lg:flex items-center gap-1 shrink-0">

              {/* GIFTS */}

              {quickLinks.map(
                (link) => (
                  <Link
                    key={
                      link.href
                    }
                    href={
                      link.href
                    }
                    className="p-2.5 rounded-full hover:bg-[#7A1F3D]/5 transition-all duration-300 hover:scale-110 group relative"
                  >
                    <link.icon className="h-4 w-4 text-gray-500 group-hover:text-[#7A1F3D] transition-colors" />

                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-semibold tracking-wide group-hover:text-[#7A1F3D] transition-colors">
                      {
                        link.label
                      }
                    </span>
                  </Link>
                )
              )}

              {/* =================================================
                  WISHLIST ICON + DROPDOWN
              ================================================= */}

              <div
                ref={
                  wishlistRef
                }
                className="relative"
                onMouseEnter={() =>
                  setWishlistOpen(
                    true
                  )
                }
                onMouseLeave={() =>
                  setWishlistOpen(
                    false
                  )
                }
              >

                <Link
                  href="#"
                  aria-label="Wishlist"
                  className="
                    relative
                    flex
                    items-center
                    justify-center
                    p-2.5
                    rounded-full
                    hover:bg-[#7A1F3D]/5
                    transition-all
                    duration-300
                    hover:scale-110
                    group
                  "
                >

                  <Heart
                    className={cn(
                      'h-4 w-4 transition-colors',
                      wishlistIds.length >
                        0
                        ? 'text-[#7A1F3D] fill-[#7A1F3D]/10'
                        : 'text-gray-500 group-hover:text-[#7A1F3D]'
                    )}
                  />

                  {/* COUNT */}

                  {wishlistIds.length >
                    0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="
    absolute
    -top-1.5
    -right-1.5
    w-5
    h-5
    flex
    items-center
    justify-center
    rounded-full
    bg-gradient-to-r
    from-[#7A1F3D]
    to-[#9B2D5A]
    text-white
    text-[9px]
    font-bold
    leading-none
    border-2
    border-white
    shadow-md
  "
                      >
                        {wishlistIds.length}
                      </motion.span>
                    )}

                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-semibold tracking-wide group-hover:text-[#7A1F3D] transition-colors">
                    Wishlist
                  </span>

                </Link>

                {/* =================================================
                    WISHLIST DROPDOWN
                ================================================= */}

                <AnimatePresence>
                  {wishlistOpen && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -8,
                        scale: 0.98,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: -8,
                        scale: 0.98,
                      }}
                      transition={{
                        duration: 0.18,
                      }}
                      className="
                        absolute
                        top-full
                        right-0
                        mt-3
                        w-[360px]
                        bg-white
                        border
                        border-gray-100
                        rounded-2xl
                        shadow-2xl
                        z-[100]
                        overflow-hidden
                      "
                    >

                      {/* DROPDOWN HEADER */}

                      <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-[#7A1F3D]/5 to-[#9B2D5A]/5">

                        <div className="flex items-center justify-between">

                          <div>
                            <div className="flex items-center gap-2">

                              <Heart className="h-4 w-4 text-[#7A1F3D]" />

                              <h3 className="text-sm font-bold text-gray-900">
                                My Wishlist
                              </h3>

                            </div>

                            <p className="text-[10px] text-gray-500 mt-1">
                              {
                                wishlistIds.length
                              }{' '}
                              {wishlistIds.length ===
                                1
                                ? 'item'
                                : 'items'}{' '}
                              saved
                            </p>
                          </div>



                        </div>
                      </div>

                      {/* DROPDOWN CONTENT */}

                      {wishlistLoading ? (
                        <div className="py-10 text-center">

                          <Loader2 className="h-6 w-6 mx-auto text-[#7A1F3D] animate-spin mb-2" />

                          <p className="text-xs text-gray-400">
                            Loading wishlist...
                          </p>

                        </div>
                      ) : wishlistProducts.length >
                        0 ? (
                        <>

                          <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50">

                            {wishlistProducts.map(
                              (
                                product,
                                index
                              ) => {

                                const productId =
                                  String(
                                    product._id ||
                                    product.id ||
                                    ''
                                  );

                                return (
                                  <motion.div
                                    key={
                                      productId
                                    }
                                    initial={{
                                      opacity: 0,
                                      x: -8,
                                    }}
                                    animate={{
                                      opacity: 1,
                                      x: 0,
                                    }}
                                    transition={{
                                      delay:
                                        index *
                                        0.03,
                                    }}
                                    className="group/item flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                  >

                                    {/* PRODUCT LINK */}

                                    <Link
                                      href={`/products/${product.slug}`}
                                      onClick={() =>
                                        setWishlistOpen(
                                          false
                                        )
                                      }
                                      className="flex items-center gap-3 flex-1 min-w-0"
                                    >

                                      {/* IMAGE */}

                                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">

                                        <img
                                          src={
                                            product
                                              .images?.[0] ||
                                            '/placeholder.png'
                                          }
                                          alt={
                                            product.name
                                          }
                                          loading="lazy"
                                          decoding="async"
                                          className="h-full w-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                                        />

                                      </div>

                                      {/* INFORMATION */}

                                      <div className="min-w-0 flex-1">

                                        <p className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover/item:text-[#7A1F3D] transition-colors">
                                          {
                                            product.name
                                          }
                                        </p>

                                        <div className="flex items-center gap-2 mt-1">

                                          <span className="text-xs font-bold text-[#7A1F3D]">
                                            {formatCurrency(
                                              product.price,
                                              currency
                                            )}
                                          </span>

                                          {product.compare_price >
                                            product.price && (
                                              <span className="text-[10px] text-gray-400 line-through">
                                                {formatCurrency(
                                                  product.compare_price,
                                                  currency
                                                )}
                                              </span>
                                            )}

                                        </div>

                                      </div>

                                    </Link>

                                    {/* REMOVE */}

                                    <button
                                      type="button"
                                      onClick={(
                                        event
                                      ) => {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        removeFromWishlist(
                                          productId
                                        );
                                      }}
                                      aria-label="Remove from wishlist"
                                      className="
                                        h-7
                                        w-7
                                        shrink-0
                                        flex
                                        items-center
                                        justify-center
                                        rounded-full
                                        text-gray-300
                                        hover:text-red-500
                                        hover:bg-red-50
                                        transition-colors
                                      "
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>

                                  </motion.div>
                                );
                              }
                            )}

                          </div>

                          {/* FOOTER */}

                        </>
                      ) : (
                        /* EMPTY STATE */

                        <div className="py-10 px-6 text-center">

                          <div className="h-14 w-14 mx-auto mb-4 rounded-full bg-[#7A1F3D]/5 flex items-center justify-center">

                            <Heart className="h-6 w-6 text-[#7A1F3D]/40" />

                          </div>

                          <p className="text-sm font-semibold text-gray-700">
                            Your wishlist is empty
                          </p>

                          <p className="text-xs text-gray-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                            Save your favorite products by clicking the heart icon.
                          </p>

                          <Link
                            href="/products"
                            onClick={() =>
                              setWishlistOpen(
                                false
                              )
                            }
                            className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#7A1F3D] hover:underline"
                          >
                            Start Shopping
                            <ArrowRight className="h-3 w-3" />
                          </Link>

                        </div>
                      )}

                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>

            {/* =================================================
                CART
            ================================================= */}

            <motion.button
              onClick={() =>
                setCartOpen(
                  true
                )
              }
              whileHover={{
                scale: 1.05,
              }}
              whileTap={{
                scale: 0.95,
              }}
              className="relative shrink-0 inline-flex items-center gap-2 h-10 px-3 sm:px-4 rounded-xl hover:bg-[#7A1F3D]/5 transition-all duration-300 group"
              aria-label="Open cart"
            >

              <div className="relative">

                <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-[#7A1F3D] transition-colors" />

                {hydrated &&
                  totalItems >
                  0 && (
                    <motion.div
                      initial={{
                        scale: 0,
                      }}
                      animate={{
                        scale: 1,
                      }}
                      className="absolute -top-2 -right-2"
                    >
                      <Badge className="h-5 min-w-[20px] flex items-center justify-center bg-gradient-to-r from-[#7A1F3D] to-[#9B2D5A] text-white text-[9px] font-bold px-1.5 border-2 border-white shadow-md shadow-[#7A1F3D]/20">
                        {
                          totalItems
                        }
                      </Badge>
                    </motion.div>
                  )}

              </div>

              <span className="hidden sm:block text-xs font-semibold text-gray-700 group-hover:text-[#7A1F3D] transition-colors">
                Cart
              </span>

            </motion.button>

          </div>
        </div>
      </header>

      {/* ========================================================
    MOBILE WISHLIST MODAL
======================================================== */}

      <AnimatePresence>
        {wishlistOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-[200] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* BACKDROP */}

            <motion.button
              type="button"
              aria-label="Close wishlist"
              onClick={() => setWishlistOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* MODAL */}

            <motion.div
              initial={{
                opacity: 0,
                y: 80,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 80,
                scale: 0.97,
              }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 30,
              }}
              className="
          relative
          w-full
          max-w-lg
          bg-white
          rounded-t-[28px]
          shadow-[0_-10px_50px_rgba(0,0,0,0.2)]
          overflow-hidden
          max-h-[92dvh]
          flex
          flex-col
        "
            >

              {/* ==================================================
            HEADER
        ================================================== */}

              <div
                className="
            relative
            shrink-0
            px-5
            pt-5
            pb-4
            bg-gradient-to-br
            from-[#7A1F3D]
            via-[#852347]
            to-[#9B2D5A]
            text-white
          "
              >

                {/* Decorative circles */}

                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />

                <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-white/5" />

                {/* Close */}

                <button
                  type="button"
                  onClick={() =>
                    setWishlistOpen(false)
                  }
                  aria-label="Close wishlist"
                  className="
              absolute
              right-4
              top-4
              h-9
              w-9
              rounded-full
              bg-white/10
              hover:bg-white/20
              flex
              items-center
              justify-center
              transition-all
              duration-200
            "
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header content */}

                <div className="relative flex items-center gap-3">

                  <div
                    className="
                h-11
                w-11
                rounded-2xl
                bg-white/15
                border
                border-white/20
                flex
                items-center
                justify-center
                shadow-lg
              "
                  >
                    <Heart
                      className="h-5 w-5"
                      fill="currentColor"
                    />
                  </div>

                  <div className="min-w-0 pr-10">

                    <h2 className="text-lg font-bold tracking-tight">
                      My Wishlist
                    </h2>

                    <p className="text-[11px] text-white/70 mt-0.5">
                      {wishlistIds.length === 0
                        ? 'Save your favorite products'
                        : `${wishlistIds.length} ${wishlistIds.length === 1
                          ? 'product'
                          : 'products'
                        } saved`}
                    </p>

                  </div>

                </div>

              </div>

              {/* ==================================================
            CONTENT
        ================================================== */}

              <div className="overflow-y-auto overscroll-contain">

                {wishlistLoading ? (

                  /* LOADING */

                  <div className="py-16 px-6 text-center">

                    <div
                      className="
                  h-14
                  w-14
                  mx-auto
                  rounded-2xl
                  bg-[#7A1F3D]/5
                  flex
                  items-center
                  justify-center
                  mb-4
                "
                    >
                      <Loader2
                        className="
                    h-6
                    w-6
                    text-[#7A1F3D]
                    animate-spin
                  "
                      />
                    </div>

                    <p className="text-sm font-semibold text-gray-800">
                      Loading your wishlist
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Please wait...
                    </p>

                  </div>

                ) : wishlistProducts.length > 0 ? (

                  <div className="p-4 space-y-3">

                    {/* Small title */}

                    <div className="flex items-center justify-between px-1 pb-1">

                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Saved Items
                      </p>

                      <span className="text-[10px] text-gray-400">
                        {wishlistProducts.length}{' '}
                        {wishlistProducts.length === 1
                          ? 'item'
                          : 'items'}
                      </span>

                    </div>

                    {/* PRODUCTS */}

                    {wishlistProducts.map(
                      (
                        product,
                        index
                      ) => {

                        const productId =
                          String(
                            product._id ||
                            product.id ||
                            ''
                          );

                        const isSale =
                          product.compare_price >
                          product.price;

                        return (
                          <motion.div
                            key={productId}
                            initial={{
                              opacity: 0,
                              y: 10,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              delay:
                                index * 0.04,
                            }}
                            className="
                        relative
                        group
                        flex
                        gap-3
                        p-3
                        rounded-2xl
                        bg-gray-50/80
                        border
                        border-gray-100
                        hover:border-[#7A1F3D]/15
                        hover:bg-white
                        hover:shadow-md
                        transition-all
                        duration-300
                      "
                          >

                            {/* PRODUCT */}

                            <Link
                              href={`/products/${product.slug}`}
                              onClick={() =>
                                setWishlistOpen(
                                  false
                                )
                              }
                              className="flex flex-1 min-w-0 gap-3"
                            >

                              {/* IMAGE */}

                              <div
                                className="
                            relative
                            h-[88px]
                            w-[72px]
                            shrink-0
                            overflow-hidden
                            rounded-xl
                            bg-white
                            border
                            border-gray-100
                          "
                              >

                                <img
                                  src={
                                    product.images?.[0] ||
                                    '/placeholder.png'
                                  }
                                  alt={
                                    product.name
                                  }
                                  loading="lazy"
                                  decoding="async"
                                  className="
                              h-full
                              w-full
                              object-cover
                              group-hover:scale-105
                              transition-transform
                              duration-500
                            "
                                />

                                {/* SALE */}

                                {isSale && (
                                  <span
                                    className="
                                absolute
                                left-1.5
                                top-1.5
                                px-1.5
                                py-0.5
                                rounded-md
                                bg-[#7A1F3D]
                                text-white
                                text-[7px]
                                font-bold
                                tracking-wide
                              "
                                  >
                                    SALE
                                  </span>
                                )}

                              </div>

                              {/* INFO */}

                              <div className="flex-1 min-w-0 py-1">

                                <div className="pr-6">

                                  <h3
                                    className="
                                text-sm
                                font-semibold
                                leading-snug
                                text-gray-900
                                line-clamp-2
                                group-hover:text-[#7A1F3D]
                                transition-colors
                              "
                                  >
                                    {
                                      product.name
                                    }
                                  </h3>

                                </div>

                                {/* PRICE */}

                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2">

                                  <span
                                    className="
                                text-sm
                                font-bold
                                text-[#7A1F3D]
                              "
                                  >
                                    {formatCurrency(
                                      product.price,
                                      currency
                                    )}
                                  </span>

                                  {isSale && (
                                    <span
                                      className="
                                  text-[10px]
                                  text-gray-400
                                  line-through
                                "
                                    >
                                      {formatCurrency(
                                        product.compare_price,
                                        currency
                                      )}
                                    </span>
                                  )}

                                </div>

                                {/* VIEW */}

                                <div
                                  className="
                              flex
                              items-center
                              gap-1
                              mt-2
                              text-[10px]
                              font-semibold
                              text-gray-400
                              group-hover:text-[#7A1F3D]
                              transition-colors
                            "
                                >
                                  View product

                                  <ArrowRight
                                    className="
                                h-3
                                w-3
                                group-hover:translate-x-0.5
                                transition-transform
                              "
                                  />
                                </div>

                              </div>

                            </Link>

                            {/* REMOVE */}

                            <button
                              type="button"
                              onClick={(
                                event
                              ) => {
                                event.preventDefault();
                                event.stopPropagation();

                                removeFromWishlist(
                                  productId
                                );
                              }}
                              aria-label="Remove from wishlist"
                              className="
                          absolute
                          right-2.5
                          top-2.5
                          h-7
                          w-7
                          rounded-full
                          bg-white
                          border
                          border-gray-100
                          text-gray-300
                          flex
                          items-center
                          justify-center
                          shadow-sm
                          hover:text-red-500
                          hover:border-red-100
                          hover:bg-red-50
                          transition-all
                          duration-200
                        "
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>

                          </motion.div>
                        );
                      }
                    )}

                  </div>

                ) : (

                  /* EMPTY */

                  <div className="px-6 py-14 text-center">

                    <motion.div
                      initial={{
                        scale: 0.8,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                      }}
                      className="
                  h-20
                  w-20
                  mx-auto
                  rounded-[24px]
                  bg-gradient-to-br
                  from-[#7A1F3D]/5
                  to-[#9B2D5A]/10
                  border
                  border-[#7A1F3D]/10
                  flex
                  items-center
                  justify-center
                  mb-5
                "
                    >
                      <Heart
                        className="
                    h-9
                    w-9
                    text-[#7A1F3D]/40
                  "
                      />
                    </motion.div>

                    <h3 className="text-base font-bold text-gray-800">
                      Your wishlist is empty
                    </h3>

                    <p
                      className="
                  text-xs
                  text-gray-400
                  mt-2
                  max-w-[240px]
                  mx-auto
                  leading-relaxed
                "
                    >
                      Save products you love here
                      and easily find them later.
                    </p>

                    <Link
                      href="/products"
                      onClick={() =>
                        setWishlistOpen(false)
                      }
                      className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  mt-6
                  h-10
                  px-5
                  rounded-xl
                  bg-gradient-to-r
                  from-[#7A1F3D]
                  to-[#9B2D5A]
                  text-white
                  text-xs
                  font-semibold
                  shadow-lg
                  shadow-[#7A1F3D]/20
                  hover:shadow-xl
                  hover:scale-[1.02]
                  transition-all
                  duration-300
                "
                    >
                      Start Shopping

                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                  </div>
                )}

              </div>

              {/* ==================================================
            FOOTER
        ================================================== */}

              {wishlistProducts.length > 0 && !wishlistLoading && (
                <div
                  className="
              shrink-0
              px-4
              py-3
              border-t
              border-gray-100
              bg-white
            "
                >

                  <Link
                    href="/products"
                    onClick={() =>
                      setWishlistOpen(false)
                    }
                    className="
                flex
                items-center
                justify-center
                gap-2
                w-full
                h-11
                rounded-xl
                bg-gradient-to-r
                from-[#7A1F3D]
                to-[#9B2D5A]
                text-white
                text-xs
                font-semibold
                shadow-md
                shadow-[#7A1F3D]/15
                hover:shadow-lg
                hover:scale-[1.01]
                transition-all
                duration-300
              "
                  >
                    Continue Shopping

                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          CART DRAWER
      ======================================================== */}

      <CartDrawer
        open={
          cartOpen
        }
        onClose={() =>
          setCartOpen(
            false
          )
        }
      />
    </>
  );
}