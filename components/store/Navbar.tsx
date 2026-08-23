
// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import {
//   Search,
//   ShoppingCart,
//   Menu,
//   Grid3x3,
//   User,
//   ClipboardList,
//   X,
// } from 'lucide-react';

// import { useSettings } from '@/contexts/SettingsContext';
// import { useCart } from '@/contexts/CartContext';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';

// import {
//   Sheet,
//   SheetContent,
//   SheetTrigger,
//   SheetHeader,
//   SheetTitle,
// } from '@/components/ui/sheet';

// import CartDrawer from './CartDrawer';
// import { formatCurrency } from '@/lib/utils';

// interface SearchResult {
//   _id?: string;
//   id?: string;
//   name: string;
//   slug: string;
//   images: string[];
//   price: number;
//   compare_price: number;
// }

// export default function Navbar() {
//   const router = useRouter();

//   const { settings } = useSettings();
//   const { totalItems, hydrated } = useCart();

//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
//   const [searchOpen, setSearchOpen] = useState(false);
//   const [searchLoading, setSearchLoading] = useState(false);

//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [cartOpen, setCartOpen] = useState(false);

//   const searchRef = useRef<HTMLDivElement>(null);
//   const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const requestIdRef = useRef(0);

//   const storeName = settings?.store_name || 'Store';
//   const currency = settings?.currency || '$';

//   // ============================================================
//   // LIVE PRODUCT SEARCH
//   // ============================================================

//   useEffect(() => {
//     // Clear previous debounce
//     if (debounceRef.current) {
//       clearTimeout(debounceRef.current);
//       debounceRef.current = null;
//     }

//     const q = searchQuery.trim();

//     // ============================================================
//     // EMPTY SEARCH
//     // ============================================================

//     if (!q) {
//       setSearchResults([]);
//       setSearchOpen(false);
//       setSearchLoading(false);
//       return;
//     }

//     // ============================================================
//     // LESS THAN 2 CHARACTERS
//     // ============================================================

//     if (q.length < 2) {
//       setSearchResults([]);
//       setSearchOpen(true);
//       setSearchLoading(false);
//       return;
//     }

//     // ============================================================
//     // NEW REQUEST ID
//     // ============================================================

//     const currentRequestId = ++requestIdRef.current;

//     // Open dropdown immediately
//     setSearchOpen(true);

//     // Show loading
//     setSearchLoading(true);

//     // ============================================================
//     // DEBOUNCE
//     // ============================================================

//     debounceRef.current = setTimeout(async () => {
//       try {
//         const response = await fetch(
//           `/api/products?search=${encodeURIComponent(q)}&limit=6`,
//           {
//             method: 'GET',
//             cache: 'no-store',
//           }
//         );

//         if (!response.ok) {
//           throw new Error(
//             `Search request failed: ${response.status}`
//           );
//         }

//         const result = await response.json();

//         console.log('PRODUCT SEARCH:', {
//           query: q,
//           response: result,
//         });

//         // Ignore stale request
//         if (currentRequestId !== requestIdRef.current) {
//           return;
//         }

//         // ========================================================
//         // YOUR API RETURNS:
//         //
//         // {
//         //   success: true,
//         //   data: [],
//         //   pagination: {
//         //     total: 0
//         //   }
//         // }
//         // ========================================================

//         const products = Array.isArray(result?.data)
//           ? result.data
//           : [];

//         const items: SearchResult[] = products.map(
//           (product: SearchResult) => ({
//             ...product,
//             id: product._id || product.id,
//           })
//         );

//         // Update results
//         setSearchResults(items);

//         // IMPORTANT:
//         // Always keep dropdown open after search completes.
//         setSearchOpen(true);

//       } catch (error) {
//         // Ignore stale request errors
//         if (currentRequestId !== requestIdRef.current) {
//           return;
//         }

//         console.error('Live product search error:', error);

//         // Treat failed search as no results
//         setSearchResults([]);
//         setSearchOpen(true);

//       } finally {
//         // Only update loading for current request
//         if (currentRequestId === requestIdRef.current) {
//           setSearchLoading(false);
//         }
//       }
//     }, 150);

//     // ============================================================
//     // CLEANUP
//     // ============================================================

//     return () => {
//       if (debounceRef.current) {
//         clearTimeout(debounceRef.current);
//         debounceRef.current = null;
//       }
//     };
//   }, [searchQuery]);

//   // ============================================================
//   // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
//   // ============================================================

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         searchRef.current &&
//         !searchRef.current.contains(event.target as Node)
//       ) {
//         setSearchOpen(false);
//       }
//     };

