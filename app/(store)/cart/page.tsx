'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingBag, Tag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';
import { formatCurrency, cn } from '@/lib/utils';
import { DeliveryZone } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQty,
    removeItem,
    subtotal,
    couponCode,
    setCouponCode,
    discount,
    setDiscount,
    deliveryFee,
    setDeliveryFee,
    deliveryZoneName,
    setDeliveryZoneName,
  } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const currency = settings?.currency || '$';

  const [couponInput, setCouponInput] = useState(couponCode);
  const [couponLoading, setCouponLoading] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [zonesLoading, setZonesLoading] = useState(true);

  // Add state for visible coupons
  const [visibleCoupons, setVisibleCoupons] = useState<Array<{ code: string, type: string, value: number, min_order: number }>>([]);

  // Fetch visible coupons alongside delivery zones
  useEffect(() => {
    fetch('/api/coupons?is_visible=true&limit=50')
      .then(r => r.json())
      .then(data => {
        const list = (data.data || []).filter((c: any) => c.is_visible && c.is_active);
        setVisibleCoupons(list);
      })
      .catch(() => { });
  }, []);

  // Fetch delivery zones
  useEffect(() => {
    fetch('/api/delivery-zones')
      .then((r) => r.json())
      .then((data) => {
        const zones = (data.data || []).filter((z: DeliveryZone) => z.is_active).map((z: DeliveryZone & { _id?: string }) => ({ ...z, id: z._id || z.id }));
        setDeliveryZones(zones);
      })
      .catch(() => { })
      .finally(() => setZonesLoading(false));
  }, []);

  // Handle delivery zone change
  const handleZoneChange = (zoneId: string) => {
    if (zoneId === 'none') {
      setSelectedZone('');
      setDeliveryFee(0);
      setDeliveryZoneName('');
      return;
    }
    setSelectedZone(zoneId);
    const zone = deliveryZones.find((z) => z.id === zoneId);
    setDeliveryFee(zone ? zone.fee : 0);
    setDeliveryZoneName(zone ? zone.name : '');
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCouponCode(couponInput.trim());
        setDiscount(data.data?.discount || 0);
        showToast('Coupon applied successfully!');
      } else {
        showToast(data.message || 'Invalid coupon code', 'error');
        setCouponCode('');
        setDiscount(0);
      }
    } catch {
      showToast('Failed to validate coupon', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setDiscount(0);
    showToast('Coupon removed');
  };

  const total = subtotal - discount + deliveryFee;

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-900 mt-6">Your cart is empty</h1>
        <p className="text-sm text-gray-500 mt-2">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
        <Link href="/products">
          <Button className="mt-6 bg-green-600 hover:bg-green-700 text-white">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variant}`}
                className="flex gap-4 p-4 border rounded-lg bg-white"
              >
                {/* Image */}
                <Link
                  href={`/products/${item.slug}`}
                  className="w-20 h-20 shrink-0 bg-gray-100 rounded-md overflow-hidden"
                >
                  <img
                    src={item.image || '/placeholder.png'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="text-sm font-medium text-gray-900 hover:text-green-600 line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variant)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQty(item.productId, item.qty - 1, item.variant)
                        }
                        disabled={item.qty <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.qty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQty(item.productId, item.qty + 1, item.variant)
                        }
                        disabled={item.qty >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col items-end text-right">
                      <span className="mr-2 text-sm font-semibold text-black">
                        {formatCurrency(item.price * item.qty, currency)}
                      </span>

                      {item.comparePrice > item.price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatCurrency(item.comparePrice * item.qty, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:w-80 shrink-0">
          <div className="border rounded-lg p-5 bg-white sticky top-20">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h2>

            {/* Coupon */}

            {/* Available Coupons */}
            {visibleCoupons.length > 0 && !couponCode && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1.5">Available coupons:</p>
                <div className="flex flex-wrap gap-1.5">
                  {visibleCoupons.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCouponInput(c.code); }}
                      className="text-xs px-2 py-1 border border-dashed border-green-400 rounded text-green-700 hover:bg-green-50 font-mono"
                      title={c.min_order > 0 ? `Min order: ${formatCurrency(c.min_order, currency)}` : ''}
                    >
                      {c.code} · {c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value, currency)} off
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-4">
              {couponCode && discount > 0 ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs font-medium text-green-600">
                      {couponCode}
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyCoupon();
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>

            {/* Delivery zone */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Delivery Zone <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <Select value={selectedZone} onValueChange={handleZoneChange}>
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue placeholder="Select delivery zone (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs text-gray-400">No delivery zone</SelectItem>
                  {deliveryZones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} - {formatCurrency(zone.fee, currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">-{formatCurrency(discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="font-medium">
                  {deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee, currency)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span className="text-black">{formatCurrency(total, currency)}</span>
              </div>
            </div>

            {/* Checkout button */}
            <Link href="/checkout" className="block mt-4">
              <Button className="w-full h-10 bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
