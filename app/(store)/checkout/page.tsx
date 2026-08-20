'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader as Loader2, ShoppingCart, CreditCard, Banknote, MessageCircle, Tag, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/lib/utils';
import { Coupon, DeliveryZone } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery', icon: Banknote, description: 'Pay when you receive your order' },
  // { value: 'bank', label: 'Bank Transfer', icon: CreditCard, description: 'Transfer to our bank account' },
  { value: 'whatsapp', label: 'WhatsApp Order', icon: MessageCircle, description: 'Complete order via WhatsApp' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items, subtotal, discount, deliveryFee, couponCode, deliveryZoneName, clearCart,
    setCouponCode, setDiscount, setDeliveryFee, setDeliveryZoneName,
  } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const currency = settings?.currency || '$';

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Coupon state
  const [couponInput, setCouponInput] = useState(couponCode);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  // Delivery zone state
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [zonesLoading, setZonesLoading] = useState(true);

  const [guestCustomerId, setGuestCustomerId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('guest_customer_id');

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('guest_customer_id', id);
    }

    setGuestCustomerId(id);
  }, []);

  // Fetch available visible coupons
  useEffect(() => {
    fetch('/api/coupons?visible=true')
      .then((r) => r.json())
      .then((data) => {
        const coupons: Coupon[] = (data.data || []).map((c: Coupon & { _id?: string }) => ({ ...c, id: c._id || c.id }));
        setAvailableCoupons(coupons);
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

  const handleApplyCoupon = async (code?: string) => {
    const codeToApply = code || couponInput.trim();
    if (!codeToApply) return;

    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToApply, subtotal }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCouponCode(codeToApply);
        setCouponInput(codeToApply);
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

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setDiscount(0);
    showToast('Coupon removed');
  };

  const total = subtotal - discount + deliveryFee;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatWhatsAppNumber = (phone: string) => {
    let number = phone.trim().replace(/\D/g, '');

    // Pakistan local format: 03001234567 -> 923001234567
    if (number.startsWith('0')) {
      number = '92' + number.substring(1);
    }

    // Already starts with Pakistan country code
    if (number.startsWith('92')) {
      return number;
    }

    return number;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (items.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    if (!guestCustomerId) {
      showToast('Please wait a moment and try again.', 'error');
      return;
    }

    if (paymentMethod === 'whatsapp') {
      const whatsappNumber = settings?.whatsapp_number || '';
      if (!whatsappNumber) {
        showToast('WhatsApp ordering not available', 'error');
        return;
      }
      const orderLines = items
        .map((item) => `- ${item.name}${item.variant ? ` (${item.variant})` : ''} x${item.qty} = ${formatCurrency(item.price * item.qty, currency)}`)
        .join('\n');

      // const message = encodeURIComponent(
      //   `New Order\n\n${orderLines}\n\nSubtotal: ${formatCurrency(subtotal, currency)}\n${discount > 0 ? `Discount: -${formatCurrency(discount, currency)}\n` : ''}Delivery: ${formatCurrency(deliveryFee, currency)}\nTotal: ${formatCurrency(total, currency)}\n\nCustomer: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\nAddress: ${form.address}, ${form.city}\n${notes ? `Notes: ${notes}` : ''}\nPayment: WhatsApp Order`
      // );
      // window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');


      const message = encodeURIComponent(
        `${settings?.whatsapp_message ? `_${settings.whatsapp_message}_\n\n` : ''}` +
        `*🛍️ NEW ORDER*\n\n` +
        `*Order Items:*\n${orderLines}\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `*Subtotal:* ${formatCurrency(subtotal, currency)}\n` +
        `${discount > 0 ? `*Discount:* -${formatCurrency(discount, currency)}\n` : ''}` +
        `*Delivery:* ${deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee, currency)}\n` +
        `*TOTAL: ${formatCurrency(total, currency)}*\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `*👤 Customer Details*\n` +
        `*Name:* ${form.name}\n` +
        `*Phone:* ${form.phone}\n` +
        `*Email:* ${form.email}\n` +
        `*Address:* ${form.address}, ${form.city}\n` +
        `${notes ? `*Notes:* _${notes}_\n` : ''}\n` +
        `*💳 Payment:* WhatsApp Order`
      );

      const formattedWhatsAppNumber = formatWhatsAppNumber(whatsappNumber);

      window.open(
        `https://wa.me/${formattedWhatsAppNumber}?text=${message}`,
        '_blank'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name.trim(),
          customer_phone: form.phone.trim(),
          customer_email: form.email.trim(),
          customer_address: form.address.trim(),
          customer_city: form.city.trim(),
          is_guest: true,
          guest_customer_id: guestCustomerId,
          items: items.map((item) => ({
            productId: item.productId, name: item.name, image: item.image, qty: item.qty,
            unitPrice: item.price, variant: item.variant || undefined,
          })),
          subtotal, discount, delivery_fee: deliveryFee, total,
          payment_method: paymentMethod,
          coupon_code: couponCode || undefined,
          delivery_zone: deliveryZoneName || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.data?.order_number) {
        try {
          const saved = localStorage.getItem('recentOrders');
          const existing: string[] = saved ? JSON.parse(saved) : [];
          const updated = [data.data.order_number, ...existing].slice(0, 10);
          localStorage.setItem('recentOrders', JSON.stringify(updated));
        } catch { }
        clearCart();
        showToast('Order placed successfully!');
        router.push(`/order/${data.data.order_number}`);
      } else {
        showToast(data.message || 'Failed to place order', 'error');
      }
    } catch {
      showToast('Failed to place order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-900 mt-6">Nothing to checkout</h1>
        <p className="text-sm text-gray-500 mt-2">Add some items to your cart first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Checkout form */}
          <div className="flex-1 space-y-6">
            {/* Customer information */}
            <div className="border rounded-lg p-5 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Delivery Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Full Name *</label>
                  <Input value={form.name} onChange={(e) => handleFieldChange('name', e.target.value)} placeholder="John Doe" className={errors.name ? 'border-red-500' : ''} />
                  {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Phone *</label>
                  <Input value={form.phone} onChange={(e) => handleFieldChange('phone', e.target.value)} placeholder="+1 234 567 890" className={errors.phone ? 'border-red-500' : ''} />
                  {errors.phone && <p className="text-xs text-red-500 mt-0.5">{errors.phone}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">Email *</label>
                  <Input type="email" value={form.email} onChange={(e) => handleFieldChange('email', e.target.value)} placeholder="john@example.com" className={errors.email ? 'border-red-500' : ''} />
                  {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">Address *</label>
                  <Input value={form.address} onChange={(e) => handleFieldChange('address', e.target.value)} placeholder="123 Main St, Apt 4" className={errors.address ? 'border-red-500' : ''} />
                  {errors.address && <p className="text-xs text-red-500 mt-0.5">{errors.address}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">City *</label>
                  <Input value={form.city} onChange={(e) => handleFieldChange('city', e.target.value)} placeholder="City name" className={errors.city ? 'border-red-500' : ''} />
                  {errors.city && <p className="text-xs text-red-500 mt-0.5">{errors.city}</p>}
                </div>
              </div>

              {/* Delivery Zone - optional */}
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Delivery Zone <span className="text-gray-400">(optional)</span>
                </label>
                <Select value={selectedZone} onValueChange={handleZoneChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select delivery zone (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs text-gray-400">No delivery zone</SelectItem>
                    {deliveryZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id} className="text-xs">
                        {zone.name} - {formatCurrency(zone.fee, currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Order notes */}
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-700 block mb-1">Order Notes (optional)</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." />
              </div>
            </div>

            {/* Coupon section */}
            <div className="border rounded-lg p-5 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Coupon Code</h2>

              {couponCode && discount > 0 ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs font-medium text-green-600">{couponCode}</span>
                    <span className="text-xs text-green-600">(-{formatCurrency(discount, currency)})</span>
                  </div>
                  {/* <button onClick={handleRemoveCoupon} className="text-xs text-gray-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button> */}
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="h-9 text-sm"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                    />
                    {/* <Button size="sm" className="h-9 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApplyCoupon()} disabled={couponLoading}>
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </Button> */}
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 text-xs bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white"
                      onClick={() => handleApplyCoupon()}
                      disabled={couponLoading}
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </Button>

                  </div>

                  {/* Available coupons */}
                  {availableCoupons.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Available coupons:</p>
                      <div className="space-y-1.5">
                        {availableCoupons.map((coupon) => (
                          <button
                            key={coupon.id}
                            type="button"
                            onClick={() => handleApplyCoupon(coupon.code)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="h-3 w-3 text-green-600" />
                              <span className="text-xs font-mono font-medium text-gray-900">{coupon.code}</span>
                            </div>
                            <span className="text-xs text-green-600 font-medium">
                              {coupon.type === 'percent' ? `${coupon.value}% off` : `${formatCurrency(coupon.value, currency)} off`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="border rounded-lg p-5 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.value}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${paymentMethod === method.value ? 'border-[#7A1F3D]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <input type="radio" name="paymentMethod" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} className="text-[#7A1F3D] focus:ring-[#7A1F3D]" />
                      <Icon className={`h-4 w-4 ${paymentMethod === method.value ? 'text-[#7A1F3D]' : 'text-gray-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{method.label}</p>
                        <p className="text-xs text-gray-500">{method.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:w-80 shrink-0">
            <div className="border rounded-lg p-5 bg-white sticky top-20">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variant}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 bg-gray-100 rounded overflow-hidden">
                      <img src={item.image || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.variant ? `${item.variant} / ` : ''}Qty: {item.qty}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0">{formatCurrency(item.price * item.qty, currency)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

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
                  <span className="font-medium">{deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee, currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span className="text-black">{formatCurrency(total, currency)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 mt-4 bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Placing Order...</>
                ) : paymentMethod === 'whatsapp' ? (
                  <><MessageCircle className="h-4 w-4 mr-2" />Order via WhatsApp</>
                ) : (
                  'Place Order'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
