
// 'use client';

// import React, {
//   memo,
//   useCallback,
//   useEffect,
//   useState,
// } from 'react';
// import Link from 'next/link';
// import {
//   ShoppingCart,
//   MessageCircle,
//   Heart,
// } from 'lucide-react';

// import { Product } from '@/lib/types';
// import {
//   formatCurrency,
//   getStockBadge,
//   cn,
// } from '@/lib/utils';

// import { useCart } from '@/contexts/CartContext';
// import { useSettings } from '@/contexts/SettingsContext';
// import { useToast } from '@/contexts/ToastContext';

// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import ReviewStars from '@/components/store/ReviewStars';

// interface ProductCardProps {
//   product: Product;
//   priority?: boolean;
// }

// interface ReviewSummary {
//   count: number;
//   average: number;
// }

// // ============================================================
// // LOCAL STORAGE KEY
// // ============================================================

// const WISHLIST_STORAGE_KEY =
//   'Veeo_wishlist';

// // ============================================================
// // PRODUCT CARD
// // ============================================================

// function ProductCardBase({
//   product,
//   priority = false,
// }: ProductCardProps) {
//   const { addItem } = useCart();
//   const { settings } = useSettings();
//   const { showToast } = useToast();

//   const currency =
//     settings?.currency || '$';

//   const stockBadge =
//     getStockBadge(product.stock);

//   const whatsappNumber =
//     settings?.whatsapp_number || '';

//   const inStock =
//     product.stock > 0;

//   const imageSrc =
//     product.images?.[0] ||
//     '/placeholder.png';

//   // ============================================================
//   // WISHLIST STATE
//   // ============================================================

//   const [isWishlisted, setIsWishlisted] =
//     useState(false);

//   const [wishlistLoading, setWishlistLoading] =
//     useState(false);

//   // ============================================================
//   // REVIEW STATE
//   // ============================================================

//   const [reviewStats, setReviewStats] =
//     useState<ReviewSummary>({
//       count: 0,
//       average: 0,
//     });

//   const [reviewsLoading, setReviewsLoading] =
//     useState(true);

//   // ============================================================
//   // GET WISHLIST FROM LOCAL STORAGE
//   // ============================================================

//   const getWishlist = useCallback((): string[] => {
//     if (
//       typeof window === 'undefined'
//     ) {
//       return [];
//     }

//     try {
//       const stored =
//         localStorage.getItem(
//           WISHLIST_STORAGE_KEY
//         );

//       if (!stored) {
//         return [];
//       }

//       const parsed =
//         JSON.parse(stored);

//       if (!Array.isArray(parsed)) {
//         return [];
//       }

//       return parsed.map(String);
//     } catch (error) {
//       console.error(
//         'Failed to read wishlist:',
//         error
//       );

//       return [];
//     }
//   }, []);

//   // ============================================================
//   // SAVE WISHLIST TO LOCAL STORAGE
//   // ============================================================

//   const saveWishlist = useCallback(
//     (wishlist: string[]) => {
//       if (
//         typeof window === 'undefined'
//       ) {
//         return;
//       }

//       try {
//         localStorage.setItem(
//           WISHLIST_STORAGE_KEY,
//           JSON.stringify(wishlist)
//         );
//       } catch (error) {
//         console.error(
//           'Failed to save wishlist:',
//           error
//         );
//       }
//     },
//     []
//   );

//   // ============================================================
//   // LOAD WISHLIST STATE
//   // ============================================================

//   useEffect(() => {
//     const wishlist =
//       getWishlist();

//     setIsWishlisted(
//       wishlist.includes(
//         String(product.id)
//       )
//     );
//   }, [
//     getWishlist,
//     product.id,
//   ]);

//   // ============================================================
//   // LISTEN FOR WISHLIST UPDATES
//   // ============================================================

//   useEffect(() => {
//     const handleWishlistUpdated =
//       () => {
//         const wishlist =
//           getWishlist();

//         setIsWishlisted(
//           wishlist.includes(
//             String(product.id)
//           )
//         );
//       };

//     window.addEventListener(
//       'wishlistUpdated',
//       handleWishlistUpdated
//     );

//     /*
//      * Also listen to storage events.
//      *
//      * This helps if another browser tab/window
//      * changes the wishlist.
//      */
//     const handleStorage =
//       (event: StorageEvent) => {
//         if (
//           event.key !==
//           WISHLIST_STORAGE_KEY
//         ) {
//           return;
//         }

