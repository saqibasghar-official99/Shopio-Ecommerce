'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  BadgeDollarSign, Copy, Gift, LayoutDashboard, LifeBuoy, LogOut, Megaphone,
  Package, Settings, ShoppingBag, Store, Wallet, Sparkles, TrendingUp, Users,
  Clock, CheckCircle2, Share2, MessageCircle, Mail, Phone, Lock, ShieldCheck,
  ArrowUpRight, X, Menu, ChevronRight, Trophy, Star, CalendarDays,
  Truck, Percent, CircleDollarSign, Layers, BarChart3, HelpCircle, CreditCard,
  Smartphone, Landmark, Plus, Check, ArrowLeft, ArrowRight
} from 'lucide-react';

type SellerProfile = { id: string; name: string; email: string; phone: string; referral_code: string; status: string };
type DashboardData = {
  referred_orders: number;
  qualifying_sales: number;
  lifetime_eligible_sales: number;
  reward_threshold: number;
  reward_limit: number;
  reward_progress_sales: number;
  month_key: string;
  commissions: Record<string, number>;
  recent_orders: any[];
};
type ProductRecord = {
  _id: string;
  name: string;
  slug: string;
  short_description: string;
  price: number;
  compare_price: number;
  images: string[];
  stock: number;
  variants: Array<{ label: string; options: string[] }>;
};
type DeliveryZoneRecord = { _id?: string; id?: string; name: string; cities: string[]; fee: number };
type SellerOrderForm = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_city: string;
  delivery_zone: string;
  seller_selling_price: string;
  quantity: number;
};
type SellerPayoutMethod = {
  _id: string;
  provider: string;
  account_holder: string;
  identifier_kind: 'mobile' | 'bank_account';
  masked_identifier: string;
  status: 'pending_review' | 'reviewed' | 'needs_update';
  review_note: string;
  is_default: boolean;
  created_at: string;
};

const payoutProviders = [
  { id: 'nayapay', name: 'NayaPay', type: 'Mobile wallet', icon: Smartphone, color: '#125B52' },
  { id: 'jazzcash', name: 'JazzCash', type: 'Mobile wallet', icon: Smartphone, color: '#C41230' },
  { id: 'easypaisa', name: 'easypaisa', type: 'Mobile wallet', icon: Smartphone, color: '#54A52C' },
  { id: 'sadapay', name: 'SadaPay', type: 'Mobile wallet', icon: Smartphone, color: '#6039C5' },
  { id: 'meezan_bank', name: 'Meezan Bank', type: 'Bank transfer', icon: Landmark, color: '#16704A' },
  { id: 'hbl', name: 'HBL', type: 'Bank transfer', icon: Landmark, color: '#007A53' },
] as const;

const EMPTY_ORDER_FORM: SellerOrderForm = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  customer_address: '',
  customer_city: '',
  delivery_zone: '',
  seller_selling_price: '',
  quantity: 1,
};

const navigation = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'My Orders', icon: ShoppingBag },
  { key: 'earnings', label: 'My Earnings', icon: Wallet },
  { key: 'payouts', label: 'Payouts', icon: CreditCard },
  { key: 'rewards', label: 'Seller Rewards', icon: Gift },
  { key: 'marketing', label: 'Marketing Tools', icon: Megaphone },
  { key: 'profile', label: 'Profile & Settings', icon: Settings },
  { key: 'help', label: 'Help & Support', icon: LifeBuoy },
];

const BRAND = '#7A1F3D';
const TOAST_DURATION_MS = 2000;

type SellerToastMessage = { id: number; message: string; type: 'success' | 'error' };

