'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  ShoppingBag,
  MessageCircle,
  ArrowLeft,
  Truck,
  RotateCcw,
  Shield,
  Package,
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
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [variantSelections, setVariantSelections] = useState<Record<string, string>>({});

  const currency = settings?.currency || '$';
  const whatsappNumber = settings?.whatsapp_number || '';

  // Fetch product
  useEffect(() => {
    setLoading(true);
    setSelectedImage(0);
    setQuantity(1);
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.data;
        if (p) {
          p.id = p._id || p.id;
          // Handle populated category_id (Mongoose replaces ObjectId with document)
          const catId = p.category_id;
          if (catId && typeof catId === 'object') {
            const catObj = catId as { _id: string; name: string; slug: string };
            p.category = { id: catObj._id, name: catObj.name, slug: catObj.slug, image: '', parent_id: null, is_active: true, sort_order: 0, created_at: '' };
            p.category_id = catObj._id;
          } else if (p.category) {
            p.category.id = p.category._id || p.category.id;
          }
        }
        setProduct(p);
        if (p?.variants) {
          const initial: Record<string, string> = {};
          p.variants.forEach((v: { label: string; options: string[] }) => {
            initial[v.label] = v.options[0];
          });
          setVariantSelections(initial);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Fetch related products
  useEffect(() => {
    if (!product?.category?.slug) return;
    fetch(`/api/products?category=${product.category.slug}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        const items = (data.data || [])
          .map((raw: Record<string, unknown>) => {
            const p = raw as unknown as Product & { _id?: string };
            p.id = (raw._id as string) || p.id;
            const catId = raw.category_id;
            if (catId && typeof catId === 'object') {
              const catObj = catId as { _id: string; name: string; slug: string };
              p.category = { id: catObj._id, name: catObj.name, slug: catObj.slug, image: '', parent_id: null, is_active: true, sort_order: 0, created_at: '' };
              p.category_id = catObj._id;
            }
            return p;
          })
          .filter((p: Product) => p.slug !== product.slug);
        setRelatedProducts(items.slice(0, 4));
      })
      .catch(() => setRelatedProducts([]));
  }, [product?.category?.slug, product?.slug]);

  // Fetch reviews
  useEffect(() => {
    if (!product?.id) return;
    fetch(`/api/products/${slug}/reviews`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setReviews(data.data || []))
      .catch(() => setReviews([]));
  }, [slug, product?.id]);

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

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-gray-500">Product not found.</p>
        <Link href="/products" className="mt-3 inline-block text-sm text-green-600 hover:text-green-700">
          Back to products
        </Link>
      </div>
    );
  }

  const stockBadge = getStockBadge(product.stock);
  const inStock = product.stock > 0;
  const images = product.images?.length > 0 ? product.images : ['/placeholder.png'];
  const variantString = Object.values(variantSelections).join(' / ');
  const discount = product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const handleAddToCart = () => {
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
    showToast(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  // const handleWhatsAppOrder = () => {
  //   if (!whatsappNumber) return;
  //   const variantText = variantString ? ` (${variantString})` : '';
  //   const message = encodeURIComponent(
  //     `Hi, I'd like to order: ${product.name}${variantText} x${quantity} - ${formatCurrency(product.price * quantity, currency)}`
  //   );
  //   window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  // };
  
  const handleWhatsAppOrder = () => {
  if (!whatsappNumber || !product) return;

  let phoneNumber = whatsappNumber.replace(/\D/g, '');

  // Convert Pakistani local format:
  // 03001234567 -> 923001234567
  if (phoneNumber.startsWith('0')) {
    phoneNumber = '92' + phoneNumber.substring(1);
  }

  // If number was saved as 92XXXXXXXXXX, keep it as is.
  // Example: +92 300 1234567 -> 923001234567

  const message = encodeURIComponent(
    `Hi, I'd like to order:

Product: ${product.name}
Quantity: ${quantity}
${variantString ? `Variant: ${variantString}\n` : ''}Price: ${formatCurrency(
      product.price * quantity,
      currency
    )}`
  );

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  console.log('WhatsApp Number:', phoneNumber);
  console.log('WhatsApp URL:', whatsappUrl);

  window.open(whatsappUrl, '_blank');
};

  // Strip HTML tags for short description display
  const stripHtml = (html: string) => html?.replace(/<[^>]*>/g, '').trim() || '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:text-green-600">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-green-600">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-green-600">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-900 truncate">{product.name}</span>
      </nav>

      {/* Back button (mobile) */}
      <button
        onClick={() => router.back()}
        className="md:hidden flex items-center gap-1 text-sm text-gray-500 mb-3 hover:text-green-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Main product section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image Gallery - compact */}
        <div className="md:w-5/12">
          {/* Main image - smaller aspect ratio */}
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
            <Badge className={cn('absolute top-8 left-0 text-[10px] px-1.5 py-0.5 rounded', stockBadge.color)}>
              {stockBadge.label}
            </Badge>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'w-14 h-14 rounded-md overflow-hidden border-2 shrink-0 transition-all',
                    index === selectedImage
                      ? 'border-green-600 ring-1 ring-green-200'
                      : 'border-gray-100 hover:border-gray-300'
                  )}
                >
                  <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="md:w-7/12">
          <h1 className="text-lg md:text-xl font-semibold text-gray-900 leading-tight">{product.name}</h1>

          {/* Category + Rating row */}
          <div className="flex items-center gap-3 mt-2">
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-xs text-green-600 hover:text-green-700 font-medium"
              >
                {product.category.name}
              </Link>
            )}
            {(product.ratings_count || 0) > 0 && (
              <div className="flex items-center gap-1">
                <ReviewStars rating={product.ratings_avg || 0} count={product.ratings_count} />
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-bold text-green-600">{formatCurrency(product.price, currency)}</span>
            {product.compare_price > product.price && (
              <span className="text-sm text-gray-400 line-through">{formatCurrency(product.compare_price, currency)}</span>
            )}
            {discount > 0 && (
              <Badge className="bg-red-50 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                Save {discount}%
              </Badge>
            )}
          </div>

          {/* Short description */}
          {product.short_description && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{product.short_description}</p>
          )}

          <Separator className="my-4" />

          {/* Variant selectors */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 mb-4">
              {product.variants.map((variant) => (
                <div key={variant.label}>
                  <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {variant.label}
                  </label>
                  <Select
                    value={variantSelections[variant.label] || variant.options[0]}
                    onValueChange={(value) => setVariantSelections((prev) => ({ ...prev, [variant.label]: value }))}
                  >
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {variant.options.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {/* Quantity */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Quantity</label>
            <div className="flex items-center gap-3 mt-1">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-medium border rounded-md h-9 flex items-center justify-center">{quantity}</span>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}>
                <Plus className="h-4 w-4" />
              </Button>
              {inStock && <span className="text-xs text-gray-400">{product.stock} available</span>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white text-sm font-medium" onClick={handleAddToCart} disabled={!inStock}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white text-sm font-medium" onClick={handleBuyNow} disabled={!inStock}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Buy Now
              </Button>
            </div>
            {whatsappNumber && (
              <Button variant="outline" className="bg-secondary text-sm" onClick={handleWhatsAppOrder} disabled={!inStock}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Order via WhatsApp
              </Button>
            )}
          </div>

          <Separator className="my-4" />

          {/* Product meta */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {product.sku && (
              <div><span className="text-gray-400">SKU:</span> <span className="text-gray-700">{product.sku}</span></div>
            )}
            {product.weight > 0 && (
              <div><span className="text-gray-400">Weight:</span> <span className="text-gray-700">{product.weight}g</span></div>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="col-span-2 flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-gray-400 text-xs">Tags:</span>
                {product.tags.map((tag) => (
                  <Link key={tag} href={`/products?tag=${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="text-[10px] hover:bg-green-50 hover:text-green-600 cursor-pointer">{tag}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Specifications</h3>
              <div className="rounded-md border divide-y">
                {product.specifications.map((spec, idx) => (
                  <div key={idx} className="flex text-xs">
                    <span className="w-2/5 px-3 py-2 bg-gray-50 text-gray-500 font-medium shrink-0">
                      {spec.key}
                    </span>
                    <span className="px-3 py-2 text-gray-800">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50">
              <Truck className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-[11px] text-gray-600 leading-tight">Free shipping over $50</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50">
              <RotateCcw className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-[11px] text-gray-600 leading-tight">7-day returns</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50">
              <Shield className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-[11px] text-gray-600 leading-tight">Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description section */}
      <div className="mt-8">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              Product Details
            </h2>
          </div>
          <div className="p-5">
            {product.description ? (
              <div
                className="prose prose-sm max-w-none text-sm text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-sm text-gray-500">No detailed description available for this product.</p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="mt-6">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Customer Reviews
            </h2>
            {(product.ratings_count || 0) > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{product.ratings_avg?.toFixed(1) || '0.0'}</span>
                <ReviewStars rating={product.ratings_avg || 0} count={product.ratings_count} />
                <span className="text-xs text-gray-400">({product.ratings_count})</span>
              </div>
            )}
          </div>
          <div className="p-5">
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id || review._id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{review.name}</span>
                        <ReviewStars rating={review.rating} />
                      </div>
                      <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="mt-1.5 text-sm text-gray-600">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">You May Also Like</h2>
            <Link href={`/products?category=${product.category?.slug || ''}`} className="text-xs text-green-600 hover:text-green-700 font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