//         const wishlist =
//           getWishlist();

//         setIsWishlisted(
//           wishlist.includes(
//             String(product.id)
//           )
//         );
//       };

//     window.addEventListener(
//       'storage',
//       handleStorage
//     );

//     return () => {
//       window.removeEventListener(
//         'wishlistUpdated',
//         handleWishlistUpdated
//       );

//       window.removeEventListener(
//         'storage',
//         handleStorage
//       );
//     };
//   }, [
//     getWishlist,
//     product.id,
//   ]);

//   // ============================================================
//   // WISHLIST TOGGLE
//   // ============================================================

//   const handleWishlist =
//     useCallback(
//       (
//         e: React.MouseEvent<HTMLButtonElement>
//       ) => {
//         e.preventDefault();
//         e.stopPropagation();

//         if (wishlistLoading) {
//           return;
//         }

//         try {
//           setWishlistLoading(true);

//           const productId =
//             String(product.id);

//           let wishlist =
//             getWishlist();

//           const alreadyWishlisted =
//             wishlist.includes(
//               productId
//             );

//           if (
//             alreadyWishlisted
//           ) {
//             // Remove product
//             wishlist =
//               wishlist.filter(
//                 (id) =>
//                   id !== productId
//               );

//             setIsWishlisted(false);

//             showToast(
//               'Product removed from wishlist'
//             );
//           } else {
//             // Add product
//             wishlist = [
//               ...wishlist,
//               productId,
//             ];

//             setIsWishlisted(true);

//             showToast(
//               'Product added to wishlist'
//             );
//           }

//           // Save to localStorage
//           saveWishlist(wishlist);

//           /*
//            * Notify other ProductCards,
//            * wishlist page and wishlist counter.
//            */
//           window.dispatchEvent(
//             new CustomEvent(
//               'wishlistUpdated'
//             )
//           );
//         } catch (error) {
//           console.error(
//             'Wishlist update error:',
//             error
//           );

//           showToast(
//             'Unable to update wishlist',
//             'error'
//           );
//         } finally {
//           setWishlistLoading(false);
//         }
//       },
//       [
//         getWishlist,
//         product.id,
//         saveWishlist,
//         showToast,
//         wishlistLoading,
//       ]
//     );

//   // ============================================================
//   // FETCH REVIEWS
//   // ============================================================

//   useEffect(() => {
//     let cancelled = false;

//     const fetchReviews =
//       async () => {
//         if (!product.slug) {
//           setReviewsLoading(false);
//           return;
//         }

//         try {
//           setReviewsLoading(true);

//           const response =
//             await fetch(
//               `/api/products/${product.slug}/reviews`
//             );

//           if (!response.ok) {
//             throw new Error(
//               'Failed to fetch reviews'
//             );
//           }

//           const data =
//             await response.json();

//           if (cancelled) return;

//           const reviews =
//             Array.isArray(
//               data.data
//             )
//               ? data.data
//               : [];

//           if (
//             reviews.length === 0
//           ) {
//             setReviewStats({
//               count: 0,
//               average: 0,
//             });

//             return;
//           }

//           const total =
//             reviews.reduce(
//               (
//                 sum: number,
//                 review: {
//                   rating?:
//                     | number
//                     | string;
//                 }
//               ) =>
//                 sum +
//                 Number(
//                   review.rating || 0
//                 ),
//               0
//             );

//           setReviewStats({
//             count: reviews.length,
//             average:
//               total /
//               reviews.length,
//           });
//         } catch (error) {
//           if (!cancelled) {
//             console.error(
//               'Product reviews fetch error:',
//               error
//             );

//             setReviewStats({
//               count: 0,
//               average: 0,
//             });
//           }
//         } finally {
//           if (!cancelled) {
//             setReviewsLoading(
//               false
//             );
//           }
//         }
//       };

//     fetchReviews();

//     return () => {
//       cancelled = true;
//     };
//   }, [product.slug]);

//   // ============================================================
//   // ADD TO CART
//   // ============================================================

//   const handleAddToCart =
//     useCallback(
//       (e: React.MouseEvent) => {
//         e.preventDefault();
//         e.stopPropagation();

//         if (!inStock) return;

//         addItem({
//           productId:
//             product.id,
//           name: product.name,
//           slug: product.slug,
//           image: imageSrc,
//           price: product.price,
//           comparePrice:
//             product.compare_price,
//           qty: 1,
//           stock: product.stock,
//         });