//     document.addEventListener(
//       'mousedown',
//       handleClickOutside
//     );

//     return () => {
//       document.removeEventListener(
//         'mousedown',
//         handleClickOutside
//       );
//     };
//   }, []);

//   // ============================================================
//   // SEARCH SUBMIT
//   // ============================================================

//   const handleSearchSubmit = (
//     event: React.FormEvent
//   ) => {
//     event.preventDefault();

//     const q = searchQuery.trim();

//     if (!q) {
//       return;
//     }

//     setSearchOpen(false);

//     router.push(
//       `/products?search=${encodeURIComponent(q)}`
//     );
//   };

//   // ============================================================
//   // CLEAR SEARCH
//   // ============================================================

//   const clearSearch = () => {
//     setSearchQuery('');
//     setSearchResults([]);
//     setSearchOpen(false);
//     setSearchLoading(false);

//     requestIdRef.current++;
//   };

//   // ============================================================
//   // NAVIGATION LINKS
//   // ============================================================

//   const navLinks = [
//     {
//       href: '/products',
//       label: 'Products',
//       icon: Grid3x3,
//     },
//     {
//       href: '/orders',
//       label: 'Orders',
//       icon: ClipboardList,
//     },
//     {
//       href: '/account',
//       label: 'Account',
//       icon: User,
//     },
//   ];

//   return (
//     <>
//       <header className="sticky top-0 z-50 w-full bg-white border-b">
//         <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">

//           {/* ====================================================
//               MOBILE MENU
//           ===================================================== */}

//           <div className="md:hidden">
//             <Sheet
//               open={mobileOpen}
//               onOpenChange={setMobileOpen}
//             >
//               <SheetTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   aria-label="Open menu"
//                 >
//                   <Menu className="h-5 w-5" />
//                 </Button>
//               </SheetTrigger>

//               <SheetContent
//                 side="left"
//                 className="w-72"
//               >
//                 <SheetHeader>
//                   <SheetTitle className="text-[#7A1F3D]">
//                     {storeName}
//                   </SheetTitle>
//                 </SheetHeader>

//                 <nav className="mt-6 flex flex-col gap-1">
//                   {navLinks.map((link) => (
//                     <Link
//                       key={link.href}
//                       href={link.href}
//                       onClick={() =>
//                         setMobileOpen(false)
//                       }
//                       className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
//                     >
//                       <link.icon className="h-4 w-4 text-[#7A1F3D]" />
//                       {link.label}
//                     </Link>
//                   ))}
//                 </nav>
//               </SheetContent>
//             </Sheet>
//           </div>

//           {/* ====================================================
//               STORE LOGO / NAME
//           ===================================================== */}

//           <Link
//             href="/"
//             className="flex items-center gap-2 shrink-0"
//           >
//             {settings?.logo && (
//               <img
//                 src={settings.logo}
//                 alt={storeName}
//                 width={32}
//                 height={32}
//                 loading="eager"
//                 fetchPriority="high"
//                 decoding="async"
//                 className="h-8 w-auto object-contain"
//               />
//             )}

//             <span className="text-lg font-semibold text-[#7A1F3D] hidden sm:inline">
//               {storeName}
//             </span>
//           </Link>

//           {/* ====================================================
//               DESKTOP NAVIGATION
//           ===================================================== */}

//           <nav className="hidden md:flex items-center gap-1 ml-4">
//             {navLinks.map((link) => (
//               <Link
//                 key={link.href}
//                 href={link.href}
//                 className="font-semibold px-3 py-1.5 text-sm text-gray-600 rounded-md hover:text-[#7A1F3D] transition-colors"
//               >
//                 {link.label}
//               </Link>
//             ))}
//           </nav>

//           {/* ====================================================
//               SEARCH
//           ===================================================== */}

//           <div
//             ref={searchRef}
//             className="flex-1 max-w-md ml-auto md:mx-auto relative"
//           >
//             <form onSubmit={handleSearchSubmit}>
//               <div className="relative">

//                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

//                 <Input
//                   type="search"
//                   placeholder="Search products..."
//                   value={searchQuery}
//                   onChange={(event) =>
//                     setSearchQuery(event.target.value)
//                   }
//                   onFocus={() => {
//                     if (searchQuery.trim()) {
//                       setSearchOpen(true);
//                     }
//                   }}
//                   className="
//                     pl-9
//                     pr-8
//                     h-8
//                     text-sm
//                     rounded-sm
//                     border
//                     border-gray-200
//                     focus:border-transparent
//                     focus:ring-0
//                     focus:ring-offset-0
//                     focus:outline-none
//                     focus-visible:border-transparent
//                     focus-visible:ring-0
//                     focus-visible:ring-offset-0
//                     [&::-webkit-search-cancel-button]:appearance-none
//                     [&::-webkit-search-decoration]:appearance-none
//                   "
//                 />

