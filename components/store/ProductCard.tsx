'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const currency = settings?.currency || '$';
  const stockBadge = getStockBadge(product.stock);
  const whatsappNumber = settings?.whatsapp_number || '';
  const inStock = product.stock > 0;
  const imageSrc = product.images?.[0] || '/placeholder.png';

  const handleAddToCart = (e: React.MouseEvent) => {
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
    showToast(`${product.name} added to cart`);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!whatsappNumber) return;
    const message = encodeURIComponent(`Hi, I'm interested in ${product.name}`);
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-lg border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageSrc}
          alt={product.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />

        {/* Stock badge */}
        <Badge
          className={cn(
            'absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded',
            stockBadge.color
          )}
        >
          {stockBadge.label}
        </Badge>

        {/* Discount badge */}
        {product.compare_price > product.price && (
          <Badge className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
            -{Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}%
          </Badge>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col gap-1.5">
        {/* Name */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-green-600">
            {formatCurrency(product.price, currency)}
          </span>
          {product.compare_price > product.price && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(product.compare_price, currency)}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!inStock}
            className={cn(
              'flex-1 h-8 text-xs bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400'
            )}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add to Cart
          </Button>

          {whatsappNumber && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleWhatsApp}
              className="h-8 text-xs border border-green-600 text-green-600 hover:bg-green-50"
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}
