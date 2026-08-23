

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  ShoppingBag,
  MessageCircle,
  ArrowLeft,
  Truck,
  RotateCcw,
  Shield,
  Package,
  Star,
  CheckCircle,
  Loader2,
} from 'lucide-react';

import { Product, Review } from '@/lib/types';
import { formatCurrency, getStockBadge, cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';

import ReviewStars from '@/components/store/ReviewStars';
import ProductCard from '@/components/store/ProductCard';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { addItem } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const reviewStats = React.useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return {
        count: 0,
        average: 0,
      };
    }

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return {
      count: reviews.length,
      average: total / reviews.length,
    };
  }, [reviews]);

  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [variantSelections, setVariantSelections] =
    useState<Record<string, string>>({});

  const currency = settings?.currency || '$';
  const whatsappNumber = settings?.whatsapp_number || '';

  // ============================================================
  // REVIEW STATES
  // ============================================================

  const [reviewEligibility, setReviewEligibility] = useState<{
    canReview: boolean;
    orderId?: string;
    customerName?: string;
    message?: string;
  }>({
    canReview: false,
  });

  const [guestCustomerId, setGuestCustomerId] = useState('');

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [checkingReviewEligibility, setCheckingReviewEligibility] =
    useState(false);

  // ============================================================
  // FETCH PRODUCT
  // ============================================================

  useEffect(() => {
    setLoading(true);
    setSelectedImage(0);
    setQuantity(1);

    // Reset review state when product changes
    setReviewEligibility({
      canReview: false,
    });

    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.data;

        if (p) {
          p.id = p._id || p.id;

          // Handle populated category_id
          const catId = p.category_id;

          if (catId && typeof catId === 'object') {
            const catObj = catId as {
              _id: string;
              name: string;
              slug: string;
            };

            p.category = {
              id: catObj._id,
              name: catObj.name,
              slug: catObj.slug,
              image: '',
              parent_id: null,
              is_active: true,
              sort_order: 0,
              created_at: '',
            };

            p.category_id = catObj._id;
          } else if (p.category) {
            p.category.id = p.category._id || p.category.id;
          }
        }

        setProduct(p);

        if (p?.variants) {
          const initial: Record<string, string> = {};

          p.variants.forEach(
            (v: { label: string; options: string[] }) => {
              initial[v.label] = v.options[0];
            }
          );

          setVariantSelections(initial);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);


  // ============================================================
  // ANALYTICS - PRODUCT VISIT
  // ============================================================

  useEffect(() => {
    if (!product?.id) return;

    const trackVisit = async () => {
      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product.id,
            eventType: 'visit',
          }),
        });
      } catch (error) {
        // Analytics failure should never break the product page
        console.error(
          'Product visit tracking error:',
          error
        );
      }
    };

    trackVisit();
  }, [product?.id]);
  // ============================================================
  // FETCH RELATED PRODUCTS
  // ============================================================

  useEffect(() => {
    if (!product?.category?.slug) return;

    fetch(`/api/products?category=${product.category.slug}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        const items = (data.data || [])
          .map((raw: Record<string, unknown>) => {
            const p =
              raw as unknown as Product & {
                _id?: string;
              };

            p.id = (raw._id as string) || p.id;

            const catId = raw.category_id;

            if (catId && typeof catId === 'object') {
              const catObj = catId as {
                _id: string;
                name: string;
                slug: string;
              };

              p.category = {
                id: catObj._id,
                name: catObj.name,
                slug: catObj.slug,
                image: '',
                parent_id: null,
                is_active: true,
                sort_order: 0,
                created_at: '',
              };

              p.category_id = catObj._id;
            }

            return p;
          })
          .filter((p: Product) => p.slug !== product.slug);

        setRelatedProducts(items.slice(0, 4));
      })
      .catch(() => setRelatedProducts([]));
  }, [product?.category?.slug, product?.slug]);

  // ============================================================
  // FETCH REVIEWS
  // ============================================================

  useEffect(() => {
    if (!product?.id) return;

    fetch(`/api/products/${slug}/reviews`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setReviews(data.data || []);
      })
      .catch(() => {
        setReviews([]);
      });
  }, [slug, product?.id]);

  // ============================================================
  // AUTOMATIC REVIEW ELIGIBILITY CHECK
  //
  // Automatically runs when the product is loaded.
  //
  // Backend checks:
  // 1. Guest customer exists
  // 2. Order exists
  // 3. Product exists in order
  // 4. Payment status = paid
  // 5. Order status = delivered
  // 6. Customer has not already reviewed this product/order
  // ============================================================

  useEffect(() => {
    if (!product?.id) return;

    const checkEligibilityAutomatically = async () => {
      const storedGuestCustomerId =
        localStorage.getItem('guest_customer_id');

      // No guest customer ID means there is no checkout/order
      // associated with this browser.
      if (!storedGuestCustomerId) {
        setGuestCustomerId('');

        setReviewEligibility({
          canReview: false,
          message:
            'No previous order was found on this browser.',
        });

        return;
      }

      setGuestCustomerId(storedGuestCustomerId);
      setCheckingReviewEligibility(true);

      try {
        const response = await fetch(
          `/api/products/${slug}/review-eligibility?guestCustomerId=${encodeURIComponent(
            storedGuestCustomerId
          )}`
        );

        const data = await response.json();

        if (!response.ok) {
          setReviewEligibility({
            canReview: false,
            message:
              data.message ||
              'We could not verify your order.',
          });

          return;
        }

        setReviewEligibility({
          canReview: Boolean(data.canReview),
          orderId: data.orderId,
          customerName: data.customerName,
          message: data.message,
        });
      } catch (error) {
        console.error(
          'Automatic review eligibility error:',
          error
        );

        setReviewEligibility({
          canReview: false,
          message:
            'Unable to verify your order right now.',
        });
      } finally {
        setCheckingReviewEligibility(false);
      }
    };

    checkEligibilityAutomatically();
  }, [product?.id, slug]);

  // ============================================================
  // MANUAL REVIEW ELIGIBILITY CHECK
  //
  // This is kept as a retry option.
  // Automatic checking happens above when the page loads.
  // ============================================================

  const handleCheckReviewEligibility = async () => {
    const storedGuestCustomerId =
      guestCustomerId ||
      localStorage.getItem('guest_customer_id');

    if (!storedGuestCustomerId) {
      setReviewEligibility({
        canReview: false,
        message:
          'No previous order was found on this browser.',
      });

      return;
    }

    setGuestCustomerId(storedGuestCustomerId);
    setCheckingReviewEligibility(true);

    try {
      const response = await fetch(
        `/api/products/${slug}/review-eligibility?guestCustomerId=${encodeURIComponent(
          storedGuestCustomerId
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        setReviewEligibility({
          canReview: false,
          message:
            data.message ||
            'We could not verify your order.',
        });

        return;
      }

      setReviewEligibility({
        canReview: Boolean(data.canReview),
        orderId: data.orderId,
        customerName: data.customerName,
        message: data.message,
      });
    } catch (error) {
      console.error(
        'Review eligibility error:',
        error
      );

      setReviewEligibility({
        canReview: false,
        message:
          'Unable to verify your order right now. Please try again.',
      });
    } finally {
      setCheckingReviewEligibility(false);
    }
  };

  // ============================================================
  // SUBMIT REVIEW
  // ============================================================

  const handleSubmitReview = async () => {
    if (!reviewEligibility.canReview) {
      showToast(
        'You are not eligible to review this product.'
      );

      return;
    }

    if (!reviewRating) {
      showToast('Please select a rating.');
      return;
    }

    if (!reviewComment.trim()) {
      showToast('Please write your review.');
      return;
    }

    if (!reviewEligibility.orderId) {
      showToast('Order verification is missing.');
      return;
    }

    setReviewSubmitting(true);

    try {
      const response = await fetch(
        `/api/products/${slug}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: reviewEligibility.orderId,
            customerName:
              reviewEligibility.customerName ||
              'Customer',
            guestCustomerId,
            rating: reviewRating,
            comment: reviewComment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showToast(
          data.message ||
          'Unable to submit your review.'
        );

        return;
      }

      showToast(
        'Thank you! Your review has been submitted.'
      );

      // Reset review form
      setReviewRating(0);
      setReviewComment('');

      // Disable review form after successful submission
      setReviewEligibility({
        canReview: false,
        message:
          '',
      });

      // Refresh reviews
      const reviewsResponse = await fetch(
        `/api/products/${slug}/reviews`
      );

      if (reviewsResponse.ok) {
        const reviewsData =
          await reviewsResponse.json();

        setReviews(reviewsData.data || []);
      }
    } catch (error) {
      console.error(
        'Submit review error:',
        error
      );

      showToast(
        'Unable to submit your review. Please try again.'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">

          <div className="md:w-5/12 aspect-[4/3] bg-gray-100 rounded-lg animate-pulse" />

          <div className="md:w-7/12 space-y-3">

            <div className="h-7 bg-gray-100 rounded w-3/4 animate-pulse" />

            <div className="h-5 bg-gray-100 rounded w-1/4 animate-pulse" />

            <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />

            <div className="h-24 bg-gray-100 rounded animate-pulse mt-4" />

          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PRODUCT NOT FOUND
  // ============================================================

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">

        <p className="text-sm text-gray-500">
          Product not found.
        </p>

        <Link
          href="/products"
          className="mt-3 inline-block text-sm text-[#7A1F3D] hover:text-green-700"
        >
          Back to products
        </Link>

      </div>
    );
  }

  // ============================================================
  // PRODUCT DATA
  // ============================================================

  const stockBadge = getStockBadge(product.stock);
  const inStock = product.stock > 0;

  const images =
    product.images?.length > 0
      ? product.images
      : ['/placeholder.png'];

  const variantString =
    Object.values(variantSelections).join(' / ');

  const discount =
    product.compare_price > product.price
      ? Math.round(
        ((product.compare_price - product.price) /
          product.compare_price) *
        100
      )
      : 0;

  // ============================================================
  // ADD TO CART
  // ============================================================

  // const handleAddToCart = () => {
  //   addItem({
  //     productId: product.id,
  //     name: product.name,
  //     slug: product.slug,
  //     image: images[0],
  //     price: product.price,
  //     comparePrice: product.compare_price,
  //     qty: quantity,
  //     variant: variantString || undefined,
  //     stock: product.stock,
  //   });

  //   showToast('Product added to cart');
  // };

  const handleAddToCart = async () => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          eventType: 'click',
        }),
      });
    } catch (error) {
      console.error(
        'Product click tracking error:',
        error
      );
    }

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: images[0],
      price: product.price,
      comparePrice: product.compare_price,
      qty: quantity,
      variant: variantString || undefined,
      stock: product.stock,
    });

    showToast('Product added to cart');
  };

  // ============================================================
  // BUY NOW
  // ============================================================

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  // ============================================================
  // WHATSAPP ORDER
  // ============================================================

  const handleWhatsAppOrder = () => {
    if (!whatsappNumber || !product) return;

    let phoneNumber =
      whatsappNumber.replace(/\D/g, '');

    if (phoneNumber.startsWith('0')) {
      phoneNumber =
        '92' + phoneNumber.substring(1);
    }

    const message = encodeURIComponent(
      `Hi, I'd like to order:

Product: ${product.name}
Quantity: ${quantity}
${variantString
        ? `Variant: ${variantString}\n`
        : ''
      }Price: ${formatCurrency(
        product.price * quantity,
        currency
      )}`
    );

    const whatsappUrl =
      `https://wa.me/${phoneNumber}?text=${message}`;

    window.open(
      whatsappUrl,
      '_blank'
    );
  };

  // ============================================================
  // RETURN UI
  // ============================================================

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-12">

      {/* ======================================================
          BREADCRUMB
      ====================================================== */}

      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">

        <Link
          href="/"
          className="hover:text-[#7A1F3D]"
        >
          Home
        </Link>

        <ChevronRight className="h-3 w-3" />

        <Link
          href="/products"
          className="hover:text-[#7A1F3D]"
        >
          Products
        </Link>

        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />

            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-[#7A1F3D]"
            >
              {product.category.name}
            </Link>
          </>
        )}

      </nav>

      {/* ======================================================
          MOBILE BACK
      ====================================================== */}

      <button
        onClick={() => router.back()}
        className="md:hidden flex items-center gap-1 text-sm text-gray-500 mb-3 hover:text-[#7A1F3D]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* ======================================================
          MAIN PRODUCT
      ====================================================== */}

      <div className="flex flex-col md:flex-row gap-6">

        {/* IMAGE */}

        <div className="md:w-5/12">

          <div className="relative aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden border border-gray-100">

            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-contain p-2"
            />

            {discount > 0 && (
              <Badge className="absolute top-2 left-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                -{discount}%
              </Badge>
            )}

            <Badge
              className={cn(
                'absolute top-8 left-0 text-[10px] px-1.5 py-0.5 rounded',
                stockBadge.color
              )}
            >
              {stockBadge.label}
            </Badge>

          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">

              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() =>
                    setSelectedImage(index)
                  }
                  className={cn(
                    'w-14 h-14 rounded-md overflow-hidden border-2 shrink-0 transition-all',
                    index === selectedImage
                      ? 'border-green-600 ring-1 ring-green-200'
                      : 'border-gray-100 hover:border-gray-300'
                  )}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}

            </div>
          )}

        </div>

        {/* PRODUCT INFO */}

        <div className="md:w-7/12">

          {/* PRODUCT TITLE + RATING */}

          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">

              {/* RATING */}

              {reviewStats.count > 0 ? (
                <>
                  <div className="flex items-center gap-1.5">

                    <span className="text-sm font-semibold text-gray-900">
                      {reviewStats.average.toFixed(1)}
                    </span>

                    <ReviewStars
                      rating={reviewStats.average}
                    />

                    <span className="text-xs text-gray-400">
                      ({reviewStats.count})
                    </span>

                  </div>

                  <span className="text-gray-300">|</span>
                </>
              ) : (
                <span className="text-xs text-gray-400">
                  No reviews yet
                </span>
              )}

              {/* CATEGORY */}

              {product.category && (
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="text-xs text-[#7A1F3D] font-medium hover:underline"
                >
                  {product.category.name}
                </Link>
              )}

            </div>
          </div>

          {/* PRICE */}

          <div className="flex items-baseline gap-2 mt-3">

            <span className="text-2xl font-semibold text-black">
              {formatCurrency(
                product.price,
                currency
              )}
            </span>

            {product.compare_price >
              product.price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatCurrency(
                    product.compare_price,
                    currency
                  )}
                </span>
              )}

            {discount > 0 && (
              <Badge className="bg-red-50 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                Save {discount}%
              </Badge>
            )}

          </div>

          {/* SHORT DESCRIPTION */}

          {product.short_description && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              {product.short_description}
            </p>
          )}

          <Separator className="my-4" />

          {/* VARIANTS */}

          {product.variants &&
            product.variants.length > 0 && (
              <div className="space-y-3 mb-4">

                {product.variants.map(
                  (variant) => (
                    <div key={variant.label}>

                      <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                        {variant.label}
                      </label>

                      <Select
                        value={
                          variantSelections[
                          variant.label
                          ] ||
                          variant.options[0]
                        }
                        onValueChange={(value) =>
                          setVariantSelections(
                            (prev) => ({
                              ...prev,
                              [variant.label]:
                                value,
                            })
                          )
                        }
                      >
                        <SelectTrigger className="mt-1 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          {variant.options.map(
                            (option) => (
                              <SelectItem
                                key={option}
                                value={option}
                              >
                                {option}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>

                    </div>
                  )
                )}

              </div>
            )}

          {/* QUANTITY */}

          <div className="mb-4">

            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Quantity
            </label>

            <div className="flex items-center gap-3 mt-1">

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() =>
                  setQuantity((q) =>
                    Math.max(1, q - 1)
                  )
                }
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <span className="w-10 text-center text-sm font-medium border rounded-md h-9 flex items-center justify-center">
                {quantity}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(
                      product.stock,
                      q + 1
                    )
                  )
                }
                disabled={
                  quantity >= product.stock
                }
              >
                <Plus className="h-4 w-4" />
              </Button>

              {inStock && (
                <span className="text-xs text-gray-400">
                  {product.stock} available
                </span>
              )}

            </div>

          </div>

          {/* ACTION BUTTONS */}

          <div className="space-y-2">

            <div className="flex gap-2">

              <Button
                className="flex-1 h-10 bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white text-sm font-medium"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>

              <Button
                className="flex-1 h-10 bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white text-sm font-medium"
                onClick={handleBuyNow}
                disabled={!inStock}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Buy Now
              </Button>

            </div>

            {whatsappNumber && (
              <Button
                variant="outline"
                className="bg-secondary text-sm"
                onClick={handleWhatsAppOrder}
                disabled={!inStock}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Order via WhatsApp
              </Button>
            )}

          </div>

          <Separator className="my-4" />

          {/* PRODUCT META */}

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">

            {product.sku && (
              <div>
                <span className="text-gray-400">
                  SKU:
                </span>{' '}
                <span className="text-gray-700">
                  {product.sku}
                </span>
              </div>
            )}

            {product.weight > 0 && (
              <div>
                <span className="text-gray-400">
                  Weight:
                </span>{' '}
                <span className="text-gray-700">
                  {product.weight}g
                </span>
              </div>
            )}

            {product.tags &&
              product.tags.length > 0 && (
                <div className="col-span-2 flex flex-wrap items-center gap-1.5 mt-1">

                  <span className="text-gray-400 text-xs">
                    Tags:
                  </span>

                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/products?tag=${encodeURIComponent(
                        tag
                      )}`}
                    >
                      <Badge
                        variant="secondary"
                        className="text-[10px] cursor-pointer"
                      >
                        {tag}
                      </Badge>
                    </Link>
                  ))}

                </div>
              )}

          </div>

          {/* SPECIFICATIONS */}

          {product.specifications &&
            product.specifications.length > 0 && (
              <div className="mt-4">

                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Specifications
                </h3>

                <div className="rounded-md border divide-y">

                  {product.specifications.map(
                    (spec, idx) => (
                      <div
                        key={idx}
                        className="flex text-xs"
                      >
                        <span className="w-2/5 px-3 py-2 bg-gray-50 text-gray-500 font-medium shrink-0">
                          {spec.key}
                        </span>

                        <span className="px-3 py-2 text-gray-800">
                          {spec.value}
                        </span>
                      </div>
                    )
                  )}

                </div>

              </div>
            )}

          {/* TRUST BADGES */}

          <div className="grid grid-cols-3 gap-3 mt-4">

            <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50">
              <Truck className="h-4 w-4 text-[#7A1F3D]" />

              <span className="text-[11px] text-gray-600">
                Free shipping
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50">
              <RotateCcw className="h-4 w-4 text-[#7A1F3D]" />

              <span className="text-[11px] text-gray-600">
                7-day returns
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50">
              <Shield className="h-4 w-4 text-[#7A1F3D]" />

              <span className="text-[11px] text-gray-600">
                Secure checkout
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* ======================================================
          PRODUCT DETAILS
      ====================================================== */}

      <div
        className="mt-8"
        style={{ display: 'none' }}
      >

        <div className="border rounded-lg overflow-hidden">

          <div className="bg-gray-50 px-5 py-3 border-b">

            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#7A1F3D]" />
              Product Details
            </h2>

          </div>

          <div className="p-5">

            {product.description ? (
              <div
                className="prose prose-sm max-w-none text-sm text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: product.description,
                }}
              />
            ) : (
              <p className="text-sm text-gray-500">
                No detailed description available for this product.
              </p>
            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          CUSTOMER REVIEWS
      ====================================================== */}

      <div className="mt-5">

        <div className="border rounded-lg overflow-hidden">

          {/* HEADER */}
          <div className="bg-gray-50 px-4 py-2.5 border-b flex items-center justify-between">

            <h2 className="text-sm font-semibold text-gray-900">
              Customer Reviews
            </h2>

            {reviewStats.count > 0 && (
              <div className="flex items-center gap-1.5">

                <span className="text-xs font-semibold text-gray-900">
                  {reviewStats.average.toFixed(1)}
                </span>

                <ReviewStars
                  rating={reviewStats.average}
                />

                <span className="text-[11px] text-gray-400">
                  ({reviewStats.count})
                </span>

              </div>
            )}

          </div>

          {/* ==================================================
        AUTOMATIC REVIEW ELIGIBILITY / FORM
    ================================================== */}

          <div className="px-4 py-3">

            {/* CHECKING ORDER */}
            {checkingReviewEligibility ? (

              <div className="flex items-center gap-2.5 py-1">

                <Loader2 className="h-4 w-4 animate-spin text-[#7A1F3D]" />

                <div>
                  <p className="text-xs font-medium text-gray-900">
                    Checking your order...
                  </p>

                  <p className="text-[11px] text-gray-500">
                    Verifying your purchase.
                  </p>
                </div>

              </div>

            ) : !reviewEligibility.canReview ? (

              /* ==================================================
                 NOT ELIGIBLE
              ================================================== */

              <div className="flex items-center justify-between gap-3">

                <div className="min-w-0">

                  <h3 className="text-xs font-semibold text-gray-900">
                    Have you purchased this product?
                  </h3>

                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Reviews are available after delivery.
                  </p>

                </div>

                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white text-xs px-3"
                  onClick={handleCheckReviewEligibility}
                  disabled={checkingReviewEligibility}
                >
                  <Star className="h-3.5 w-3.5 mr-1.5" />
                  Check Order
                </Button>

              </div>

            ) : (

              /* ==================================================
                 VERIFIED PURCHASE
              ================================================== */

              <div>

                {/* VERIFIED HEADER */}

                <div className="flex items-center gap-2 mb-3">

                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />

                  <div className="flex items-center gap-2">

                    <p className="text-xs font-semibold text-gray-900">
                      Verified purchase
                    </p>

                    {reviewEligibility.customerName && (
                      <span className="text-[11px] text-gray-500">
                        • {reviewEligibility.customerName}
                      </span>
                    )}

                  </div>

                </div>

                {/* RATING */}

                <div className="flex items-center gap-3 mb-3">

                  <label className="text-xs font-medium text-gray-700">
                    Rating
                  </label>

                  <div className="flex items-center gap-0.5">

                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setReviewRating(star)
                        }
                        className="p-0.5"
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''
                          }`}
                      >
                        <Star
                          className={cn(
                            'h-5 w-5 transition-colors',
                            star <= reviewRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          )}
                        />
                      </button>
                    ))}

                  </div>

                  {reviewRating > 0 && (
                    <span className="text-[11px] text-gray-500">
                      {reviewRating}/5
                    </span>
                  )}

                </div>

                {/* COMMENT */}

                <div className="mb-3">

                  <label
                    htmlFor="review-comment"
                    className="text-xs font-medium text-gray-700"
                  >
                    Your Review
                  </label>

                  <textarea
                    id="review-comment"
                    value={reviewComment}
                    onChange={(e) =>
                      setReviewComment(e.target.value)
                    }
                    placeholder="Write your experience..."
                    rows={2}
                    className="w-full mt-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs outline-none resize-none "
                  />

                </div>

                {/* SUBMIT */}

                <Button
                  type="button"
                  size="sm"
                  className="h-8 bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white text-xs px-3"
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                >

                  {reviewSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="h-3.5 w-3.5 mr-1.5" />
                      Submit Review
                    </>
                  )}

                </Button>

              </div>

            )}

          </div>

          {/* ==================================================
        EXISTING REVIEWS
    ================================================== */}

          <div className="px-4 py-3 border-t">

            {reviews.length === 0 ? (

              <p className="text-xs text-gray-500">
                No reviews yet. Be the first to review this product!
              </p>

            ) : (

              <div className="space-y-3">

                {reviews.map((review) => (

                  <div
                    key={review.id || review._id}
                    className="border-b last:border-0 pb-3 last:pb-0"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">

                        <span className="text-xs font-medium text-gray-900">
                          {review.name}
                        </span>

                        <ReviewStars
                          rating={review.rating}
                        />

                      </div>

                      <span className="text-[10px] text-gray-400">
                        {new Date(
                          review.created_at
                        ).toLocaleDateString()}
                      </span>

                    </div>

                    {review.comment && (
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </div>
      {/* ======================================================
          RELATED PRODUCTS
      ====================================================== */}

      {relatedProducts.length > 0 && (
        <section className="mt-10">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-base font-semibold text-gray-900">
              You May Also Like
            </h2>

            <Link
              href={`/products?category=${product.category?.slug || ''
                }`}
              className="text-xs text-[#7A1F3D] hover:text-green-700 font-medium"
            >
              View All
            </Link>

          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
              />
            ))}

          </div>

        </section>
      )}

    </div>
  );
}