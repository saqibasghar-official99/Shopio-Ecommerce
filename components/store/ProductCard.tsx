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

function ProductCardBase({
  product,
  priority = false,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const currency = settings?.currency || '$';
  const stockBadge = getStockBadge(product.stock);
  const whatsappNumber =
    settings?.whatsapp_number || '';

  const inStock = product.stock > 0;
  const imageSrc =
    product.images?.[0] || '/placeholder.png';

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
  // FETCH REVIEWS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const fetchReviews = async () => {
      if (!product.slug) {
        setReviewsLoading(false);
        return;
      }

      try {
        setReviewsLoading(true);

        const response = await fetch(
          `/api/products/${product.slug}/reviews`
        );

        if (!response.ok) {
          throw new Error(
            'Failed to fetch reviews'
          );
        }

        const data = await response.json();

        if (cancelled) return;

        const reviews = Array.isArray(data.data)
          ? data.data
          : [];

        if (reviews.length === 0) {
          setReviewStats({
            count: 0,
            average: 0,
          });

          return;
        }

        const total = reviews.reduce(
          (
            sum: number,
            review: { rating?: number | string }
          ) =>
            sum +
            Number(review.rating || 0),
          0
        );

        setReviewStats({
          count: reviews.length,
          average: total / reviews.length,
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
          setReviewsLoading(false);
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

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!inStock) return;

      addItem({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: imageSrc,
        price: product.price,
        comparePrice: product.compare_price,
        qty: 1,
        stock: product.stock,
      });

      showToast(
        `Product added to cart`
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

  const handleWhatsApp = useCallback(
    (
      e: React.MouseEvent<HTMLButtonElement>
    ) => {
      e.preventDefault();

      if (!whatsappNumber) {
        showToast(
          'WhatsApp ordering is not available',
          'error'
        );
        return;
      }

      let number = whatsappNumber
        .trim()
        .replace(/\D/g, '');

      // Pakistan:
      // 03001234567 -> 923001234567
      if (number.startsWith('0')) {
        number =
          '92' + number.substring(1);
      }

      number = number.replace(
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

      const message = encodeURIComponent(
        `${
          settings?.whatsapp_message
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
  // RETURN UI
  // ============================================================

  return (
    <div className="group block rounded-lg border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow">

      {/* ======================================================
          PRODUCT LINK
      ====================================================== */}

      <Link
        href={`/products/${product.slug}`}
        prefetch={false}
        className="block"
      >

        {/* ====================================================
            PRODUCT IMAGE
        ==================================================== */}

        <div className="relative aspect-square overflow-hidden bg-gray-100">

          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
          />

          {/* STOCK BADGE */}

          <Badge
            className={cn(
              'absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded',
              stockBadge.color
            )}
          >
            {stockBadge.label}
          </Badge>

          {/* DISCOUNT BADGE */}

          {product.compare_price >
            product.price && (
            <Badge
              className="
                absolute
                top-2
                right-2
                bg-red-600
                text-white
                text-[10px]
                px-1.5
                py-0.5
                rounded
                font-semibold
              "
            >
              -
              {Math.round(
                ((product.compare_price -
                  product.price) /
                  product.compare_price) *
                  100
              )}
              %
            </Badge>
          )}

        </div>

        {/* ====================================================
            PRODUCT INFORMATION
        ==================================================== */}

        <div className="p-2 pb-1 flex flex-col gap-1">

          {/* PRODUCT NAME */}

          <h3 className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">
            {product.name}
          </h3>

          {/* ==================================================
              RATING + REVIEW COUNT
          ================================================== */}

          <div className="min-h-[16px] mt-1">

            {reviewsLoading ? (

              /*
               * Keep a fixed height while reviews load so
               * product cards don't jump vertically.
               */
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-14 rounded bg-gray-100 animate-pulse" />
              </div>

            ) : reviewStats.count > 0 ? (

              <div className="flex items-center gap-1.5">

                <ReviewStars
                  rating={reviewStats.average}
                />

                <span className="text-[10px] font-semibold text-gray-700">
                  {reviewStats.average.toFixed(1)}
                </span>

                <span className="text-[10px] text-gray-400">
                  ({reviewStats.count})
                </span>

              </div>

            ) : (

              <span className="text-[10px] text-gray-400">
                No reviews yet
              </span>

            )}

          </div>

          {/* ==================================================
              PRICE
          ================================================== */}

          <div className="flex min-w-0 items-baseline gap-1 mt-1">

            <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-[#7A1F3D]">
              {formatCurrency(
                product.price,
                currency
              )}
            </span>

            {product.compare_price >
              product.price && (
              <span className="shrink min-w-0 truncate whitespace-nowrap text-xs text-gray-400 line-through">
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
      ====================================================== */}

      <div className="px-2 pb-2 pt-1 sm:px-3 sm:pb-3">

        <div className="flex w-full items-center gap-1.5 sm:gap-2">

          {/* ADD TO CART */}

          <Button
            type="button"
            size="sm"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="
              min-w-0
              flex-1
              h-8
              px-2
              text-[11px]
              sm:h-8
              sm:px-3
              sm:text-xs
              whitespace-nowrap
              bg-[#7A1F3D]
              text-white
              hover:bg-[#7A1F3D]
              disabled:bg-gray-200
              disabled:text-gray-400
            "
          >
            <ShoppingCart className="mr-1 h-3 w-3 shrink-0" />

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
              onClick={handleWhatsApp}
              aria-label="Contact on WhatsApp"
              className="
                h-8
                w-9
                shrink-0
                p-0
                border
                border-[#7A1F3D]
                text-[#7A1F3D]
                hover:bg-[#7A1F3D]
                hover:text-white
                sm:w-10
              "
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
          )}

        </div>

      </div>

    </div>
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