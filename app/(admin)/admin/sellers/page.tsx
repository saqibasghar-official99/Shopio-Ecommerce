'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RefreshCw, Store, Gift, Coins, Users, PackageCheck } from 'lucide-react';

type SellerRecord = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  referral_code: string;
  status: string;
  referred_orders: number;
  claims: number;
  default_payout_method: { provider: string; last_four: string; status: string } | null;
  commissions: Array<{ status: string; amount: number; count: number }>;
};

type GiftRecord = {
  _id: string;
  name: string;
  description: string;
  image_url: string;
  stock: number;
  internal_cost: number;
  is_active: boolean;
};

export default function SellersAdminPage() {
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [settings, setSettings] = useState({ default_commission_rate: 0, monthly_sales_threshold: 3, monthly_gift_limit: 2 });
  const [productRates, setProductRates] = useState('[]');
  const [categoryRates, setCategoryRates] = useState('[]');
  const [statistics, setStatistics] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [giftForm, setGiftForm] = useState({ name: '', description: '', image_url: '', stock: 0, internal_cost: 0 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    setBusy(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'all') query.set('status', statusFilter);
      if (search.trim()) query.set('search', search.trim());
      const [sellerRes, programRes, giftRes, payoutRes, claimRes] = await Promise.all([
        fetch(`/api/admin/sellers?${query}`),
        fetch('/api/admin/seller-program'),
        fetch('/api/admin/seller-gifts'),
        fetch('/api/admin/seller-payouts'),
        fetch('/api/admin/seller-claims'),
      ]);
      const [sellerData, programData, giftData, payoutData, claimData] = await Promise.all([
        sellerRes.json(), programRes.json(), giftRes.json(), payoutRes.json(), claimRes.json(),
      ]);
      if (!sellerRes.ok || !programRes.ok || !giftRes.ok || !payoutRes.ok || !claimRes.ok) {
        throw new Error(sellerData.message || programData.message || giftData.message || payoutData.message || claimData.message || 'Failed to load seller management data.');
      }
      setSellers(sellerData.data || []);
      setSettings(programData.data.program);
      setProductRates(JSON.stringify(programData.data.program.product_rates || [], null, 2));
      setCategoryRates(JSON.stringify(programData.data.program.category_rates || [], null, 2));
      setStatistics(programData.data.statistics || {});
      setGifts(giftData.data || []);
      setPayouts(payoutData.data || []);
      setClaims(claimData.data || []);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load seller management data.');
    } finally {
      setBusy(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { void loadData(); }, [loadData]);

  const updateSellerStatus = async (seller: SellerRecord, status: string) => {
    const response = await fetch('/api/admin/sellers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: seller._id, status }),
    });
    const result = await response.json();
    if (!response.ok) return setMessage(result.message || 'Could not change seller status.');
    setMessage(`${seller.name} is now ${status}.`);
    void loadData();
  };

  const showSellerDetails = async (seller: SellerRecord) => {
    const response = await fetch(`/api/admin/sellers/${seller._id}`);
    const result = await response.json();
    if (!response.ok) return setMessage(result.message || 'Could not load seller details.');
    setDetail(result.data);
  };

  const reviewPayoutMethod = async (method: any, status: 'reviewed' | 'needs_update') => {
    const note = status === 'needs_update'
      ? window.prompt('What should the seller update?')
      : '';
    if (status === 'needs_update' && !note?.trim()) return;
    const response = await fetch(`/api/admin/sellers/${detail.seller._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method_id: method._id, status, note: note || '' }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message || 'Could not update payout method review.');
      return;
    }
    setMessage(status === 'reviewed' ? 'Payout destination marked reviewed.' : 'Seller update request saved.');
    await showSellerDetails(detail.seller);
    void loadData();
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    let product_rates: unknown;
    let category_rates: unknown;
    try {
      product_rates = JSON.parse(productRates);
      category_rates = JSON.parse(categoryRates);
      if (!Array.isArray(product_rates) || !Array.isArray(category_rates)) throw new Error('Rate overrides must be JSON arrays.');
    } catch (error) {
      return setMessage(error instanceof Error ? error.message : 'Commission overrides must be valid JSON arrays.');
    }
    const response = await fetch('/api/admin/seller-program', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, product_rates, category_rates }),
    });
    const result = await response.json();
    setMessage(response.ok ? 'Seller programme settings saved.' : result.message || 'Could not save settings.');
    if (response.ok) void loadData();
  };

  const addGift = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/admin/seller-gifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(giftForm),
    });
    const result = await response.json();
    if (!response.ok) return setMessage(result.message || 'Could not add gift.');
    setGiftForm({ name: '', description: '', image_url: '', stock: 0, internal_cost: 0 });
    setMessage('Seller-exclusive gift added.');
    void loadData();
  };

  const uploadGiftImage = async (file: File) => {
    const formData = new FormData();
    formData.set('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok) return setMessage(result.message || 'Could not upload gift image.');
    setGiftForm((current) => ({ ...current, image_url: result.url }));
    setMessage('Gift image uploaded.');
  };

  const editGift = async (gift: GiftRecord) => {
    const stockText = window.prompt(`Set stock for ${gift.name}`, String(gift.stock));
    if (stockText === null) return;
    const stock = Number(stockText);
    if (!Number.isInteger(stock) || stock < 0) return setMessage('Stock must be a non-negative whole number.');
    const response = await fetch(`/api/admin/seller-gifts/${gift._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    });
    const result = await response.json();
    setMessage(response.ok ? 'Gift stock updated.' : result.message || 'Could not update gift.');
    if (response.ok) void loadData();
  };

  const deactivateGift = async (gift: GiftRecord) => {
    if (!window.confirm(`Deactivate ${gift.name}?`)) return;
    const response = await fetch(`/api/admin/seller-gifts/${gift._id}`, { method: 'DELETE' });
    const result = await response.json();
    setMessage(response.ok ? `${gift.name} deactivated.` : result.message || 'Could not deactivate gift.');
    if (response.ok) void loadData();
  };

  const recordPayout = async (seller: SellerRecord) => {
    const balance = seller.commissions.filter((commission) => commission.status === 'available').reduce((total, commission) => total + commission.amount, 0);
    if (balance <= 0) return setMessage('This seller has no available balance.');
    if (seller.default_payout_method && seller.default_payout_method.status !== 'reviewed') {
      return setMessage('Review the seller payout destination in Details before recording a payout.');
    }
    const savedMethod = seller.default_payout_method
      ? `${seller.default_payout_method.provider.replace(/_/g, ' ')} · •••• ${seller.default_payout_method.last_four}`
      : 'bank transfer';
    const method = window.prompt('Payment method (review the seller payout details before transferring)', savedMethod);
    if (!method?.trim()) return;
    const reference = window.prompt('Confirmed payment reference');
    if (!reference?.trim()) return setMessage('A confirmed payment reference is required.');
    const confirmed = window.confirm(`Confirm that PKR ${balance.toFixed(2)} has already been paid to ${seller.name}?`);
    if (!confirmed) return;
    const response = await fetch('/api/admin/seller-payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seller_id: seller._id, method, reference, confirmed: true }),
    });
    const result = await response.json();
    setMessage(response.ok ? 'Payout recorded and available seller earnings marked paid.' : result.message || 'Could not record payout.');
    if (response.ok) void loadData();
  };

  const updateClaim = async (claim: any, status: string) => {
    const response = await fetch('/api/admin/seller-claims', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: claim._id, status }),
    });
    const result = await response.json();
    setMessage(response.ok ? 'Reward fulfilment status updated.' : result.message || 'Could not update reward claim.');
    if (response.ok) void loadData();
  };

  const stats = [
    { label: 'Approved sellers', value: statistics.active_sellers || 0, icon: Users },
    { label: 'Qualifying orders', value: statistics.qualifying_orders || 0, icon: PackageCheck },
    { label: 'Gift claims', value: statistics.gift_claims || 0, icon: Gift },
    { label: 'Outstanding seller earnings', value: `PKR ${(statistics.commissions || []).filter((entry: any) => ['pending', 'available'].includes(entry._id)).reduce((sum: number, entry: any) => sum + entry.amount, 0).toFixed(2)}`, icon: Coins },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Seller programme</h1>
          <p className="mt-1 text-sm text-gray-500">Applications, referral commission policy, seller-order earnings, gifts and payout records.</p>
        </div>
        <button onClick={() => void loadData()} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50" disabled={busy}>
          <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      {message && <div role="status" className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">{message}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm">
            <span className="rounded-md bg-green-50 p-2 text-green-700"><Icon className="h-4 w-4" /></span>
            <div><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{value}</p></div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold">Programme rules & commission rates</h2>
        <form onSubmit={saveSettings} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-gray-600">Default commission rate (%)
            <input type="number" min="0" max="100" step="0.01" value={settings.default_commission_rate} onChange={(e) => setSettings({ ...settings, default_commission_rate: Number(e.target.value) })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-gray-600">Qualifying delivered sales / month
            <input type="number" min="1" value={settings.monthly_sales_threshold} onChange={(e) => setSettings({ ...settings, monthly_sales_threshold: Number(e.target.value) })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-gray-600">Maximum gifts / month
            <input type="number" min="0" value={settings.monthly_gift_limit} onChange={(e) => setSettings({ ...settings, monthly_gift_limit: Number(e.target.value) })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </label>
          <div className="flex items-end"><button className="w-full rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800">Save rules</button></div>
          <label className="text-xs font-medium text-gray-600 sm:col-span-2">Product commission overrides (JSON array: product_id, rate)
            <textarea value={productRates} onChange={(e) => setProductRates(e.target.value)} className="mt-1 h-24 w-full rounded-md border px-3 py-2 font-mono text-xs" />
          </label>
          <label className="text-xs font-medium text-gray-600 sm:col-span-2">Category commission overrides (JSON array: category_id, rate)
            <textarea value={categoryRates} onChange={(e) => setCategoryRates(e.target.value)} className="mt-1 h-24 w-full rounded-md border px-3 py-2 font-mono text-xs" />
          </label>
        </form>
        <p className="mt-2 text-xs text-gray-500">Product overrides take precedence over category overrides, which take precedence over the default. Gift eligibility resets by calendar month in Asia/Karachi.</p>
      </section>

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
          <h2 className="text-base font-semibold">Seller applications & accounts</h2>
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or code" className="w-56 rounded-md border px-3 py-1.5 text-sm" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm">
              <option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Seller</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Orders / gifts</th>
                <th className="px-4 py-2 text-left">Earnings ledger</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sellers.map((seller) => (
                <tr key={seller._id}>
                  <td className="px-4 py-3"><p className="font-medium">{seller.name}</p><p className="text-xs text-gray-500">{seller.email} · {seller.phone}</p>{seller.default_payout_method && <p className={`mt-1 text-xs font-medium ${seller.default_payout_method.status === 'reviewed' ? 'text-green-700' : 'text-amber-700'}`}>Default payout: {seller.default_payout_method.provider.replace(/_/g, ' ')} ···· {seller.default_payout_method.last_four} · {seller.default_payout_method.status.replace('_', ' ')}</p>}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs capitalize">{seller.status}</span><p className="mt-1 text-xs text-gray-500">{seller.referral_code}</p></td>
                  <td className="px-4 py-3">{seller.referred_orders} attributed · {seller.claims} gifts</td>
                  <td className="px-4 py-3 text-xs">{seller.commissions.map((entry) => `${entry.status}: PKR ${entry.amount.toFixed(2)} (${entry.count})`).join(' · ') || 'No entries'}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">
                    {seller.status !== 'approved' && <button onClick={() => void updateSellerStatus(seller, 'approved')} className="rounded border px-2 py-1 text-xs text-green-700">Approve</button>}
                    {seller.status !== 'rejected' && <button onClick={() => void updateSellerStatus(seller, 'rejected')} className="rounded border px-2 py-1 text-xs text-red-700">Reject</button>}
                    {seller.status !== 'suspended' && seller.status === 'approved' && <button onClick={() => void updateSellerStatus(seller, 'suspended')} className="rounded border px-2 py-1 text-xs text-orange-700">Suspend</button>}
                    {seller.status === 'suspended' && <button onClick={() => void updateSellerStatus(seller, 'approved')} className="rounded border px-2 py-1 text-xs text-green-700">Reactivate</button>}
                    <button onClick={() => void showSellerDetails(seller)} className="rounded border px-2 py-1 text-xs">Details</button>
                    <button onClick={() => void recordPayout(seller)} className="rounded border px-2 py-1 text-xs">Pay available</button>
                  </div></td>
                </tr>
              ))}
              {!sellers.length && <tr><td colSpan={5} className="p-6 text-center text-sm text-gray-500">No sellers found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={() => setDetail(null)}>
        <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-base font-semibold">{detail.seller.name}</h2><p className="text-xs text-gray-500">{detail.seller.email} · {detail.seller.phone} · {detail.seller.referral_code}</p><p className="mt-1 text-xs text-gray-500">Status: {detail.seller.status} · qualifying orders this month: {detail.qualifying_sales} ({detail.month_key})</p></div>
            <button onClick={() => setDetail(null)} className="rounded border px-2 py-1 text-xs">Close</button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div><h3 className="mb-2 text-sm font-semibold">Attributed orders</h3><div className="max-h-64 overflow-auto rounded border"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-gray-50"><tr><th className="p-2">Order</th><th className="p-2">Amount</th><th className="p-2">Status</th></tr></thead><tbody className="divide-y">{detail.orders.map((order: any) => <tr key={order._id}><td className="p-2">{order.order_number}<p className="text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p></td><td className="p-2">PKR {Math.max(0, order.subtotal - (order.discount || 0) - (order.bank_transfer_discount || 0) - (order.refunded_amount || 0)).toFixed(2)}</td><td className="p-2 capitalize">{order.order_status} · {order.payment_status}</td></tr>)}</tbody></table></div></div>
            <div><h3 className="mb-2 text-sm font-semibold">Earnings history</h3><div className="max-h-64 overflow-auto rounded border"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-gray-50"><tr><th className="p-2">Order</th><th className="p-2">Type</th><th className="p-2">Amount / rate</th><th className="p-2">Status</th></tr></thead><tbody className="divide-y">{detail.commissions.map((entry: any) => <tr key={entry._id}><td className="p-2">{entry.order_number}</td><td className="p-2">{entry.earning_type === 'profit' ? 'Seller profit' : 'Referral commission'}</td><td className="p-2">PKR {entry.amount.toFixed(2)} · {entry.rate}%</td><td className="p-2 capitalize">{entry.status}</td></tr>)}</tbody></table></div></div>
            <div><h3 className="mb-2 text-sm font-semibold">Reward claims</h3><div className="space-y-1">{detail.reward_claims.map((claim: any) => <p key={claim._id} className="rounded border p-2 text-xs">{claim.gift_id?.name || 'Gift'} · {claim.month_key} · {claim.status}</p>)}{!detail.reward_claims.length && <p className="text-xs text-gray-500">No claims.</p>}</div></div>
            <div><h3 className="mb-2 text-sm font-semibold">Payout records</h3><div className="space-y-1">{detail.payouts.map((payout: any) => <p key={payout._id} className="rounded border p-2 text-xs">PKR {payout.amount.toFixed(2)} · {payout.status} · {payout.reference}</p>)}{!detail.payouts.length && <p className="text-xs text-gray-500">No payouts.</p>}</div></div>
            <div className="lg:col-span-2"><h3 className="mb-2 text-sm font-semibold">Saved payout destinations · authorized admin view</h3><div className="grid gap-2 sm:grid-cols-2">{detail.payout_methods.map((method: any) => <div key={method._id} className="rounded border p-3 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-semibold capitalize">{method.provider.replace('_', ' ')}</span><span className="text-amber-700">{method.status.replace('_', ' ')}{method.is_default ? ' · default' : ''}</span></div><p className="mt-2">{method.account_holder}</p><p className="mt-1 font-mono">{method.identifier}</p><p className="mt-1 text-gray-500">{method.identifier_kind === 'mobile' ? 'Mobile wallet' : 'Bank account'}</p>{method.review_note && <p className="mt-2 text-red-700">Note: {method.review_note}</p>}{method.status !== 'reviewed' && <div className="mt-3 flex gap-2"><button onClick={() => void reviewPayoutMethod(method, 'reviewed')} className="rounded border border-green-200 px-2 py-1 text-green-700">Mark reviewed</button><button onClick={() => void reviewPayoutMethod(method, 'needs_update')} className="rounded border border-red-200 px-2 py-1 text-red-700">Request update</button></div>}</div>)}{!detail.payout_methods.length && <p className="text-xs text-gray-500">No payout destinations saved.</p>}</div></div>
          </div>
        </section>
      </div>}

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Gift className="h-4 w-4 text-green-700" />Add seller-exclusive gift</h2>
          <form onSubmit={addGift} className="space-y-2">
            <input required value={giftForm.name} onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })} placeholder="Gift name" className="w-full rounded-md border px-3 py-2 text-sm" />
            <textarea value={giftForm.description} onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })} placeholder="Description" className="w-full rounded-md border px-3 py-2 text-sm" rows={2} />
            <label className="block text-xs text-gray-500">Upload image<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadGiftImage(file); }} className="mt-1 block w-full text-xs" /></label>
            <input value={giftForm.image_url} onChange={(e) => setGiftForm({ ...giftForm, image_url: e.target.value })} placeholder="Image URL" className="w-full rounded-md border px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <label className="flex-1 text-xs text-gray-500">Stock<input required type="number" min="0" value={giftForm.stock} onChange={(e) => setGiftForm({ ...giftForm, stock: Number(e.target.value) })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label>
              <label className="flex-1 text-xs text-gray-500">Internal cost<input type="number" min="0" step="0.01" value={giftForm.internal_cost} onChange={(e) => setGiftForm({ ...giftForm, internal_cost: Number(e.target.value) })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label>
            </div>
            <button className="rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white">Add gift</button>
          </form>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">Seller-only gift inventory</h2>
          <div className="space-y-2">
            {gifts.map((gift) => <div key={gift._id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{gift.name}</p><p className="text-xs text-gray-500">Stock {gift.stock} · PKR {gift.internal_cost.toFixed(2)} · {gift.is_active ? 'Active' : 'Inactive'}</p></div>
              <div className="flex shrink-0 gap-2"><button onClick={() => void editGift(gift)} className="rounded border px-2 py-1 text-xs">Stock</button>{gift.is_active && <button onClick={() => void deactivateGift(gift)} className="rounded border px-2 py-1 text-xs text-red-700">Deactivate</button>}</div>
            </div>)}
            {!gifts.length && <p className="text-sm text-gray-500">No seller gifts have been created.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Store className="h-4 w-4 text-green-700" />Payout history</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">Seller</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Method / reference</th><th className="px-3 py-2">Status / date</th></tr></thead>
            <tbody className="divide-y">{payouts.map((payout) => <tr key={payout._id}><td className="px-3 py-2">{payout.seller_id?.name || 'Seller'}</td><td className="px-3 py-2">PKR {payout.amount.toFixed(2)}</td><td className="px-3 py-2">{payout.method} · {payout.reference}</td><td className="px-3 py-2 capitalize">{payout.status} · {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString() : '—'}</td></tr>)}
              {!payouts.length && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No payouts recorded.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold">Gift claims & fulfilment</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">Seller</th><th className="px-3 py-2">Gift</th><th className="px-3 py-2">Month</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Update fulfilment</th></tr></thead>
            <tbody className="divide-y">{claims.map((claim) => <tr key={claim._id}>
              <td className="px-3 py-2">{claim.seller_id?.name || 'Seller'}<p className="text-xs text-gray-500">{claim.seller_id?.email}</p></td>
              <td className="px-3 py-2">{claim.gift_id?.name || 'Removed gift'}</td>
              <td className="px-3 py-2">{claim.month_key}</td>
              <td className="px-3 py-2 capitalize">{claim.status}</td>
              <td className="px-3 py-2"><select disabled={claim.status === 'fulfilled' || claim.status === 'cancelled'} value={claim.status} onChange={(event) => void updateClaim(claim, event.target.value)} className="rounded border px-2 py-1 text-xs">
                {['claimed', 'processing', 'shipped', 'fulfilled', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select></td>
            </tr>)}
            {!claims.length && <tr><td colSpan={5} className="p-4 text-center text-gray-500">No gift claims yet.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