function getSellerLevel(eligibleSales: number) {
  if (eligibleSales >= 25) return { name: 'Elite Seller', range: '25+' };
  if (eligibleSales >= 15) return { name: 'Super Seller', range: '15–24' };
  if (eligibleSales >= 7) return { name: 'Booster', range: '7–14' };
  return { name: 'Starter', range: '1–6' };
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<SellerPayoutMethod[]>([]);
  const [payoutSetupOpen, setPayoutSetupOpen] = useState(false);
  const [selectedPayoutProvider, setSelectedPayoutProvider] = useState('');
  const [payoutSetupStep, setPayoutSetupStep] = useState<1 | 2 | 3>(1);
  const [payoutForm, setPayoutForm] = useState({ account_holder: '', identifier: '', is_default: true });
  const [payoutOwnAccount, setPayoutOwnAccount] = useState(false);
  const [savingPayoutMethod, setSavingPayoutMethod] = useState(false);
  const [earnings, setEarnings] = useState<{ commissions: any[]; payouts: any[] }>({ commissions: [], payouts: [] });
  const [rewards, setRewards] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<SellerToastMessage | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', current_password: '', new_password: '' });
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [placingProduct, setPlacingProduct] = useState<ProductRecord | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZoneRecord[]>([]);
  const [orderForm, setOrderForm] = useState<SellerOrderForm>(EMPTY_ORDER_FORM);
  const [variantSelections, setVariantSelections] = useState<Record<string, string>>({});
  const [sellerRequestId, setSellerRequestId] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [toast]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const loadData = useCallback(async () => {
    const meResponse = await fetch('/api/seller/me');
    if (meResponse.status === 401) {
      router.replace('/seller/login');
      return;
    }
    const me = await meResponse.json();
    if (!meResponse.ok) throw new Error(me.message || 'Could not load seller profile.');
    const profile: SellerProfile = me.data;
    setSeller(profile);
    setProfileForm((previous) => ({ ...previous, name: profile.name, phone: profile.phone }));
    if (profile.status !== 'approved') return;

    const endpoints = ['/api/seller/dashboard', '/api/seller/catalog', '/api/seller/orders', '/api/seller/commissions', '/api/seller/rewards', '/api/seller/payout-methods'];
    const responses = await Promise.all(endpoints.map((endpoint) => fetch(endpoint)));
    const data = await Promise.all(responses.map((response) => response.json()));
    const failed = responses.findIndex((response) => !response.ok);
    if (failed >= 0) throw new Error(data[failed].message || 'Could not load seller data.');
    setDashboard(data[0].data);
    setProducts(data[1].data);
    setOrders(data[2].data);
    setEarnings(data[3].data);
    setRewards(data[4].data);
    setPayoutMethods(data[5].data);
  }, [router]);

  useEffect(() => {
    loadData().catch((error) => notify(error instanceof Error ? error.message : 'Could not load seller dashboard.', 'error')).finally(() => setLoading(false));
  }, [loadData, notify]);

  useEffect(() => {
    fetch('/api/delivery-zones', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load delivery zones.');
        setDeliveryZones(result.data || []);
      })
      .catch((error) => notify(error instanceof Error ? error.message : 'Could not load delivery zones.', 'error'));
  }, [notify]);

  const referralUrl = (product: ProductRecord) => `${window.location.origin}/products/${product.slug}?ref=${encodeURIComponent(seller?.referral_code || '')}`;
  const copyText = async (value: string, success: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notify(success);
    } catch {
      notify('Clipboard access is unavailable in this browser.', 'error');
    }
  };
  const shareOnWhatsApp = (text: string) => {
    try {
      const windowRef = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      if (!windowRef) {
        notify('The WhatsApp window was blocked by your browser.', 'error');
        return;
      }
      windowRef.opener = null;
      notify('WhatsApp share opened in a new tab.');
    } catch {
      notify('Could not open WhatsApp sharing.', 'error');
    }
  };
  const openCustomerOrderForm = (product: ProductRecord) => {
    setPlacingProduct(product);
    setOrderForm({ ...EMPTY_ORDER_FORM, seller_selling_price: String(product.price) });
    setVariantSelections(Object.fromEntries((product.variants || []).map((variant) => [variant.label, variant.options[0] || ''])));
    setSellerRequestId(crypto.randomUUID());
  };
  const submitCustomerOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!placingProduct || submittingOrder) return;
    setSubmittingOrder(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_order: true,
          seller_request_id: sellerRequestId,
          product_id: placingProduct._id,
          quantity: orderForm.quantity,
          seller_selling_price: Number(orderForm.seller_selling_price),
          variant_selections: variantSelections,
          customer_name: orderForm.customer_name,
          customer_phone: orderForm.customer_phone,
          customer_email: orderForm.customer_email,
          customer_address: orderForm.customer_address,
          customer_city: orderForm.customer_city,
          delivery_zone: orderForm.delivery_zone,
          payment_method: 'cod',
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.message || 'Could not place customer order.', 'error');
        return;
      }
      setPlacingProduct(null);
      notify(`Order ${result.data.order_number} placed successfully.`);
      try {
        await loadData();
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Order was placed, but dashboard data could not refresh.', 'error');
      }
    } catch {
      notify('Could not place customer order. Check your connection and retry.', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };
  const selectedOrderZone = deliveryZones.find((zone) => zone.name === orderForm.delivery_zone);
  const orderQuantity = Number(orderForm.quantity) || 0;
  const sellingPrice = Number(orderForm.seller_selling_price) || 0;
  const orderProfit = placingProduct && sellingPrice >= placingProduct.price
    ? (sellingPrice - placingProduct.price) * orderQuantity
    : 0;
  const availableBalance = useMemo(() => earnings.commissions.filter((entry) => entry.status === 'available').reduce((total, entry) => total + entry.amount, 0), [earnings]);

  const logout = async () => {
    try {
      const response = await fetch('/api/seller/login', { method: 'DELETE' });
      if (!response.ok) {
        notify('Could not log out. Please try again.', 'error');
        return;
      }
      router.replace('/seller/login');
    } catch {
      notify('Could not log out. Please check your connection and try again.', 'error');
    }
  };

  const claimGift = async (giftId: string) => {
    try {
      const response = await fetch('/api/seller/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gift_id: giftId }),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.message || 'Could not claim this gift.', 'error');
        return;
      }
      notify('Gift reserved. Veeo will update fulfilment progress here.');
    } catch {
      notify('Could not claim this gift. Please check your connection and retry.', 'error');
      return;
    }
    try {
      await loadData();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Gift was reserved, but the dashboard could not refresh.', 'error');
    }
  };

  const refreshPayoutMethods = async () => {
    const response = await fetch('/api/seller/payout-methods');
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Could not refresh payout methods.');
    setPayoutMethods(result.data);
  };

  const savePayoutMethod = async () => {
    if (!selectedPayoutProvider || savingPayoutMethod) return;
    setSavingPayoutMethod(true);
    try {
      const response = await fetch('/api/seller/payout-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedPayoutProvider, ...payoutForm }),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.message || 'Could not save payout method.', 'error');
        return;
      }
      await refreshPayoutMethods();
      setPayoutForm({ account_holder: '', identifier: '', is_default: true });
      setSelectedPayoutProvider('');
      setPayoutSetupStep(1);
      setPayoutOwnAccount(false);
      setPayoutSetupOpen(false);
      notify('Payout method saved securely. It is now pending review.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save payout method.', 'error');
    } finally {
      setSavingPayoutMethod(false);
    }
  };

  const setDefaultPayoutMethod = async (id: string) => {
    try {
      const response = await fetch('/api/seller/payout-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not update default payout method.');
      await refreshPayoutMethods();
      notify('Default payout method updated.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update payout method.', 'error');
    }
  };

  const removePayoutMethod = async (method: SellerPayoutMethod) => {
    if (!window.confirm(`Remove ${payoutProviders.find((provider) => provider.id === method.provider)?.name || 'this'} payout method?`)) return;
    try {
      const response = await fetch('/api/seller/payout-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: method._id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not remove payout method.');
      await refreshPayoutMethods();
      notify('Payout method removed.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not remove payout method.', 'error');
    }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const payload: Record<string, string> = { name: profileForm.name, phone: profileForm.phone };
    if (profileForm.new_password) {
      payload.current_password = profileForm.current_password;
      payload.new_password = profileForm.new_password;
    }
    try {
      const response = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.message || 'Could not update profile.', 'error');
        return;
      }
      setSeller(result.data);
      setProfileForm({ ...profileForm, current_password: '', new_password: '' });
      notify('Profile settings saved.');
    } catch {
      notify('Could not update profile. Please check your connection and retry.', 'error');
    }
  };

  if (loading) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#faf6f7] text-sm text-gray-600">
      <div className="h-11 w-11 animate-spin rounded-full border-4 border-[#7A1F3D]/15 border-t-[#7A1F3D]" />
      Loading seller account…
    </div>
  );
  if (!seller) return null;

  if (seller.status !== 'approved') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf6f7] px-4">
        <section className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#7A1F3D14' }}>
            <Store className="h-8 w-8" style={{ color: BRAND }} />
          </div>
          <h1 className="mt-4 text-xl font-bold capitalize text-gray-900">Seller application {seller.status}</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {seller.status === 'pending'
              ? 'Your account is waiting for admin approval. You will be able to access seller tools once it is approved.'
              : 'Your seller access is unavailable. Please contact Veeo support.'}
          </p>
          <button onClick={() => void logout()} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </section>
        <SellerToast toast={toast} onDismiss={() => setToast(null)} />
      </main>
    );
  }

  const currentNav = navigation.find((n) => n.key === tab);
  const sellerLevel = getSellerLevel(dashboard?.lifetime_eligible_sales || 0);
  const selectedPayoutProviderInfo = payoutProviders.find((provider) => provider.id === selectedPayoutProvider);
  const SelectedPayoutIcon = selectedPayoutProviderInfo?.icon;

  return (
    <div className="min-h-screen bg-[#faf6f7] text-[15px] text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 hover:bg-gray-100 md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <a
              href="/seller"
              className="flex items-center gap-2.5 text-base font-bold"
              style={{ color: BRAND }}
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                <img
                  src="/logoseller.png"
                  alt="Veeo Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <span className="hidden sm:inline">Veeo Seller</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 leading-tight">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Seller level
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="bg-clip-text text-xs font-bold tracking-tight text-transparent whitespace-nowrap"
                  style={{ backgroundImage: `linear-gradient(90deg, ${BRAND}, #b83a63)` }}
                >
                  {sellerLevel.name}
                </span>
                {/* 3 tier dots — fill based on level index if you have it */}
                <span className="flex items-center gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: i === 0 ? BRAND : '#E5E1E3' }}
                    />
                  ))}
                </span>
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-full border px-3 py-1.5 sm:flex" style={{ borderColor: '#7A1F3D22', backgroundColor: '#7A1F3D0A' }}>
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: BRAND }}>
                {seller.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: BRAND }}>{seller.name}</span>
            </div>
            <button onClick={() => void logout()} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        {/* Desktop Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-gray-200/80 bg-white p-4 md:block">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400"></p>
          <nav className="space-y-1">
            {navigation.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${active ? 'font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  style={active ? { backgroundColor: '#7A1F3D14', color: BRAND } : undefined}
                >
                  <Icon className="h-[18px] w-[18px]" style={active ? { color: BRAND } : undefined} />
                  {label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRAND }} />}
                </button>
              );
            })}
          </nav>
          <div className="mt-6 rounded-xl border p-4" style={{ borderColor: '#7A1F3D1F', background: `linear-gradient(135deg, #7A1F3D0F, #7A1F3D05)` }}>
            <div className="flex items-center gap-2" style={{ color: BRAND }}>
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Referral Code</span>
            </div>
            <button
              onClick={() => void copyText(seller.referral_code, 'Referral code copied.')}
              className="mt-2.5 flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm font-mono font-semibold hover:bg-white/60"
              style={{ borderColor: '#7A1F3D26', color: BRAND }}
            >
              <span className="truncate">{seller.referral_code}</span>
              <Copy className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-base font-bold" style={{ color: BRAND }}>Menu</span>
                <button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
              </div>
              <nav className="space-y-1">
                {navigation.map(({ key, label, icon: Icon }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setTab(key); setMobileNavOpen(false); }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${active ? 'font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                      style={active ? { backgroundColor: '#7A1F3D14', color: BRAND } : undefined}
                    >
                      <Icon className="h-[18px] w-[18px]" />{label}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-7 md:pb-9 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500" >
            <span>Seller</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium" style={{ color: BRAND }}>{currentNav?.label}</span>
          </div>

          {/* OVERVIEW */}
          {tab === 'overview' && dashboard && <section className="space-y-6">
            {/* Hero banner */}
            <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #9d2b52 55%, #5c152e 100%)` }}>
              <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
              <div className="absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-white/5" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" /> Seller Dashboard
                </div>
                <h1 className="mt-3 text-2xl font-bold sm:text-[28px]">Welcome back, {seller.name}!</h1>
                <p className="mt-1.5 text-sm text-white/80">Here's how your referral business is performing · {dashboard.month_key} (Asia/Karachi)</p>
                <div c  lassName="mt-5 flex flex-wrap gap-3">
                  <button onClick={() => setTab('products')} className="inline-flex items-center gap-2 rounded bg-white px-6 py-2 mt-4 text font-semibold shadow-sm transition hover:bg-white/90" style={{ color: BRAND }}>
                    <Package className="h-4 w-4" /> Browse Products
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Stat icon={Users} label="Total attributed orders" value={dashboard.referred_orders} />
              <Stat icon={TrendingUp} label="Qualifying monthly sales" value={dashboard.qualifying_sales} />
              <Stat icon={Clock} label="Pending seller earnings" value={`PKR ${dashboard.commissions.pending.toFixed(2)}`} />
              <Stat icon={Wallet} label="Available earnings" value={`PKR ${dashboard.commissions.available.toFixed(2)}`} />
              <Stat icon={CheckCircle2} label="Paid seller earnings" value={`PKR ${dashboard.commissions.paid.toFixed(2)}`} />
              <Stat icon={Gift} label="Progress to current reward" value={`${dashboard.reward_progress_sales} / ${dashboard.reward_threshold}`} />
            </div>

            {dashboard.reward_threshold > 0 && (() => {
  const total = dashboard.reward_threshold;
  const done = Math.min(dashboard.reward_progress_sales, total);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const remaining = total - done;
  const complete = done >= total;
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm sm:p-6"
      style={{ borderColor: '#7A1F3D26' }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${BRAND}33, transparent 70%)` }}
      />
      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* Radial */}
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#F3E7EC" strokeWidth="10" />
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke="url(#brandGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C - (C * done) / total}
              style={{ transition: 'stroke-dashoffset 0.9s ease' }}
            />
            <defs>
              <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={BRAND} />
                <stop offset="100%" stopColor="#b83a63" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Trophy className="h-5 w-5" style={{ color: BRAND }} />
            <span className="mt-1 text-2xl font-bold text-gray-900">{pct}%</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-400">complete</span>
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-900 sm:justify-start">
            Reward Journey
            {complete && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                style={{ background: `linear-gradient(135deg, ${BRAND}, #b83a63)` }}>
                <Sparkles className="h-3 w-3" /> Unlocked
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            <span className="font-semibold text-gray-800">{done}</span> of{' '}
            <span className="font-semibold text-gray-800">{total}</span> qualifying sales
            {!complete && <> · <span style={{ color: BRAND }} className="font-semibold">{remaining} more</span> to next gift</>}
          </p>

          {/* Mini milestone dots */}
          <div className="mt-3 flex items-center gap-1.5">
            {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all"
                style={{
                  backgroundColor: i < done ? BRAND : '#EDE6E9',
                  boxShadow: i < done ? `0 0 6px #7A1F3D66` : 'none',
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setTab('rewards')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}
          >
            <Gift className="h-3.5 w-3.5" /> View rewards <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
})()}

            {/* Recent orders */}
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: '#7A1F3D1F' }}>
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                  <ShoppingBag className="h-4.5 w-4.5" style={{ color: BRAND }} /> Recent attributed orders
                </h2>
                <button onClick={() => setTab('orders')} className="inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: BRAND }}>
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="px-5 pb-5">
                <OrderRows orders={dashboard.recent_orders} showCommission={false} />
              </div>
            </div>
          </section>}

          {/* PRODUCTS */}
          {tab === 'products' && <section>
            <SectionBanner
              icon={Package}
              title="Product catalogue"
              description="Share Veeo products using your tracked referral link."
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  referralUrl={referralUrl(product)}
                  onCopy={() => void copyText(referralUrl(product), 'Referral link copied.')}
                  onShare={() => shareOnWhatsApp(`${product.name} - ${referralUrl(product)}`)}
                  onMarketing={() => setSelectedProduct(product)}
                  onPlaceOrder={() => openCustomerOrderForm(product)}
                />
              ))}
              {!products.length && (
                <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                  <Package className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No active products are available right now.</p>
                </div>
              )}
            </div>
          </section>}

          {/* ORDERS */}
          {tab === 'orders' && <section>
            <SectionBanner
              icon={ShoppingBag}
              title="My orders"
              description="Track referred orders and customer orders you placed."
            />
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: '#7A1F3D1F' }}>
              <div className="p-5">
                <OrderRows orders={orders} showCommission />
              </div>
            </div>
          </section>}

          {/* PAYOUT METHODS */}
          {tab === 'payouts' && <section className="space-y-5">
            <SectionBanner
              icon={CreditCard}
              title="Payout methods"
              description="Choose where Veeo should send your available seller earnings. Account details are encrypted and only shared with authorized payout staff."
            />
            <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #9d2b52 55%, #5c152e 100%)` }}>
              <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full bg-white/10" />
              <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> Secure payout setup
                  </div>
                  <h2 className="mt-3 text-xl font-bold sm:text-2xl">Your earnings, your destination.</h2>
                  <p className="mt-1 max-w-xl text-sm text-white/80">Save a payout destination you control for the Veeo team to review before transfers.</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                  <span className="block text-xs text-white/70">Available earnings</span>
                  <span className="mt-1 block text-xl font-bold">PKR {availableBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border bg-white p-4 text-sm shadow-sm" style={{ borderColor: '#7A1F3D1F' }}>
              <Lock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} />
              <p className="text-xs leading-5 text-gray-600">
                Payout setup is securely saved for manual review; it does not sign in to or directly link with your bank or wallet. Veeo staff verify the destination before sending a payout.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {payoutMethods.map((method) => {
                const provider = payoutProviders.find((item) => item.id === method.provider);
                const ProviderIcon = provider?.icon || CreditCard;
                return (
                  <article key={method._id} className="relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: method.is_default ? '#7A1F3D66' : '#E5E7EB' }}>
                    <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full opacity-[0.07]" style={{ backgroundColor: provider?.color || BRAND }} />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${provider?.color || BRAND}12`, color: provider?.color || BRAND }}>
                          <ProviderIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{provider?.name || method.provider}</h3>
                          <p className="text-xs text-gray-500">{method.identifier_kind === 'mobile' ? 'Mobile wallet' : 'Bank transfer'}</p>
                        </div>
                      </div>
                      {method.is_default && <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ backgroundColor: '#7A1F3D12', color: BRAND }}>DEFAULT</span>}
                    </div>
                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <p className="text-sm font-medium text-gray-800">{method.account_holder}</p>
                      <p className="mt-1 font-mono text-sm tracking-wider text-gray-500">{method.masked_identifier}</p>
                      <p className={`mt-3 inline-flex items-center gap-1.5 text-xs ${method.status === 'reviewed' ? 'text-green-700' : method.status === 'needs_update' ? 'text-red-700' : 'text-amber-700'}`}>
                        {method.status === 'reviewed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {method.status === 'reviewed' ? 'Reviewed by Veeo' : method.status === 'needs_update' ? 'Update needed' : 'Saved · pending manual review'}
                      </p>
                      {method.status === 'needs_update' && method.review_note && <p className="mt-2 text-xs leading-5 text-red-700">{method.review_note}</p>}
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                      {!method.is_default && <button onClick={() => void setDefaultPayoutMethod(method._id)} className="rounded-lg border px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Make default</button>}
                      <button onClick={() => void removePayoutMethod(method)} className="ml-auto rounded-lg px-3 py-2 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-700">Remove</button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: '#7A1F3D1F' }}>
              {!payoutSetupOpen && payoutMethods.length > 0 ? (
                <button onClick={() => { setPayoutSetupOpen(true); setPayoutSetupStep(1); setSelectedPayoutProvider(''); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-sm font-semibold transition hover:bg-[#7A1F3D08]" style={{ borderColor: '#7A1F3D55', color: BRAND }}>
                  <Plus className="h-4 w-4" /> Add another payout method
                </button>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND }}>Guided setup</p>
                      <h2 className="mt-1 text-lg font-bold text-gray-900">{payoutSetupStep === 1 ? 'Choose your payout destination' : payoutSetupStep === 2 ? 'Enter account details' : 'Review and save securely'}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      {payoutMethods.length > 0 && <button onClick={() => { setPayoutSetupOpen(false); setSelectedPayoutProvider(''); setPayoutSetupStep(1); }} className="text-xs font-medium text-gray-500 hover:text-gray-800">Cancel</button>}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3].map((step) => (
                          <div key={step} className="flex items-center gap-2">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${payoutSetupStep >= step ? 'text-white' : 'bg-gray-100 text-gray-400'}`} style={payoutSetupStep >= step ? { backgroundColor: BRAND } : undefined}>
                              {payoutSetupStep > step ? <Check className="h-3.5 w-3.5" /> : step}
                            </span>
                            {step < 3 && <span className={`h-px w-5 ${payoutSetupStep > step ? 'bg-[#7A1F3D]' : 'bg-gray-200'}`} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {payoutSetupStep === 1 && <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {payoutProviders.map(({ id, name, type, icon: ProviderIcon, color }) => (
                      <button key={id} onClick={() => { setSelectedPayoutProvider(id); setPayoutSetupStep(2); }} className="group flex items-center gap-3 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: '#E5E7EB' }}>
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105" style={{ backgroundColor: `${color}12`, color }}><ProviderIcon className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1"><span className="block font-semibold text-gray-900">{name}</span><span className="mt-0.5 block text-xs text-gray-500">{type}</span></span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>}

                  {payoutSetupStep === 2 && selectedPayoutProviderInfo && <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); setPayoutSetupStep(3); }}>
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: `${selectedPayoutProviderInfo.color}0D` }}>
                      {SelectedPayoutIcon && <SelectedPayoutIcon className="h-5 w-5" style={{ color: selectedPayoutProviderInfo.color }} />}
                      <div><p className="text-sm font-semibold text-gray-900">{selectedPayoutProviderInfo.name}</p><p className="text-xs text-gray-500">Secure payout profile</p></div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Account holder name
                        <input required minLength={2} maxLength={120} autoComplete="name" value={payoutForm.account_holder} onChange={(event) => setPayoutForm({ ...payoutForm, account_holder: event.target.value })} placeholder="As registered with your provider" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none transition focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10" />
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        {selectedPayoutProviderInfo.type === 'Mobile wallet' ? 'Registered mobile number' : 'IBAN or bank account number'}
                        <input required type={selectedPayoutProviderInfo.type === 'Mobile wallet' ? 'tel' : 'text'} autoComplete={selectedPayoutProviderInfo.type === 'Mobile wallet' ? 'tel' : 'off'} value={payoutForm.identifier} onChange={(event) => setPayoutForm({ ...payoutForm, identifier: event.target.value })} placeholder={selectedPayoutProviderInfo.type === 'Mobile wallet' ? '03XX XXXXXXX' : 'PKXX XXXX XXXX XXXX XXXX XXXX'} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none transition focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10" />
                      </label>
                    </div>
                    <label className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-xs leading-5 text-gray-600">
                      <input type="checkbox" checked={payoutForm.is_default} onChange={(event) => setPayoutForm({ ...payoutForm, is_default: event.target.checked })} className="mt-1 accent-[#7A1F3D]" />
                      Use this as my default payout destination
                    </label>
                    <div className="flex justify-between gap-3 pt-1">
                      <button type="button" onClick={() => setPayoutSetupStep(1)} className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"><ArrowLeft className="h-4 w-4" /> Back</button>
                      <button type="submit" className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}>Review details <ArrowRight className="h-4 w-4" /></button>
                    </div>
                  </form>}

                  {payoutSetupStep === 3 && selectedPayoutProviderInfo && <div className="mt-5">
                    <div className="rounded-2xl border p-5" style={{ borderColor: '#7A1F3D26', backgroundColor: '#7A1F3D05' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm" style={{ color: selectedPayoutProviderInfo.color }}>{SelectedPayoutIcon && <SelectedPayoutIcon className="h-6 w-6" />}</div>
                        <div><p className="font-semibold text-gray-900">{selectedPayoutProviderInfo.name}</p><p className="text-xs text-gray-500">{payoutForm.is_default ? 'Default payout destination' : 'Additional payout destination'}</p></div>
                      </div>
                      <div className="mt-5 grid gap-4 border-t border-[#7A1F3D1A] pt-4 sm:grid-cols-2">
                        <div><p className="text-xs text-gray-500">Account holder</p><p className="mt-1 text-sm font-medium text-gray-800">{payoutForm.account_holder}</p></div>
                        <div><p className="text-xs text-gray-500">{selectedPayoutProviderInfo.type === 'Mobile wallet' ? 'Mobile wallet' : 'IBAN / account number'}</p><p className="mt-1 font-mono text-sm text-gray-800">•••• {payoutForm.identifier.replace(/[\s-]/g, '').slice(-4)}</p></div>
                      </div>
                    </div>
                    <label className="mt-4 flex items-start gap-2.5 text-xs leading-5 text-gray-600">
                      <input type="checkbox" checked={payoutOwnAccount} onChange={(event) => setPayoutOwnAccount(event.target.checked)} className="mt-1 accent-[#7A1F3D]" />
                      I confirm that this payout account belongs to me and the details are correct.
                    </label>
                    <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-gray-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} /> Account details are encrypted when stored. This setup does not sign in to or directly verify your provider account; payout staff will review it before processing transfers.</p>
                    <div className="mt-5 flex justify-between gap-3">
                      <button onClick={() => setPayoutSetupStep(2)} className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"><ArrowLeft className="h-4 w-4" /> Edit details</button>
                      <button onClick={() => void savePayoutMethod()} disabled={!payoutOwnAccount || savingPayoutMethod} className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-gray-300" style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}>
                        {savingPayoutMethod ? 'Saving securely…' : 'Save payout method'} {!savingPayoutMethod && <Check className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>}
                </>
              )}
            </div>
          </section>}

          {/* EARNINGS */}
          {tab === 'earnings' && <section>
            <SectionBanner
              icon={Wallet}
              title="My earnings"
              description="Referral commissions and customer-order profits remain pending until delivery and confirmed payment. Cancellations and refunds reverse or reduce unpaid earnings. Delivery charges are excluded from seller profit."
            />
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <Stat icon={Wallet} label="Available balance" value={`PKR ${availableBalance.toFixed(2)}`} />
              <Stat icon={Clock} label="Pending earnings" value={`PKR ${dashboard?.commissions.pending.toFixed(2) || '0.00'}`} />
              <Stat icon={CheckCircle2} label="Paid earnings" value={`PKR ${dashboard?.commissions.paid.toFixed(2) || '0.00'}`} />
            </div>
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: '#7A1F3D1F' }}>
              <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: '#7A1F3D14' }}>
                <BarChart3 className="h-4 w-4" style={{ color: BRAND }} />
                <h2 className="text-sm font-semibold text-gray-900">Earnings ledger</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Order</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Eligible sales</th>
                      <th className="px-5 py-3">Earnings</th>
                      <th className="px-5 py-3">Rate</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {earnings.commissions.map((entry) => (
                      <tr key={entry._id} className="hover:bg-gray-50/70">
                        <td className="px-5 py-3.5 font-medium">{entry.order_number}</td>
                        <td className="px-5 py-3.5 capitalize">{entry.earning_type === 'profit' ? 'Seller profit' : 'Referral commission'}</td>
                        <td className="px-5 py-3.5">PKR {entry.eligible_amount.toFixed(2)}</td>
                        <td className="px-5 py-3.5 font-semibold" style={{ color: BRAND }}>PKR {entry.amount.toFixed(2)}</td>
                        <td className="px-5 py-3.5">{entry.rate}%</td>
                        <td className="px-5 py-3.5"><StatusPill status={entry.status} /></td>
                        <td className="px-5 py-3.5 text-gray-500">{new Date(entry.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!earnings.commissions.length && <p className="py-10 text-center text-sm text-gray-500">No earnings recorded yet.</p>}
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: '#7A1F3D1F' }}>
              <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: '#7A1F3D14' }}>
                <BadgeDollarSign className="h-4 w-4" style={{ color: BRAND }} />
                <h2 className="text-sm font-semibold text-gray-900">Payout history</h2>
              </div>
              <div className="px-5 py-2">
                {earnings.payouts.length ? earnings.payouts.map((payout) => (
                  <div key={payout._id} className="flex items-center justify-between border-b border-gray-100 py-3.5 text-sm last:border-0">
                    <span className="font-semibold text-gray-900">PKR {payout.amount.toFixed(2)}</span>
                    <span className="flex items-center gap-2 text-gray-500">
                      <StatusPill status={payout.status} />
                      {payout.reference || 'Awaiting payout'}
                    </span>
                  </div>
                )) : <p className="py-6 text-center text-sm text-gray-500">No payouts recorded yet.</p>}
              </div>
            </div>
          </section>}

          {/* REWARDS */}
          {tab === 'rewards' && rewards && <section>
            <SectionBanner
              icon={Gift}
              title="Seller Rewards · Gift Boost"
              description="Earn one gift claim for each threshold of qualifying distinct sales."
            />
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <Stat icon={TrendingUp} label="Qualifying sales this month" value={rewards.qualifying_sales} />
              <Stat icon={Clock} label="Remaining sales required" value={rewards.remaining_sales} />
              <Stat icon={Gift} label="Available gift claims" value={`${rewards.available_claims} / ${rewards.monthly_limit}`} />
            </div>
            <div className="mb-6 flex items-start gap-3 rounded-2xl border p-5 text-sm leading-relaxed" style={{ borderColor: '#7A1F3D26', backgroundColor: '#7A1F3D08', color: '#5c152e' }}>
              <Star className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} />
              <div>
                <p className="mb-1 font-semibold" style={{ color: BRAND }}>
                  Gift Boost rules
                </p>
                <p className="text-xs leading-5 text-gray-600">
                  Earn 1 gift per {rewards.threshold} delivered and paid orders, up to {rewards.monthly_limit} gifts monthly. Cancelled, failed, and fully refunded orders don’t count; partial refunds count proportionally.
                </p>
              </div>
            </div>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900"><Gift className="h-4.5 w-4.5" style={{ color: BRAND }} /> Available gifts</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rewards.gifts.map((gift: any) => (
                <div key={gift._id} className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md" style={{ borderColor: '#7A1F3D1F' }}>
                  {gift.image_url && <Image src={gift.image_url} alt="" width={800} height={600} unoptimized className="h-44 w-full object-cover transition-transform group-hover:scale-105" />}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900">{gift.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{gift.description}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500"><Layers className="h-3.5 w-3.5" /> {gift.stock} in stock</div>
                    <button
                      onClick={() => void claimGift(gift._id)}
                      disabled={!rewards.available_claims}
                      className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-gray-300"
                      style={rewards.available_claims ? { background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` } : undefined}
                    >
                      Claim gift
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <h2 className="mb-3 mt-6 flex items-center gap-2 text-base font-semibold text-gray-900"><CalendarDays className="h-4.5 w-4.5" style={{ color: BRAND }} /> Reward history</h2>
            <div className="space-y-2">
              {rewards.history.map((claim: any) => (
                <div key={claim._id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm shadow-sm" style={{ borderColor: '#7A1F3D1F' }}>
                  <span className="flex items-center gap-2"><Gift className="h-4 w-4 text-gray-400" /> {claim.gift_id?.name || 'Seller gift'} · {claim.month_key}</span>
                  <StatusPill status={claim.status} />
                </div>
              ))}
              {!rewards.history.length && <p className="py-6 text-center text-sm text-gray-500">No reward claims yet.</p>}
            </div>
          </section>}

          {/* MARKETING */}
          {tab === 'marketing' && <section>
            <SectionBanner
              icon={Megaphone}
              title="Marketing tools"
              description="Copy a product link or ready-to-share promotional message. Attribution follows the first valid referral for 30 days."
            />
            <div className="mb-5 flex items-center gap-3 rounded-xl border p-4 text-sm" style={{ borderColor: '#7A1F3D26', backgroundColor: '#7A1F3D08' }}>
              <Sparkles className="h-5 w-5 shrink-0" style={{ color: BRAND }} />
              <div className="text-gray-700">
                Your referral code: <strong className="font-mono" style={{ color: BRAND }}>{seller.referral_code}</strong> · Referrals use first-touch attribution for 30 days.
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {products.slice(0, 20).map((product) => (
                <div key={product._id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md" style={{ borderColor: '#7A1F3D1F' }}>
                  <div className="flex min-w-0 items-center gap-3">
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt="" width={80} height={80} unoptimized className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100"><Package className="h-5 w-5 text-gray-400" /></div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">PKR {product.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => void copyText(referralUrl(product), 'Referral link copied.')} className="rounded-lg border border-gray-200 p-2.5 hover:bg-gray-50" aria-label="Copy link">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => shareOnWhatsApp(`${product.name} - ${referralUrl(product)}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                      style={{ backgroundColor: BRAND }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>}

          {/* PROFILE */}

          {tab === 'profile' && (
            <section className="space-y-4">
              <SectionBanner
                icon={Settings}
                title="Profile & Settings"
                description="Manage your personal details and keep your account secure."
              />

              {/* Profile Overview */}
              <div
                className="relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm"
                style={{ borderColor: '#7A1F3D1F' }}
              >
                <div
                  className="absolute right-0 top-0 h-24 w-24 rounded-bl-full opacity-10"
                  style={{ backgroundColor: BRAND }}
                />

                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-semibold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND}, #9d2b52)`,
                    }}
                  >
                    {(profileForm.name || seller.email || 'S')
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      Seller Account
                    </p>
                    <h2 className="mt-0.5 truncate text-base font-semibold text-gray-900">
                      {profileForm.name || 'Your Name'}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{seller.email}</span>
                    </p>
                  </div>

                  <div
                    className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Account Active
                  </div>
                </div>
              </div>

              <form onSubmit={saveProfile} className="space-y-4">
                {/* Personal Information */}
                <div
                  className="overflow-hidden rounded-xl border bg-white shadow-sm"
                  style={{ borderColor: '#7A1F3D1F' }}
                >
                  <div
                    className="flex items-center gap-2.5 border-b px-4 py-3"
                    style={{
                      borderColor: '#7A1F3D14',
                      backgroundColor: '#7A1F3D05',
                    }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: '#7A1F3D12', color: BRAND }}
                    >
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-800">
                        Personal Information
                      </h2>
                      <p className="text-xs text-gray-500">
                        Update your account details.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 p-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </span>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                          required
                          value={profileForm.name}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter your full name"
                          autoComplete="name"
                          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-gray-700">
                        Email Address
                      </span>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          disabled
                          value={seller.email}
                          className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-500"
                        />
                      </div>
                      <span className="mt-1 block text-[11px] text-gray-400">
                        Registered email cannot be changed here.
                      </span>
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-medium text-gray-700">
                        Phone Number <span className="text-red-500">*</span>
                      </span>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                          required
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Enter your phone number"
                          autoComplete="tel"
                          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10"
                        />
                      </div>
                      <span className="mt-1 block text-[11px] text-gray-400">
                        Use a reachable number for important account communications.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Security & Password */}
                <div
                  className="overflow-hidden rounded-xl border bg-white shadow-sm"
                  style={{ borderColor: '#7A1F3D1F' }}
                >
                  <div
                    className="flex items-center gap-2.5 border-b px-4 py-3"
                    style={{
                      borderColor: '#7A1F3D14',
                      backgroundColor: '#7A1F3D05',
                    }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: '#7A1F3D12', color: BRAND }}
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-sm font-semibold text-gray-800">
                        Security & Password
                      </h2>
                      <p className="text-xs text-gray-500">
                        Manage your account password.
                      </p>
                    </div>
                    <Lock className="h-4 w-4 text-gray-300" />
                  </div>

                  <div className="space-y-3.5 p-4">

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-gray-700">
                        Current Password
                      </span>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Enter your current password"
                          value={profileForm.current_password}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              current_password: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-gray-700">
                        New Password
                      </span>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                          type="password"
                          autoComplete="new-password"
                          minLength={10}
                          placeholder="At least 10 characters"
                          value={profileForm.new_password}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              new_password: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400">
                        Use a strong password that you do not use elsewhere.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Save Changes */}
                <div
                  className="flex flex-col gap-3 rounded-xl border bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: '#7A1F3D1F' }}
                >
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
                    Your account details are handled securely.
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#7A1F3D]/20 active:translate-y-0"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND}, #9d2b52)`,
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Save Changes
                  </button>
                </div>
              </form>
            </section>
          )}


          {/* HELP */}
          {tab === 'help' && <section>
            <SectionBanner
              icon={LifeBuoy}
              title="Help & support"
              description="Need help with commissions, referrals, gift claims, or your account?"
            />
            <div className="max-w-2xl overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: '#7A1F3D1F' }}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#7A1F3D14' }}>
                    <HelpCircle className="h-6 w-6" style={{ color: BRAND }} />
                  </div>
                  <div>
                    <p className="text-sm leading-relaxed text-gray-700">Contact Veeo through the customer support page and include your seller email and relevant order/claim reference.</p>
                    <a href="/contact" className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}>
                      <ArrowUpRight className="h-4 w-4" /> Open Help & Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>}
        </main>
      </div>

      {/* Marketing modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between px-6 py-4" style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)`, color: 'white' }}>
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold"><Megaphone className="h-4.5 w-4.5" /> Promote {selectedProduct.name}</h2>
                <p className="mt-0.5 text-xs text-white/75">Share your tracked product link</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <textarea
                readOnly
                value={`${selectedProduct.name} - Shop now at ${referralUrl(selectedProduct)}`}
                className="h-28 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => void copyText(referralUrl(selectedProduct), 'Referral link copied.')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
                  <Copy className="h-4 w-4" /> Copy link
                </button>
                <button onClick={() => void copyText(`${selectedProduct.name} - Shop now at ${referralUrl(selectedProduct)}`, 'Promotional text copied.')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
                  <Share2 className="h-4 w-4" /> Copy promo text
                </button>
                <button
                  onClick={() => shareOnWhatsApp(`${selectedProduct.name} - Shop now at ${referralUrl(selectedProduct)}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}
                >
                  <MessageCircle className="h-4 w-4" /> Share WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {placingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5" onClick={() => !submittingOrder && setPlacingProduct(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="seller-order-title"
            className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between px-5 py-4 text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}>
              <div>
                <h2 id="seller-order-title" className="text-base font-bold">Place order for customer</h2>
                <p className="mt-1 text-xs text-white/80">{placingProduct.name}</p>
              </div>
              <button type="button" onClick={() => setPlacingProduct(null)} disabled={submittingOrder} className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 disabled:opacity-50" aria-label="Close order form">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitCustomerOrder} className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {(placingProduct.variants || []).filter((variant) => variant.options.length > 0).map((variant) => (
                  <label key={variant.label} className="block text-xs font-medium text-gray-700">
                    {variant.label}<span className="text-red-600"> *</span>
                    <select
                      required
                      value={variantSelections[variant.label] || ''}
                      onChange={(event) => setVariantSelections((previous) => ({ ...previous, [variant.label]: event.target.value }))}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="" disabled>Select {variant.label}</option>
                      {variant.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ))}
                <label className="block text-xs font-medium text-gray-700">
                  Quantity<span className="text-red-600"> *</span>
                  <input
                    type="number"
                    min={1}
                    max={Math.min(50, placingProduct.stock)}
                    step={1}
                    required
                    value={orderForm.quantity}
                    onChange={(event) => setOrderForm((previous) => ({ ...previous, quantity: Number(event.target.value) }))}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-700">
                  Your Selling Price per Unit (PKR)<span className="text-red-600"> *</span>
                  <input
                    type="number"
                    min={placingProduct.price}
                    step="0.01"
                    required
                    value={orderForm.seller_selling_price}
                    onChange={(event) => setOrderForm((previous) => ({ ...previous, seller_selling_price: event.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                  <span className="mt-1 block font-normal text-gray-500">Veeo price: PKR {placingProduct.price.toFixed(2)} per unit. Selling below this is not allowed.</span>
                </label>
                <label className="block text-xs font-medium text-gray-700">
                  Payment method
                  <select disabled value="cod" className="mt-1.5 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                    <option value="cod">Cash on Delivery (COD)</option>
                  </select>
                </label>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                The order total will be shown as the COD amount on Veeo’s printable shipping label. Courier booking and COD remittance are not integrated in this app; Veeo must manually reconcile courier collections and confirm payment in Admin before seller profit becomes available.
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Customer and delivery details</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input required maxLength={120} value={orderForm.customer_name} onChange={(event) => setOrderForm((previous) => ({ ...previous, customer_name: event.target.value }))} placeholder="Customer name *" autoComplete="name" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                  <input required maxLength={30} type="tel" value={orderForm.customer_phone} onChange={(event) => setOrderForm((previous) => ({ ...previous, customer_phone: event.target.value }))} placeholder="Phone number *" autoComplete="tel" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                  <input maxLength={254} type="email" value={orderForm.customer_email} onChange={(event) => setOrderForm((previous) => ({ ...previous, customer_email: event.target.value }))} placeholder="Email (optional)" autoComplete="email" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:col-span-2" />
                  <textarea required maxLength={500} value={orderForm.customer_address} onChange={(event) => setOrderForm((previous) => ({ ...previous, customer_address: event.target.value }))} placeholder="Complete delivery address *" autoComplete="street-address" rows={2} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:col-span-2" />
                  <input required maxLength={100} value={orderForm.customer_city} onChange={(event) => setOrderForm((previous) => ({ ...previous, customer_city: event.target.value }))} placeholder="City *" autoComplete="address-level2" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                  <select required value={orderForm.delivery_zone} onChange={(event) => setOrderForm((previous) => ({ ...previous, delivery_zone: event.target.value }))} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm">
                    <option value="">Select delivery zone *</option>
                    {deliveryZones.map((zone) => <option key={zone._id || zone.id || zone.name} value={zone.name}>{zone.name} · PKR {zone.fee.toFixed(2)}</option>)}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900"><CircleDollarSign className="h-4 w-4" style={{ color: BRAND }} /> Order review</h3>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between gap-3"><span>Customer product subtotal ({orderQuantity} × PKR {sellingPrice.toFixed(2)})</span><span className="font-medium text-gray-900">PKR {(sellingPrice * orderQuantity).toFixed(2)}</span></div>
                  <div className="flex justify-between gap-3"><span>Veeo product-price subtotal</span><span>PKR {(placingProduct.price * orderQuantity).toFixed(2)}</span></div>
                  <div className="flex justify-between gap-3 font-semibold" style={{ color: BRAND }}><span>Your profit (before delivery)</span><span>PKR {orderProfit.toFixed(2)}</span></div>
                  <div className="flex justify-between gap-3"><span>Delivery fee</span><span>PKR {(selectedOrderZone?.fee || 0).toFixed(2)}</span></div>
                  <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900"><span>COD amount to collect</span><span>PKR {(sellingPrice * orderQuantity + (selectedOrderZone?.fee || 0)).toFixed(2)}</span></div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" disabled={submittingOrder} onClick={() => setPlacingProduct(null)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submittingOrder || placingProduct.stock < 1 || !deliveryZones.length} className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: BRAND }}>
                  {submittingOrder ? 'Placing order…' : 'Review and place order'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      <SellerToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

/* ---------- Reusable components ---------- */

function SellerToast({ toast, onDismiss }: { toast: SellerToastMessage | null; onDismiss: () => void }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm sm:right-6 sm:top-6">
      <div
        key={toast.id}
        role={toast.type === 'error' ? 'alert' : 'status'}
        aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
          toast.type === 'success'
            ? 'border-green-200 bg-white text-gray-800'
            : 'border-red-200 bg-white text-red-800'
        }`}
      >
        <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`} />
        <span className="min-w-0 flex-1">{toast.message}</span>
        <button
          onClick={onDismiss}
          className="pointer-events-auto -mr-1 -mt-1 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SectionBanner({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl p-5 text-white shadow-sm sm:p-6" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #9d2b52 60%, #5c152e 100%)` }}>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold sm:text-xl">{title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-white/80">{description}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="group rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md" style={{ borderColor: '#7A1F3D1F' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-2 truncate text-xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#7A1F3D14', color: BRAND }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; bd: string }> = {
    available: { bg: '#ecfdf5', fg: '#047857', bd: '#a7f3d0' },
    pending: { bg: '#fffbeb', fg: '#b45309', bd: '#fde68a' },
    paid: { bg: '#eff6ff', fg: '#1d4ed8', bd: '#bfdbfe' },
    cancelled: { bg: '#fef2f2', fg: '#b91c1c', bd: '#fecaca' },
    refunded: { bg: '#f3f4f6', fg: '#4b5563', bd: '#e5e7eb' },
    approved: { bg: '#ecfdf5', fg: '#047857', bd: '#a7f3d0' },
  };
  const s = map[status?.toLowerCase()] || { bg: '#f3f4f6', fg: '#4b5563', bd: '#e5e7eb' };
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: s.bg, color: s.fg, borderColor: s.bd }}>
      {status}
    </span>
  );
}

