'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
  Minus,
  Plus,
  Star,
  Loader2,
} from 'lucide-react';

import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';

import { formatCurrency, cn } from '@/lib/utils';
import ReviewStars from '@/components/store/ReviewStars';

const WISHLIST_KEY = 'Veeo_wishlist';

interface WishlistItem {
  id?: string;
  _id?: string;

  name: string;
  slug: string;

  images?: string[];

  price: number;
  compare_price?: number;

  stock?: number;

  ratings_avg?: number;
  ratings_count?: number;

  badge?: string;
}

interface WishlistProduct extends WishlistItem {
  loading?: boolean;
}

export default function WishlistPage() {
  const { addItem } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const currency = settings?.currency || '$';

  const [wishlistItems, setWishlistItems] = useState<
    WishlistProduct[]
  >([]);

  const [hydrated, setHydrated] = useState(false);

  const [addingProduct, setAddingProduct] = useState<
    string | null
  >(null);

  const [quantities, setQuantities] = useState<
    Record<string, number>
  >({});

  // ============================================================
  // LOAD WISHLIST
  // ============================================================

  const loadWishlist = () => {
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);

      if (!saved) {
        setWishlistItems([]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        setWishlistItems([]);
        return;
      }

      setWishlistItems(parsed);

      // Initialize quantity for every product
      const initialQuantities: Record<string, number> = {};

      parsed.forEach((product: WishlistProduct) => {
        const id =
          product.id ||
          product._id ||
          product.slug;

        initialQuantities[id] = 1;
      });

      setQuantities(initialQuantities);
    } catch (error) {
      console.error(
        'Failed to load wishlist:',
        error
      );

      setWishlistItems([]);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadWishlist();
    setHydrated(true);

    const handleWishlistUpdated = () => {
      loadWishlist();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === WISHLIST_KEY) {
        loadWishlist();
      }
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
  }, []);

  // ============================================================
  // PRODUCT ID
  // ============================================================

  const getProductId = (
    product: WishlistProduct
  ) => {
    return (
      product.id ||
      product._id ||
      product.slug
    );
  };

  // ============================================================
  // SAVE WISHLIST
  // ============================================================

  const saveWishlist = (
    items: WishlistProduct[]
  ) => {
    setWishlistItems(items);

    localStorage.setItem(
      WISHLIST_KEY,
      JSON.stringify(items)
    );

    window.dispatchEvent(
      new CustomEvent('wishlistUpdated')
    );
  };

  // ============================================================
  // REMOVE PRODUCT
  // ============================================================

  const removeFromWishlist = (
    product: WishlistProduct
  ) => {
    const productId = getProductId(product);

    const updated = wishlistItems.filter(
      (item) =>
        getProductId(item) !== productId
    );

    saveWishlist(updated);

    showToast(
      `${product.name} removed from wishlist`
    );
  };

  // ============================================================
  // CLEAR ALL
  // ============================================================

  const clearWishlist = () => {
    if (wishlistItems.length === 0) return;

    saveWishlist([]);

    showToast('Wishlist cleared');
  };

  // ============================================================
  // QUANTITY
  // ============================================================

  const updateQuantity = (
    product: WishlistProduct,
    change: number
  ) => {
    const id = getProductId(product);

    const current = quantities[id] || 1;

    const maxStock =
      product.stock && product.stock > 0
        ? product.stock
        : 99;

    const next = Math.max(
      1,
      Math.min(
        current + change,
        maxStock
      )
    );

    setQuantities((prev) => ({
      ...prev,
      [id]: next,
    }));
  };

  // ============================================================
  // ADD TO CART
  // ============================================================

  const handleAddToCart = (
    product: WishlistProduct
  ) => {
    const productId = getProductId(product);

    const quantity =
      quantities[productId] || 1;

    const stock = product.stock ?? 999;

    if (stock <= 0) {
      showToast('This product is out of stock');
      return;
    }

    setAddingProduct(productId);

    try {
      addItem({
        productId: productId,
        name: product.name,
        slug: product.slug,
        image:
          product.images?.[0] ||
          '/placeholder.png',
        price: product.price,
        comparePrice:
          product.compare_price ||
          product.price,
        qty: quantity,
        variant: undefined,
        stock: product.stock,
      });

      showToast(
        `${product.name} added to cart`
      );
    } catch (error) {
      console.error(
        'Failed to add product to cart:',
        error
      );

      showToast(
        'Failed to add product to cart'
      );
    } finally {
      setTimeout(() => {
        setAddingProduct(null);
      }, 500);
    }
  };

  // ============================================================
  // TOTAL SAVINGS
  // ============================================================

  const totalSavings = useMemo(() => {
    return wishlistItems.reduce(
      (total, product) => {
        if (
          product.compare_price &&
          product.compare_price >
            product.price
        ) {
          return (
            total +
            (product.compare_price -
              product.price)
          );
        }

        return total;
      },
      0
    );
  }, [wishlistItems]);

  // ============================================================
  // LOADING
  // ============================================================

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mx-auto h-10 w-56 rounded-lg bg-gray-200" />

            <div className="mx-auto mt-3 h-4 w-72 rounded bg-gray-200" />

            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({
                length: 8,
              }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl bg-white"
                >
                  <div className="aspect-square bg-gray-200" />

                  <div className="space-y-3 p-4">
                    <div className="h-4 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-200" />
                    <div className="h-10 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // EMPTY WISHLIST
  // ============================================================

  if (wishlistItems.length === 0) {
    return (
      <main className="min-h-[70vh] bg-gradient-to-b from-white to-gray-50">
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="w-full max-w-lg text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#7A1F3D]/5">
              <Heart
                className="h-11 w-11 text-[#7A1F3D]"
                strokeWidth={1.5}
              />
            </div>

            <h1 className="mt-7 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Your Wishlist is Empty
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500 sm:text-base">
              Save your favorite jewelry here and
              come back whenever you're ready to
              shop.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#7A1F3D] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#7A1F3D]/20 transition-all hover:-translate-y-0.5 hover:bg-[#651932]"
            >
              <ShoppingBag className="h-4 w-4" />
              Explore Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50/70">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Heart
                  className="h-5 w-5 text-[#7A1F3D]"
                  fill="currentColor"
                />

                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7A1F3D]">
                  Saved For You
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                My Wishlist
              </h1>

              <p className="mt-2 text-sm text-gray-500 sm:text-base">
                {wishlistItems.length}{' '}
                {wishlistItems.length === 1
                  ? 'product'
                  : 'products'}{' '}
                saved in your wishlist
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {totalSavings > 0 && (
                <div className="rounded-full bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
                  Save{' '}
                  {formatCurrency(
                    totalSavings,
                    currency
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={clearWishlist}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Clear Wishlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          PRODUCTS
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
          {wishlistItems.map((product) => {
            const productId =
              getProductId(product);

            const image =
              product.images?.[0] ||
              '/placeholder.png';

            const quantity =
              quantities[productId] || 1;

            const hasDiscount =
              !!product.compare_price &&
              product.compare_price >
                product.price;

            const discountPercent =
              hasDiscount
                ? Math.round(
                    ((product.compare_price! -
                      product.price) /
                      product.compare_price!) *
                      100
                  )
                : 0;

            const outOfStock =
              typeof product.stock ===
                'number' &&
              product.stock <= 0;

            return (
              <article
                key={productId}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* ==================================================
                    PRODUCT IMAGE
                ================================================== */}

                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <Link
                    href={`/products/${product.slug}`}
                    className="block h-full w-full"
                  >
                    <img
                      src={image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>

                  {/* SALE */}

                  {hasDiscount && (
                    <div className="absolute left-3 top-3 rounded-full bg-[#7A1F3D] px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
                      {discountPercent}% OFF
                    </div>
                  )}

                  {/* OUT OF STOCK */}

                  {outOfStock && (
                    <div className="absolute bottom-3 left-3 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                      Out of Stock
                    </div>
                  )}

                  {/* REMOVE */}

                  <button
                    type="button"
                    onClick={() =>
                      removeFromWishlist(product)
                    }
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-500 shadow-md backdrop-blur-sm transition-all hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* ==================================================
                    PRODUCT INFORMATION
                ================================================== */}

                <div className="p-3.5 sm:p-4">
                  <Link
                    href={`/products/${product.slug}`}
                    className="block"
                  >
                    <h2 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-gray-900 transition-colors group-hover:text-[#7A1F3D] sm:text-[15px]">
                      {product.name}
                    </h2>
                  </Link>

                  {/* =================================================
                      REVIEWS
                  ================================================= */}

                  <div className="mt-2 flex min-h-[20px] items-center gap-1.5">
                    {typeof product.ratings_avg ===
                      'number' &&
                    product.ratings_avg > 0 ? (
                      <>
                        <span className="text-xs font-semibold text-gray-800">
                          {product.ratings_avg.toFixed(
                            1
                          )}
                        </span>

                        <ReviewStars
                          rating={
                            product.ratings_avg
                          }
                          count={
                            product.ratings_count
                          }
                        />

                        {typeof product.ratings_count ===
                          'number' && (
                          <span className="text-[10px] text-gray-400">
                            (
                            {
                              product.ratings_count
                            }
                            )
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        No reviews yet
                      </span>
                    )}
                  </div>

                  {/* =================================================
                      PRICE
                  ================================================= */}

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-[#7A1F3D]">
                      {formatCurrency(
                        product.price,
                        currency
                      )}
                    </span>

                    {hasDiscount && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatCurrency(
                          product.compare_price!,
                          currency
                        )}
                      </span>
                    )}
                  </div>

                  {/* =================================================
                      QUANTITY
                  ================================================= */}

                  {!outOfStock && (
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-2 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Qty
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              product,
                              -1
                            )
                          }
                          disabled={
                            quantity <= 1
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition hover:text-[#7A1F3D] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <span className="min-w-[20px] text-center text-xs font-bold text-gray-800">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              product,
                              1
                            )
                          }
                          disabled={
                            typeof product.stock ===
                              'number' &&
                            quantity >=
                              product.stock
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition hover:text-[#7A1F3D] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        className="flex flex-1 items-center justify-center rounded-xl border border-gray-200 px-2 py-2.5 text-[11px] font-semibold text-gray-700 transition hover:border-[#7A1F3D] hover:text-[#7A1F3D] sm:text-xs"
                      >
                        View Product
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleAddToCart(
                            product
                          )
                        }
                        disabled={
                          outOfStock ||
                          addingProduct ===
                            productId
                        }
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition',
                          outOfStock
                            ? 'cursor-not-allowed bg-gray-300'
                            : 'bg-[#7A1F3D] hover:bg-[#651932]'
                        )}
                        aria-label={`Add ${product.name} to cart`}
                      >
                        {addingProduct ===
                        productId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* ADD TO CART FULL BUTTON */}

                    {!outOfStock && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAddToCart(
                            product
                          )
                        }
                        disabled={
                          addingProduct ===
                          productId
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1F3D] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#651932] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {addingProduct ===
                        productId ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-4 w-4" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    )}

                    {outOfStock && (
                      <button
                        type="button"
                        disabled
                        className="w-full cursor-not-allowed rounded-xl bg-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-500"
                      >
                        Currently Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          BOTTOM SHOPPING CTA
      ======================================================== */}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-[#7A1F3D] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Still looking for something special?
              </h2>

              <p className="mt-1 text-sm text-white/70">
                Discover more jewelry from our
                collection.
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#7A1F3D] transition hover:bg-gray-100"
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}