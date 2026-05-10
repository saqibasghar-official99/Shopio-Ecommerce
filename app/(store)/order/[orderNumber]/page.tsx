'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  Package,
  Truck,
  Clock,
  ShieldCheck,
  CircleDot,
  Download,
} from 'lucide-react';
import { Order } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: ShieldCheck },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Check },
] as const;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  bank: 'Bank Transfer',
  whatsapp: 'WhatsApp Order',
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const { settings } = useSettings();
  const { showToast } = useToast();
  const currency = settings?.currency || '$';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${orderNumber}`)
      .then((r) => {
        if (!r.ok) throw new Error('Order not found');
        return r.json();
      })
      .then((data) => {
        const o = data.data;
        if (o) o.id = o._id || o.id;
        setOrder(o);
      })
      .catch((err) => setError(err.message || 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-60 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-900 mt-6">Order not found</h1>
        <p className="text-sm text-gray-500 mt-2">
          {error || 'We couldn\'t find an order with that number.'}
        </p>
        <Link href="/">
          <Button className="mt-6 bg-green-600 hover:bg-green-700 text-white">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(
    (step) => step.key === order.order_status
  );
  // If status is cancelled/returned, show all as incomplete
  const isCancelled = order.order_status === 'cancelled';
  const isReturned = order.order_status === 'returned';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Order Details</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Order #{order.order_number}
          </p>
        </div>
        <Badge
          className={cn(
            'text-xs px-2.5 py-1',
            isCancelled
              ? 'bg-red-100 text-red-700'
              : isReturned
              ? 'bg-gray-100 text-gray-700'
              : order.order_status === 'delivered'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          )}
        >
          {isCancelled
            ? 'Cancelled'
            : isReturned
            ? 'Returned'
            : order.order_status.charAt(0).toUpperCase() +
              order.order_status.slice(1)}
        </Badge>
      </div>

      {/* Status Timeline */}
      {!isCancelled && !isReturned && (
        <div className="border rounded-lg p-5 bg-white mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Status</h2>
          <div className="flex items-center justify-between relative">
            {/* Line behind steps */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-green-600 transition-all duration-500"
              style={{
                width: currentStepIndex >= 0
                  ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`
                  : '0%',
              }}
            />

            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;

              return (
                <div
                  key={step.key}
                  className="relative flex flex-col items-center z-10"
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      isCompleted
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] mt-1.5 font-medium text-center leading-tight',
                      isCompleted ? 'text-green-600' : 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="border rounded-lg p-5 bg-white mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Items</h2>
        <div className="divide-y">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="w-12 h-12 shrink-0 bg-gray-100 rounded overflow-hidden">
                <img
                  src={item.image || '/placeholder.png'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </p>
                {item.variant && (
                  <p className="text-xs text-gray-500">{item.variant}</p>
                )}
                <p className="text-xs text-gray-500">Qty: {item.qty}</p>
              </div>
              <span className="text-sm font-medium shrink-0">
                {formatCurrency(item.unitPrice * item.qty, currency)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Totals */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(order.subtotal, currency)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="text-green-600">
                -{formatCurrency(order.discount, currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery</span>
            <span>
              {order.delivery_fee === 0
                ? 'Free'
                : formatCurrency(order.delivery_fee, currency)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="text-green-600">
              {formatCurrency(order.total, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Customer & Payment Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Customer Info
          </h2>
          <div className="space-y-1.5 text-sm">
            <p className="text-gray-700">{order.customer_name}</p>
            <p className="text-gray-500">{order.customer_phone}</p>
            <p className="text-gray-500">{order.customer_email}</p>
            <p className="text-gray-500">
              {order.customer_address}, {order.customer_city}
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Payment Info
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="text-gray-700">
                {PAYMENT_METHOD_LABELS[order.payment_method] ||
                  order.payment_method}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <Badge
                className={cn(
                  'text-[10px] px-1.5 py-0.5',
                  order.payment_status === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                )}
              >
                {order.payment_status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-700">
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            window.open(`/api/invoice/${order.order_number}`, '_blank');
          }}
        >
          <Download className="h-4 w-4" />
          Download Invoice
        </Button>
        <Link href="/">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