//         showToast(
//           'Product added to cart'
//         );
//       },
//       [
//         addItem,
//         imageSrc,
//         inStock,
//         product.compare_price,
//         product.id,
//         product.name,
//         product.price,
//         product.slug,
//         product.stock,
//         showToast,
//       ]
//     );

//   // ============================================================
//   // WHATSAPP
//   // ============================================================

//   const handleWhatsApp =
//     useCallback(
//       (
//         e: React.MouseEvent<HTMLButtonElement>
//       ) => {
//         e.preventDefault();
//         e.stopPropagation();

//         if (!whatsappNumber) {
//           showToast(
//             'WhatsApp ordering is not available',
//             'error'
//           );
//           return;
//         }

//         let number =
//           whatsappNumber
//             .trim()
//             .replace(/\D/g, '');

//         // Pakistan:
//         // 03001234567 -> 923001234567
//         if (
//           number.startsWith('0')
//         ) {
//           number =
//             '92' +
//             number.substring(1);
//         }

//         number =
//           number.replace(
//             /\D/g,
//             ''
//           );

//         if (!number) {
//           showToast(
//             'Invalid WhatsApp number',
//             'error'
//           );
//           return;
//         }

//         const productUrl =
//           `${window.location.origin}/products/${product.slug}`;

//         const message =
//           encodeURIComponent(
//             `${
//               settings?.whatsapp_message
//                 ? `_${settings.whatsapp_message}_\n\n`
//                 : ''
//             }` +
//               `*🛍️ Product Inquiry*\n\n` +
//               `*Product:* ${product.name}\n` +
//               `*Price:* ${formatCurrency(
//                 product.price,
//                 currency
//               )}\n\n` +
//               `Hi, I'm interested in this product. Please provide more details.\n\n` +
//               `*Product Link:* ${productUrl}`
//           );

//         const whatsappUrl =
//           `https://wa.me/${number}?text=${message}`;

//         window.open(
//           whatsappUrl,
//           '_blank'
//         );
//       },
//       [
//         whatsappNumber,
//         settings?.whatsapp_message,
//         product.name,
//         product.price,
//         product.slug,
//         currency,
//         showToast,
//       ]
//     );

//   // ============================================================
//   // RETURN UI
//   // ============================================================

//   return (
//     <div className="group block rounded-lg border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow">

//       <Link
//         href={`/products/${product.slug}`}
//         prefetch={false}
//         className="block"
//       >

//         {/* PRODUCT IMAGE */}

//         <div className="relative aspect-square overflow-hidden bg-gray-100">

//           <img
//             src={imageSrc}
//             alt={product.name}
//             className="h-full w-full object-cover transition-transform group-hover:scale-105"
//             loading={
//               priority
//                 ? 'eager'
//                 : 'lazy'
//             }
//             decoding="async"
//             fetchPriority={
//               priority
//                 ? 'high'
//                 : 'auto'
//             }
//           />

//           {/* STOCK + DISCOUNT + WISHLIST */}

//           <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">

//             {/* STOCK */}

//             <Badge
//               className={cn(
//                 'text-[10px] px-1.5 py-0.5 rounded',
//                 stockBadge.color
//               )}
//             >
//               {stockBadge.label}
//             </Badge>

//             {/* DISCOUNT + WISHLIST */}

//             <div className="flex items-center gap-1.5">

//               {product.compare_price >
//                 product.price && (
//                 <Badge
//                   className="
//                     bg-red-600
//                     text-white
//                     text-[10px]
//                     px-1.5
//                     py-0.5
//                     rounded
//                     font-semibold
//                   "
//                 >
//                   -
//                   {Math.round(
//                     ((product.compare_price -
//                       product.price) /
//                       product.compare_price) *
//                       100
//                   )}
//                   %
//                 </Badge>
//               )}

//               {/* WISHLIST */}

//               <button
//                 type="button"
//                 onClick={
//                   handleWishlist
//                 }
//                 disabled={
//                   wishlistLoading
//                 }
//                 aria-label={
//                   isWishlisted
//                     ? 'Remove from wishlist'
//                     : 'Add to wishlist'
//                 }
//                 aria-pressed={
//                   isWishlisted
//                 }
//                 className="
//                   flex
//                   h-7
//                   w-7
//                   shrink-0
//                   items-center
//                   justify-center
//                   rounded-full
//                   bg-white/95
//                   shadow-sm
//                   backdrop-blur-sm
//                   transition-all
//                   duration-200
//                   hover:scale-110
//                   hover:bg-white
//                   disabled:cursor-not-allowed
//                   disabled:opacity-60
//                 "
//               >
//                 <Heart
//                   className={cn(
//                     'h-3.5 w-3.5 transition-all duration-200',
//                     isWishlisted
//                       ? 'fill-[#7A1F3D] text-[#7A1F3D]'
//                       : 'text-[#7A1F3D]',
//                     wishlistLoading &&
//                       'animate-pulse'
//                   )}
//                 />
//               </button>

