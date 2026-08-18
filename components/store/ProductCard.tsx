'use client';

import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatCurrency, getStockBadge, cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

function ProductCardBase({ product, priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const currency = settings?.currency || '$';
  const stockBadge = getStockBadge(product.stock);
  const whatsappNumber = settings?.whatsapp_number || '';
  const inStock = product.stock > 0;
  const imageSrc = product.images?.[0] || '/placeholder.png';

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
      showToast(`Product added to cart`);
    },
    [addItem, imageSrc, inStock, product.compare_price, product.id, product.name, product.price, product.slug, product.stock, showToast]
  );

  // const handleWhatsApp = useCallback(
  //   (e: React.MouseEvent) => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     if (!whatsappNumber) return;
  //     const message = encodeURIComponent(`Hi, I'm interested in ${product.name}`);
  //     window.open(
  //       `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`,
  //       '_blank'
  //     );
  //   },
  //   [product.name, whatsappNumber]
  // );

  const handleWhatsApp = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      if (!whatsappNumber) {
        showToast('WhatsApp ordering is not available', 'error');
        return;
      }

      let number = whatsappNumber.trim().replace(/\D/g, '');

      // Pakistan:
      // 03001234567 -> 923001234567
      if (number.startsWith('0')) {
        number = '92' + number.substring(1);
      }

      // Remove + if somehow left in the value
      number = number.replace(/\D/g, '');

      if (!number) {
        showToast('Invalid WhatsApp number', 'error');
        return;
      }

      const productUrl =
        `${window.location.origin}/products/${product.slug}`;

      const message = encodeURIComponent(
        `${settings?.whatsapp_message
          ? `_${settings.whatsapp_message}_\n\n`
          : ''
        }` +
        `*🛍️ Product Inquiry*\n\n` +
        `*Product:* ${product.name}\n` +
        `*Price:* ${formatCurrency(product.price, currency)}\n\n` +
        `Hi, I'm interested in this product. Please provide more details.\n\n` +
        `*Product Link:* ${productUrl}`
      );

      const whatsappUrl = `https://wa.me/${number}?text=${message}`;

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
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

  // return (
  //   <Link
  //     href={`/products/${product.slug}`}
  //     className="group block rounded-lg border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow"
  //     prefetch={false}
  //   >
  //     <div className="relative aspect-square overflow-hidden bg-gray-100">
  //       <img
  //         src={imageSrc}
  //         alt={product.name}
  //         className="h-full w-full object-cover transition-transform group-hover:scale-105"
  //         loading={priority ? 'eager' : 'lazy'}
  //         decoding="async"
  //         fetchPriority={priority ? 'high' : 'auto'}
  //       />

  //       <Badge
  //         className={cn(
  //           'absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded',
  //           stockBadge.color
  //         )}
  //       >
  //         {stockBadge.label}
  //       </Badge>

  //       {product.compare_price > product.price && (
  //         <Badge className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
  //           -
  //           {Math.round(
  //             ((product.compare_price - product.price) / product.compare_price) * 100
  //           )}
  //           %
  //         </Badge>
  //       )}
  //     </div>

  //     <div className="p-3 flex flex-col gap-1.5">
  //       <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
  //         {product.name}
  //       </h3>

  //       <div className="flex items-baseline gap-1.5">
  //         <span className="text-sm font-semibold text-green-600">
  //           {formatCurrency(product.price, currency)}
  //         </span>
  //         {product.compare_price > product.price && (
  //           <span className="text-xs text-gray-400 line-through">
  //             {formatCurrency(product.compare_price, currency)}
  //           </span>
  //         )}
  //       </div>

  //       <div className="flex gap-2 mt-1">
  //         <Button
  //           size="sm"
  //           onClick={handleAddToCart}
  //           disabled={!inStock}
  //           className={cn(
  //             'flex-1 h-8 text-xs bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400'
  //           )}
  //         >
  //           <ShoppingCart className="h-3 w-3 mr-1" />
  //           Add to Cart
  //         </Button>

  //         {whatsappNumber && (
  //           <Button
  //             size="sm"
  //             variant="outline"
  //             onClick={handleWhatsApp}
  //             className="h-8 text-xs border border-green-600 text-green-600 hover:bg-green-50"
  //           >
  //             <MessageCircle className="h-3 w-3" />
  //           </Button>
  //         )}
  //       </div>
  //     </div>
  //   </Link>
  // );

  return (
    <div className="group block rounded-lg border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Link */}
      <Link
        href={`/products/${product.slug}`}
        prefetch={false}
        className="block"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
          />

          <Badge
            className={cn(
              'absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded',
              stockBadge.color
            )}
          >
            {stockBadge.label}
          </Badge>

          {product.compare_price > product.price && (
            <Badge className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
              -
              {Math.round(
                ((product.compare_price - product.price) /
                  product.compare_price) *
                100
              )}
              %
            </Badge>
          )}
        </div>

        <div className="p-3 pb-1 flex flex-col gap-1.5">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-1.5">
            <span className="text-md font-semibold text-[#7A1F3D]">
              {formatCurrency(product.price, currency)}
            </span>

            {product.compare_price > product.price && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.compare_price, currency)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Actions - OUTSIDE Link */}
      <div className="px-3 pb-3 pt-1">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex-1 h-8 text-xs bg-[#7A1F3D] text-white hover:bg-[#7A1F3D] disabled:bg-gray-200 disabled:text-gray-400"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add to Cart
          </Button>

          {whatsappNumber && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleWhatsApp}
              className="h-8 w-9 p-0 text-xs border border-[#7A1F3D] text-[#7A1F3D] hover:bg-[#7A1F3D]"
            >
              <MessageCircle className="h-3 w-3 hover:text-white" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Memo: cart/settings context changes shouldn't re-render every card unnecessarily.
const ProductCard = memo(ProductCardBase, (prev, next) => {
  return prev.product.id === next.product.id && prev.priority === next.priority;
});

export default ProductCard;
