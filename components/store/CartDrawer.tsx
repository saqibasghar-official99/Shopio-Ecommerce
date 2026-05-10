'use client';

import React from 'react';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQty, removeItem, subtotal, hydrated } = useCart();
  const { settings } = useSettings();
  const currency = settings?.currency || '$';

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!hydrated ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500 mb-1">Your cart is empty</p>
              <p className="text-xs text-gray-400">Add some products to get started</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs text-green-600 border-green-600 hover:bg-green-50"
                onClick={onClose}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={item.image || '/placeholder.png'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={onClose}
                      className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-green-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>
                    )}
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(item.price, currency)}
                      </span>
                      {item.comparePrice > item.price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatCurrency(item.comparePrice, currency)}
                        </span>
                      )}
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.productId, item.qty - 1, item.variant)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-medium w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.productId, Math.min(item.qty + 1, item.stock), item.variant)}
                        disabled={item.qty >= item.stock}
                        className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId, item.variant)}
                        className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {hydrated && items.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>
            <p className="text-xs text-gray-400">Shipping & taxes calculated at checkout</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs border-green-600 text-green-600 hover:bg-green-50"
                onClick={onClose}
              >
                Continue Shopping
              </Button>
              <Link href="/checkout" onClick={onClose}>
                <Button
                  size="sm"
                  className="w-full h-9 text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                  Checkout
                </Button>
              </Link>
            </div>
            <Link
              href="/cart"
              onClick={onClose}
              className="block text-center text-xs text-gray-500 hover:text-green-600 transition-colors"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