//             </div>
//           </div>
//         </div>

//         {/* PRODUCT INFORMATION */}

//         <div className="p-2 pb-1 flex flex-col gap-1">

//           <h3 className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">
//             {product.name}
//           </h3>

//           {/* RATING */}

//           <div className="min-h-[16px] mt-1">

//             {reviewsLoading ? (
//               <div className="flex items-center gap-1.5">
//                 <div className="h-3 w-14 rounded bg-gray-100 animate-pulse" />
//               </div>
//             ) : reviewStats.count >
//               0 ? (
//               <div className="flex items-center gap-1.5">

//                 <ReviewStars
//                   rating={
//                     reviewStats.average
//                   }
//                 />

//                 <span className="text-[10px] font-semibold text-gray-700">
//                   {reviewStats.average.toFixed(
//                     1
//                   )}
//                 </span>

//                 <span className="text-[10px] text-gray-400">
//                   ({reviewStats.count})
//                 </span>

//               </div>
//             ) : (
//               <span className="text-[10px] text-gray-400">
//                 No reviews yet
//               </span>
//             )}

//           </div>

//           {/* PRICE */}

//           <div className="flex min-w-0 items-baseline gap-1 mt-1">

//             <span className="shrink-0 whitespace-nowrap font-semibold text-[#7A1F3D] !text-[15px] sm:text-sm">
//               {formatCurrency(
//                 product.price,
//                 currency
//               )}
//             </span>

//             {product.compare_price >
//               product.price && (
//               <span className="shrink min-w-0 truncate whitespace-nowrap text-xs text-gray-400 line-through">
//                 {formatCurrency(
//                   product.compare_price,
//                   currency
//                 )}
//               </span>
//             )}

//           </div>

//         </div>

//       </Link>

//       {/* ACTIONS */}

//       <div className="px-2 pb-2 pt-1 sm:px-3 sm:pb-3">

//         <div className="flex w-full items-center gap-1.5 sm:gap-2">

//           {/* ADD TO CART */}

//           <Button
//             type="button"
//             size="sm"
//             onClick={
//               handleAddToCart
//             }
//             disabled={!inStock}
//             className="
//               min-w-0
//               flex-1
//               h-8
//               px-2
//               text-[11px]
//               sm:h-8
//               sm:px-3
//               sm:text-xs
//               whitespace-nowrap
//               bg-[#7A1F3D]
//               text-white
//               hover:bg-[#7A1F3D]
//               disabled:bg-gray-200
//               disabled:text-gray-400
//             "
//           >
//             <ShoppingCart className="mr-1 h-3 w-3 shrink-0" />

//             <span className="truncate">
//               Add to Cart
//             </span>
//           </Button>

//           {/* WHATSAPP */}

//           {whatsappNumber && (
//             <Button
//               type="button"
//               size="sm"
//               variant="outline"
//               onClick={
//                 handleWhatsApp
//               }
//               aria-label="Contact on WhatsApp"
//               className="
//                 h-8
//                 w-9
//                 shrink-0
//                 p-0
//                 border
//                 border-[#7A1F3D]
//                 text-[#7A1F3D]
//                 hover:bg-[#7A1F3D]
//                 hover:text-white
//                 sm:w-10
//               "
//             >
//               <MessageCircle className="h-3.5 w-3.5" />
//             </Button>
//           )}

//         </div>

//       </div>

//     </div>
//   );
// }

// // ============================================================
// // MEMO
// // ============================================================

// const ProductCard = memo(
//   ProductCardBase,
//   (prev, next) => {
//     return (
//       prev.product.id ===
//         next.product.id &&
//       prev.priority ===
//         next.priority
//     );
//   }
// );

// export default ProductCard;












'use client';

import React, {
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  ShoppingCart,
  MessageCircle,
  Heart,
} from 'lucide-react';

import { Product } from '@/lib/types';

import {
  formatCurrency,
  getStockBadge,
  cn,
} from '@/lib/utils';

import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReviewStars from '@/components/store/ReviewStars';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