//                 {searchQuery && (
//                   <button
//                     type="button"
//                     onClick={clearSearch}
//                     className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     aria-label="Clear search"
//                   >
//                     <X className="h-3.5 w-3.5" />
//                   </button>
//                 )}
//               </div>
//             </form>

//             {/* ==================================================
//                 SEARCH DROPDOWN
//             =================================================== */}

//             {searchOpen && searchQuery.trim() && (
//               <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">

//                 {/* =================================================
//                     SEARCHING
//                 ================================================== */}

//                 {searchLoading ? (
//                   <div className="p-4 text-center">
//                     <p className="text-xs text-gray-400">
//                       Searching...
//                     </p>
//                   </div>

//                 /* =================================================
//                    RESULTS
//                 ================================================== */

//                 ) : searchResults.length > 0 ? (
//                   <>
//                     <div className="max-h-80 overflow-y-auto">
//                       {searchResults.map((product) => (
//                         <Link
//                           key={
//                             product.id ||
//                             product._id ||
//                             product.slug
//                           }
//                           href={`/products/${product.slug}`}
//                           onClick={() => {
//                             setSearchOpen(false);
//                             setSearchQuery('');
//                           }}
//                           className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b last:border-0"
//                         >
//                           {/* Product image */}
//                           <div className="w-10 h-10 rounded bg-gray-100 shrink-0 overflow-hidden">
//                             <img
//                               src={
//                                 product.images?.[0] ||
//                                 '/placeholder.png'
//                               }
//                               alt={product.name}
//                               loading="lazy"
//                               decoding="async"
//                               className="w-full h-full object-cover"
//                             />
//                           </div>

//                           {/* Product details */}
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm text-gray-900 truncate">
//                               {product.name}
//                             </p>

//                             <div className="flex items-baseline gap-1.5">
//                               <span className="text-xs font-semibold text-[#7A1F3D]">
//                                 {formatCurrency(
//                                   product.price,
//                                   currency
//                                 )}
//                               </span>

//                               {product.compare_price >
//                                 product.price && (
//                                 <span className="text-[10px] text-gray-400 line-through">
//                                   {formatCurrency(
//                                     product.compare_price,
//                                     currency
//                                   )}
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         </Link>
//                       ))}
//                     </div>

//                     {/* View all */}
//                     <Link
//                       href={`/products?search=${encodeURIComponent(
//                         searchQuery.trim()
//                       )}`}
//                       onClick={() =>
//                         setSearchOpen(false)
//                       }
//                       className="block px-3 py-2.5 text-xs text-center text-black font-medium border-t bg-white hover:bg-gray-50"
//                     >
//                       View all results for &quot;
//                       {searchQuery}&quot;
//                     </Link>
//                   </>

//                 /* =================================================
//                    NO RESULTS
//                 ================================================== */

//                 ) : (
//                   <div className="p-5 text-center">

//                     <Search className="h-5 w-5 mx-auto mb-2 text-gray-300" />

//                     <p className="text-sm font-medium text-gray-700">
//                       No products found
//                     </p>

//                     <p className="text-xs text-gray-400 mt-1">
//                       No products match &quot;
//                       {searchQuery}
//                       &quot;
//                     </p>

//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* ====================================================
//               CART
//           ===================================================== */}

//           <button
//             onClick={() => setCartOpen(true)}
//             className="relative shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-gray-100 transition-colors"
//             aria-label="Open cart"
//           >
//             <ShoppingCart className="h-5 w-5 text-gray-700" />

//             {hydrated && totalItems > 0 && (
//               <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] flex items-center justify-center bg-[#7A1F3D] text-white text-[10px] px-1.5">
//                 {totalItems}
//               </Badge>
//             )}
//           </button>
//         </div>
//       </header>

//       {/* ========================================================
//           CART DRAWER
//       ========================================================= */}

//       <CartDrawer
//         open={cartOpen}
//         onClose={() => setCartOpen(false)}
//       />
//     </>
//   );
// }




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
  Truck,
  RotateCcw,
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const storeName = settings?.store_name || 'Store';
  const currency = settings?.currency || '$';

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
                  className="w-80"
                >
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

                  {/* Mobile Trust Box */}


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

                      <div className="px-3 py-2 border-b bg-gray-50">

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Products
                        </p>

                      </div>

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

          {/* ====================================================
              TRUST STRIP
          ==================================================== */}

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