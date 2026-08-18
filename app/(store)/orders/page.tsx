'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Package, Truck, CircleCheck as CheckCircle, Clock, Circle as XCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getOrderStatusColor } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';

interface OrderData {
  _id?: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  items: {
    productId: string;
    name: string;
    image: string;
    unitPrice: number;
    qty: number;
  }[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function OrdersPage() {
  const { settings } = useSettings();
  const currency = settings?.currency || '$';

  const [searchInput, setSearchInput] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const [trackedOrder, setTrackedOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Load recent orders from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentOrders');
      if (saved) {
        const orderNumbers: string[] = JSON.parse(saved);
        if (orderNumbers.length > 0) {
          fetchRecentOrders(orderNumbers);
        }
      }
    } catch {}
  }, []);

  const fetchRecentOrders = async (orderNumbers: string[]) => {
    try {
      const results = await Promise.all(
        orderNumbers.map(num =>
          fetch(`/api/orders/${num}`).then(r => r.json()).then(d => d.data || null).catch(() => null)
        )
      );
      setRecentOrders(results.filter(Boolean) as OrderData[]);
    } catch {}
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchInput.trim();
    if (!input) return;

    setLoading(true);
    setError('');
    setTrackedOrder(null);
    setSearched(true);

    try {
      // Try as order number first
      const res = await fetch(`/api/orders/${input}`);
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const orderData = data.data;
        // Verify email/phone if provided
        if (emailOrPhone.trim()) {
          const verify = emailOrPhone.trim().toLowerCase();
          const matchesEmail = orderData.customer_email?.toLowerCase() === verify;
          const matchesPhone = orderData.customer_phone === verify;
          if (!matchesEmail && !matchesPhone) {
            setError('Order found but email/phone does not match.');
            setLoading(false);
            return;
          }
        }
        setTrackedOrder(orderData);
        saveRecentOrder(orderData.order_number);
      } else {
        // Try searching by email or phone
        if (emailOrPhone.trim()) {
          setError('No order found. Try entering the order ID from your confirmation.');
        } else {
          setError('Order not found. Enter your order ID (e.g. ORD-XXXXXX) or provide email/phone for verification.');
        }
      }
    } catch {
      setError('Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveRecentOrder = (orderNumber: string) => {
    try {
      const saved = localStorage.getItem('recentOrders');
      const existing: string[] = saved ? JSON.parse(saved) : [];
      const updated = [orderNumber, ...existing.filter(n => n !== orderNumber)].slice(0, 10);
      localStorage.setItem('recentOrders', JSON.stringify(updated));
      fetchRecentOrders(updated);
    } catch {}
  };

  const getStatusStepIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return date;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <Package className="h-7 w-7 text-[#7A1F3D]" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Track Your Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your order ID to check the delivery status
        </p>
      </div>

      {/* Search form */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleTrack} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Order ID</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. ORD-LATEST-001"
                  className="pl-9 h-10 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Email or Phone <span className="text-gray-400">(optional, for verification)</span>
              </label>
              <Input
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="your@email.com or phone number"
                className="h-10 text-sm"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white text-sm">
              {loading ? 'Tracking...' : 'Track Order'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600 mb-6">{error}</div>
      )}

      {/* Tracked order detail */}
      {trackedOrder && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Order: {trackedOrder.order_number}</h2>
            <Badge className={`${getOrderStatusColor(trackedOrder.order_status)} text-xs`}>
              {trackedOrder.order_status.charAt(0).toUpperCase() + trackedOrder.order_status.slice(1)}
            </Badge>
          </div>

          {/* Status timeline */}
          <Card>
            <CardContent className="pt-6">
              {trackedOrder.order_status === 'cancelled' ? (
                <div className="flex items-center gap-3 py-4 text-red-600">
                  <XCircle className="h-6 w-6" />
                  <div>
                    <p className="text-sm font-medium">Order Cancelled</p>
                    <p className="text-xs text-gray-500">This order has been cancelled.</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200">
                    <div className="h-full bg-green-600 transition-all duration-500" style={{ width: `${(getStatusStepIndex(trackedOrder.order_status) / (STATUS_STEPS.length - 1)) * 100}%` }} />
                  </div>
                  <div className="relative flex justify-between">
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = idx <= getStatusStepIndex(trackedOrder.order_status);
                      const isCurrent = idx === getStatusStepIndex(trackedOrder.order_status);
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-400'} ${isCurrent ? 'ring-2 ring-green-200' : ''}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className={`text-[10px] mt-1.5 text-center max-w-[60px] ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order info */}
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDate(trackedOrder.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{trackedOrder.payment_method} ({trackedOrder.payment_status})</span></div>
              {trackedOrder.customer_address && (
                <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="text-right max-w-[60%]">{trackedOrder.customer_address}{trackedOrder.customer_city ? `, ${trackedOrder.customer_city}` : ''}</span></div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Items</h3>
              <div className="space-y-3">
                {trackedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-12 h-12 rounded bg-gray-100 shrink-0 overflow-hidden">
                      <img src={item.image || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900 shrink-0">{formatCurrency(item.unitPrice * item.qty, currency)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(trackedOrder.subtotal, currency)}</span></div>
                {trackedOrder.discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-green-600">-{formatCurrency(trackedOrder.discount, currency)}</span></div>}
                {trackedOrder.delivery_fee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery</span><span>{formatCurrency(trackedOrder.delivery_fee, currency)}</span></div>}
                <Separator />
                <div className="flex justify-between text-sm font-semibold"><span>Total</span><span className="text-green-600">{formatCurrency(trackedOrder.total, currency)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Orders</h2>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order.order_number}
                href={`/order/${order.order_number}`}
                className="block"
              >
                <Card className="hover:border-green-200 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{order.order_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(order.created_at)} &middot; {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`${getOrderStatusColor(order.order_status)} text-[10px]`}>
                          {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.total, currency)}</span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {searched && !trackedOrder && !error && !loading && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No order found with that ID.</p>
        </div>
      )}
    </div>
  );
}