interface ReviewSummary {
  count: number;
  average: number;
}

const WISHLIST_STORAGE_KEY = 'Veeo_wishlist';

// ============================================================
// PRODUCT CARD
// ============================================================

function ProductCardBase({
  product,
  priority = false,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const currency =
    settings?.currency || '$';

  const stockBadge =
    getStockBadge(product.stock);

  const whatsappNumber =
    settings?.whatsapp_number || '';

  const inStock =
    product.stock > 0;

  const imageSrc =
    product.images?.[0] ||
    '/placeholder.png';

  // ============================================================
  // DISCOUNT
  // ============================================================

  const discount =
    product.compare_price >
      product.price
      ? Math.round(
        ((product.compare_price -
          product.price) /
          product.compare_price) *
        100
      )
      : 0;

  // ============================================================
  // WISHLIST STATE
  // ============================================================

  const [isWishlisted, setIsWishlisted] =
    useState(false);

  const [wishlistLoading, setWishlistLoading] =
    useState(false);

  // ============================================================
  // REVIEW STATE
  // ============================================================

  const [reviewStats, setReviewStats] =
    useState<ReviewSummary>({
      count: 0,
      average: 0,
    });

  const [reviewsLoading, setReviewsLoading] =
    useState(true);

  // ============================================================
  // GET WISHLIST
  // ============================================================

  const getWishlist = useCallback(
    (): string[] => {
      if (
        typeof window === 'undefined'
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
    },
    []
  );

  // ============================================================
  // SAVE WISHLIST
  // ============================================================

  const saveWishlist = useCallback(
    (wishlist: string[]) => {
      if (
        typeof window === 'undefined'
      ) {
        return;
      }

      try {
        localStorage.setItem(
          WISHLIST_STORAGE_KEY,
          JSON.stringify(wishlist)
        );
      } catch (error) {
        console.error(
          'Failed to save wishlist:',
          error
        );
      }
    },
    []
  );

  // ============================================================
  // LOAD WISHLIST
  // ============================================================

  useEffect(() => {
    const wishlist =
      getWishlist();

    setIsWishlisted(
      wishlist.includes(
        String(product.id)
      )
    );
  }, [
    getWishlist,
    product.id,
  ]);

  // ============================================================
  // WISHLIST EVENTS
  // ============================================================

  useEffect(() => {
    const handleWishlistUpdated =
      () => {
        const wishlist =
          getWishlist();

        setIsWishlisted(
          wishlist.includes(
            String(product.id)
          )
        );
      };

    const handleStorage =
      (event: StorageEvent) => {
        if (
          event.key !==
          WISHLIST_STORAGE_KEY
        ) {
          return;
        }

        const wishlist =
          getWishlist();

        setIsWishlisted(
          wishlist.includes(
            String(product.id)
          )
        );
      };

    window.addEventListener(
      'wishlistUpdated',
      handleWishlistUpdated
    );

    window.addEventListener(
      'storage',
      handleStorage
    );

    return () => {
      window.removeEventListener(
        'wishlistUpdated',
        handleWishlistUpdated
      );

      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, [
    getWishlist,
    product.id,
  ]);

  // ============================================================
  // WISHLIST TOGGLE
  // ============================================================

  const handleWishlist =
    useCallback(
      (
        e: React.MouseEvent<HTMLButtonElement>
      ) => {
        e.preventDefault();
        e.stopPropagation();

        if (wishlistLoading) {
          return;
        }

        try {
          setWishlistLoading(true);

          const productId =
            String(product.id);

          let wishlist =
            getWishlist();

          const alreadyWishlisted =
            wishlist.includes(
              productId
            );

          if (
            alreadyWishlisted
          ) {
            wishlist =
              wishlist.filter(
                (id) =>
                  id !== productId
              );

            setIsWishlisted(false);

            showToast(
              'Product removed from wishlist'
            );
          } else {
            wishlist = [
              ...wishlist,
              productId,
            ];

            setIsWishlisted(true);

            showToast(
              'Product added to wishlist'
            );
          }

          saveWishlist(wishlist);

          window.dispatchEvent(
            new CustomEvent(
              'wishlistUpdated'
            )
          );
        } catch (error) {
          console.error(
            'Wishlist update error:',
            error
          );

          showToast(
            'Unable to update wishlist',
            'error'
          );
        } finally {
          setWishlistLoading(false);
        }
      },
      [
        getWishlist,
        product.id,
        saveWishlist,
        showToast,
        wishlistLoading,
      ]
    );

  // ============================================================
  // FETCH REVIEWS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const fetchReviews =
      async () => {
        if (!product.slug) {
          setReviewsLoading(false);
          return;
        }

        try {
          setReviewsLoading(true);

          const response =
            await fetch(
              `/api/products/${product.slug}/reviews`
            );

          if (!response.ok) {
            throw new Error(
              'Failed to fetch reviews'
            );
          }

          const data =
            await response.json();

          if (cancelled) {
            return;
          }

          const reviews =
            Array.isArray(
              data.data
            )
              ? data.data
              : [];

          if (
            reviews.length === 0
          ) {
            setReviewStats({
              count: 0,
              average: 0,
            });

            return;
          }

          const total =
            reviews.reduce(
              (
                sum: number,
                review: {
                  rating?:
                  | number
                  | string;
                }
              ) =>
                sum +
                Number(
                  review.rating || 0
                ),
              0
            );

          setReviewStats({
            count: reviews.length,
            average:
              total /
              reviews.length,
          });
        } catch (error) {
          if (!cancelled) {
            console.error(
              'Product reviews fetch error:',
              error
            );

            setReviewStats({
              count: 0,
              average: 0,
            });
          }
        } finally {
          if (!cancelled) {
            setReviewsLoading(
              false
            );
          }
        }
      };

    fetchReviews();

    return () => {
      cancelled = true;
    };
  }, [product.slug]);

  // ============================================================
  // ADD TO CART
  // ============================================================

  const handleAddToCart =
    useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!inStock) {
          return;
        }

        addItem({
          productId:
            product.id,

          name:
            product.name,

          slug:
            product.slug,

          image:
            imageSrc,

          price:
            product.price,

          comparePrice:
            product.compare_price,

          qty: 1,

          stock:
            product.stock,
        });

        showToast(
          'Product added to cart'
        );
      },
      [
        addItem,
        imageSrc,
        inStock,
        product.compare_price,
        product.id,
        product.name,
        product.price,
        product.slug,
        product.stock,
        showToast,
      ]
    );

  // ============================================================
  // WHATSAPP
  // ============================================================

  const handleWhatsApp =
    useCallback(
      (
        e: React.MouseEvent<HTMLButtonElement>
      ) => {
        e.preventDefault();
        e.stopPropagation();

        if (!whatsappNumber) {
          showToast(
            'WhatsApp ordering is not available',
            'error'
          );

          return;
        }

        let number =
          whatsappNumber
            .trim()
            .replace(/\D/g, '');

        if (
          number.startsWith('0')
        ) {
          number =
            '92' +
            number.substring(1);
        }

        number =
          number.replace(
            /\D/g,
            ''
          );

        if (!number) {
          showToast(
            'Invalid WhatsApp number',
            'error'
          );

          return;
        }

        const productUrl =
          `${window.location.origin}/products/${product.slug}`;

        const message =
          encodeURIComponent(
            `${settings?.whatsapp_message
              ? `_${settings.whatsapp_message}_\n\n`
              : ''
            }` +
            `*🛍️ Product Inquiry*\n\n` +
            `*Product:* ${product.name}\n` +
            `*Price:* ${formatCurrency(
              product.price,
              currency
            )}\n\n` +
            `Hi, I'm interested in this product. Please provide more details.\n\n` +
            `*Product Link:* ${productUrl}`
          );

        const whatsappUrl =
          `https://wa.me/${number}?text=${message}`;

        window.open(
          whatsappUrl,
          '_blank'
        );
      },
      [
        whatsappNumber,
        settings?.whatsapp_message,
        product.name,
        product.price,
        product.slug,
        currency,
        showToast,
      ]
    );

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <article
      className="
        group
        relative
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-xl
        border
        border-gray-100
        bg-white
        shadow-[0_2px_12px_rgba(0,0,0,0.035)]
        transition-all
        duration-300

        sm:rounded-2xl
        sm:shadow-[0_3px_16px_rgba(0,0,0,0.04)]

        lg:hover:-translate-y-1
        lg:hover:border-[#7A1F3D]/15
        lg:hover:shadow-[0_12px_30px_rgba(122,31,61,0.10)]
      "
    >
      {/* ======================================================
          PRODUCT LINK
      ======================================================= */}

      <Link
        href={`/products/${product.slug}`}
        prefetch={false}
        className="block"
      >
        {/* ====================================================
            IMAGE
        ===================================================== */}

        <div
          className="
            relative
            aspect-[0.94]
            overflow-hidden
            bg-[#faf6f7]

            sm:aspect-square
          "
        >
          {/* Soft background glow */}

          <div
            className="
              pointer-events-none
              absolute
              -right-10
              -top-10
              z-[1]
              h-24
              w-24
              rounded-full
              bg-[#7A1F3D]/5
              blur-2xl
              transition-transform
              duration-500
              lg:group-hover:scale-150
            "
          />

          {/* Product Image */}

          <img
            src={imageSrc}
            alt={product.name}
            loading={
              priority
                ? 'eager'
                : 'lazy'
            }
            decoding="async"
            fetchPriority={
              priority
                ? 'high'
                : 'auto'
            }
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              transition-transform
              duration-500
              ease-out

              lg:group-hover:scale-[1.045]
            "
          />

          {/* Subtle overlay */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              z-[2]
              bg-gradient-to-t
              from-black/10
              via-transparent
              to-white/10
            "
          />

          {/* =================================================
              TOP CONTROLS
          ================================================== */}

          <div
            className="
              absolute
              left-2
              right-2
              top-2
              z-10
              flex
              items-start
              justify-between
              gap-1.5

              sm:left-2.5
              sm:right-2.5
              sm:top-2.5
            "
          >
            {/* STOCK */}


            <Badge
              className="
              flex
              h-5
              w-fit
              shrink-0
              items-center
              whitespace-nowrap
              rounded-full
              border
              border-white/70
              bg-white/90
              px-1.5
              text-[8px]
              font-semibold
              uppercase
              tracking-wide
              text-gray-700
              shadow-sm
              backdrop-blur-md
              mt-1
              hover:text-white
              sm:h-6
              sm:px-2
              sm:text-[9px]
            "
            >
              <span
                className={cn(
                  'mr-1 h-1.5 w-1.5 shrink-0 rounded-full',
                  inStock
                    ? 'bg-emerald-500'
                    : 'bg-gray-400'
                )}
              />

              {stockBadge.label}
            </Badge>


            {/* RIGHT */}

            <div
              className="
                flex
                items-center
                gap-1
              "
            >
              {/* DISCOUNT */}

              {discount > 0 && (
                <Badge
                  className="
                    h-5
                    rounded-full
                    bg-[#7A1F3D]
                    px-1.5
                    text-[8px]
                    font-bold
                    text-white
                    shadow-sm

                    sm:h-6
                    sm:px-2
                    sm:text-[9px]
                  "
                >
                  -{discount}%
                </Badge>
              )}

              {/* WISHLIST */}

              <button
                type="button"
                onClick={
                  handleWishlist
                }
                disabled={
                  wishlistLoading
                }
                aria-label={
                  isWishlisted
                    ? 'Remove from wishlist'
                    : 'Add to wishlist'
                }
                aria-pressed={
                  isWishlisted
                }
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/80
                  bg-white/90
                  text-[#7A1F3D]
                  shadow-sm
                  backdrop-blur-md
                  transition-all
                  duration-200

                  active:scale-90

                  sm:h-8
                  sm:w-8

                  lg:hover:scale-105
                  lg:hover:bg-white
                  lg:hover:shadow-md
                "
              >
                <Heart
                  className={cn(
                    'h-3.5 w-3.5',
                    'transition-all duration-200',

                    isWishlisted
                      ? 'fill-[#7A1F3D] text-[#7A1F3D]'
                      : 'text-[#7A1F3D]',

                    wishlistLoading &&
                    'animate-pulse'
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            PRODUCT INFO
        ===================================================== */}

        <div
          className="
            px-2.5
            pb-2
            pt-2.5

            sm:px-3
            sm:pb-2.5
            sm:pt-3

            lg:px-3.5
          "
        >
          {/* NAME */}

          <h3
            className="
              line-clamp-2
              min-h-[29px]
              text-[11px]
              font-semibold
              leading-[1.3]
              text-gray-900
              transition-colors
              duration-200

              sm:min-h-[32px]
              sm:text-xs

              lg:text-[13px]
              lg:group-hover:text-[#7A1F3D]
            "
          >
            {product.name}
          </h3>

          {/* =================================================
              RATING
          ================================================== */}

          <div
            className="
              mt-1.5
              flex
              min-h-[14px]
              items-center
            "
          >
            {reviewsLoading ? (
              <div
                className="
                  h-2.5
                  w-12
                  animate-pulse
                  rounded-full
                  bg-gray-100
                "
              />
            ) : reviewStats.count > 0 ? (
              <div
                className="
                  flex
                  items-center
                  gap-1
                "
              >
                <ReviewStars
                  rating={
                    reviewStats.average
                  }
                />

                <span
                  className="
                    text-[9px]
                    font-semibold
                    text-gray-600

                    sm:text-[10px]
                  "
                >
                  {reviewStats.average.toFixed(
                    1
                  )}
                </span>

                <span
                  className="
                    text-[9px]
                    text-gray-400

                    sm:text-[10px]
                  "
                >
                  ({reviewStats.count})
                </span>
              </div>
            ) : (
              <span
                className="
                  text-[9px]
                  text-gray-400

                  sm:text-[10px]
                "
              >
                No reviews yet
              </span>
            )}
          </div>

          {/* =================================================
              PRICE
          ================================================== */}

          <div
            className="
              mt-1.5
              flex
              min-w-0
              items-baseline
              gap-1.5
            "
          >
            <span
              className="
                shrink-0
                whitespace-nowrap
                text-[14px]
                font-bold
                tracking-tight
                text-[#7A1F3D]

                sm:text-[15px]
                lg:text-[16px]
              "
            >
              {formatCurrency(
                product.price,
                currency
              )}
            </span>

            {discount > 0 && (
              <span
                className="
                  min-w-0
                  truncate
                  whitespace-nowrap
                  text-[10px]
                  text-gray-400
                  line-through

                  sm:text-[12px]
                "
              >
                {formatCurrency(
                  product.compare_price,
                  currency
                )}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ======================================================
          ACTIONS
      ======================================================= */}

      <div
        className="
          mt-auto
          px-2.5
          pb-2.5

          sm:px-3
          sm:pb-3

          lg:px-3.5
          lg:pb-3.5
        "
      >
        <div
          className="
            flex
            w-full
            items-center
            gap-1.5
          "
        >
          {/* ADD TO CART */}

          <Button
            type="button"
            size="sm"
            onClick={
              handleAddToCart
            }
            disabled={!inStock}
            className="
              h-8
              min-w-0
              flex-1
              rounded-lg
              border
              border-[#7A1F3D]
              bg-[#7A1F3D]
              px-2
              text-[9px]
              font-semibold
              tracking-wide
              text-white
              shadow-[0_3px_8px_rgba(122,31,61,0.12)]
              transition-all
              duration-200

              active:scale-[0.98]

              hover:bg-[#651832]
              hover:shadow-[0_5px_12px_rgba(122,31,61,0.18)]

              disabled:border-gray-200
              disabled:bg-gray-100
              disabled:text-gray-400
              disabled:shadow-none

              sm:h-8
              sm:rounded-xl
              sm:px-2.5
              sm:text-[10px]

              lg:h-9
              lg:text-[11px]
            "
          >
            <ShoppingCart
              className="
                mr-1
                h-3
                w-3
                shrink-0

                sm:h-3.5
                sm:w-3.5
              "
            />

            <span className="truncate">
              Add to Cart
            </span>
          </Button>

          {/* WHATSAPP */}

          {whatsappNumber && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={
                handleWhatsApp
              }
              aria-label="Contact on WhatsApp"
              className="
                h-8
                w-8
                shrink-0
                rounded-lg
                border
                border-[#7A1F3D]/20
                bg-[#fdf8fa]
                p-0
                text-[#7A1F3D]
                transition-all
                duration-200

                active:scale-90

                hover:border-[#7A1F3D]
                hover:bg-[#7A1F3D]
                hover:text-white

                sm:h-8
                sm:w-9
                sm:rounded-xl

                lg:h-9
                lg:w-10
              "
            >
              <MessageCircle
                className="
                  h-3
                  w-3

                  sm:h-3.5
                  sm:w-3.5
                "
              />
            </Button>
          )}
        </div>
      </div>

      {/* ======================================================
          BOTTOM LUXURY ACCENT
      ======================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-1/2
          h-[2px]
          w-0
          -translate-x-1/2
          rounded-full
          bg-[#7A1F3D]
          opacity-70
          transition-all
          duration-300

          lg:group-hover:w-1/4
        "
      />
    </article>
  );
}

// ============================================================
// MEMO
// ============================================================

const ProductCard = memo(
  ProductCardBase,
  (prev, next) => {
    return (
      prev.product.id ===
      next.product.id &&
      prev.priority ===
      next.priority
    );
  }
);

export default ProductCard;