function ProductCard({ product, referralUrl, onCopy, onShare, onMarketing, onPlaceOrder }: { product: ProductRecord; referralUrl: string; onCopy: () => void; onShare: () => void; onMarketing: () => void; onPlaceOrder: () => void }) {
  return (
    <article className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-lg" style={{ borderColor: '#7A1F3D1F' }}>
      <div className="relative">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt="" width={800} height={600} unoptimized className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gray-100"><Package className="h-12 w-12 text-gray-300" /></div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow-sm" style={{ color: BRAND }}>
          <TrendingUp className="h-3 w-3" /> {product.stock} available
        </span>
      </div>
      <div className="p-4">
        <h2 className="line-clamp-1 text-sm font-semibold text-gray-900">{product.name}</h2>
        <p className="mt-1 line-clamp-2 min-h-[2.4rem] text-xs text-gray-500">{product.short_description}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">PKR {product.price.toLocaleString()}</span>
          {product.compare_price > product.price && (
            <span className="text-xs text-gray-400 line-through">PKR {product.compare_price.toLocaleString()}</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={onCopy} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-gray-50" style={{ borderColor: '#7A1F3D33', color: BRAND }}>
            <Copy className="h-3.5 w-3.5" /> Copy link
          </button>
          <button onClick={onShare} className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition hover:opacity-90" style={{ backgroundColor: BRAND }} aria-label="Share on WhatsApp">
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
        </div>
        <button onClick={onMarketing} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100">
          <Share2 className="h-3.5 w-3.5" /> Copy promotional text
        </button>
        <button onClick={onPlaceOrder} disabled={product.stock < 1} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300" style={{ backgroundColor: BRAND }}>
          <ShoppingBag className="h-3.5 w-3.5" /> Place for Customer
        </button>
        <span className="sr-only">{referralUrl}</span>
      </div>
    </article>
  );
}

function OrderRows({ orders, showCommission }: { orders: any[]; showCommission: boolean }) {
  if (!orders.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">No orders to display.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full min-w-[760px] text-left text-sm table-striped">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Items / customer</th>
            <th className="px-4 py-3">Eligible&nbsp;sales</th>
            <th className="px-4 py-3">Order&nbsp;status</th>
            <th className="px-4 py-3">Payment&nbsp;status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 ">
          {orders.map((order) => (
            <tr key={order.order_number} className="odd:bg-white even:bg-gray-50 hover:bg-orange-50/70 transition-colors">
              <td className="px-3 py-3 font-medium">{order.order_number}</td>
              <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div>{order.items.map((item: any, index: number) => (
                  <p key={`${item.name}-${index}`} className="text-xs text-gray-700">
                    {item.name} × {item.qty}
                    {item.variants?.length ? ` · ${item.variants.map((variant: any) => `${variant.label}: ${variant.value}`).join(', ')}` : ''}
                    {order.seller_order && item.seller_selling_price !== undefined ? ` · PKR ${item.seller_selling_price.toFixed(2)}/unit` : ''}
                  </p>
                ))}</div>
                {order.seller_order && order.customer && <p className="mt-1 text-xs text-gray-500"></p>}
              </td>
              <td className="px-4 py-3">
                PKR {order.eligible_sales.toLocaleString()}
                {order.seller_order && <p className="text-[11px] text-gray-500">COD total: PKR {Number(order.total || 0).toFixed(2)}</p>}
              </td>
              <td className="px-4 py-3 text-center"><StatusPill status={order.order_status} /></td>
              <td className="px-4 py-3 text-center"><span className="mt-1 text-[11px] capitalize text-gray-500">{order.payment_status || order.payment_method || ''}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}