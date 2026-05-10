'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Ticket, Eye, EyeOff } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatCurrency, cn } from '@/lib/utils';
import type { Coupon } from '@/lib/types';

interface CouponForm {
  code: string;
  type: 'percent' | 'flat';
  value: string;
  min_order: string;
  max_uses: string;
  expires_at: string;
  is_active: boolean;
  is_visible: boolean;
}

const emptyForm: CouponForm = {
  code: '',
  type: 'percent',
  value: '',
  min_order: '0',
  max_uses: '0',
  expires_at: '',
  is_active: true,
  is_visible: true,
};

function mapCoupon(raw: Record<string, unknown>): Coupon {
  return {
    id: (raw._id as string) || (raw.id as string),
    code: raw.code as string,
    type: (raw.type as 'percent' | 'flat') || 'percent',
    value: raw.value as number,
    min_order: (raw.min_order as number) || 0,
    max_uses: (raw.max_uses as number) || 0,
    used_count: (raw.used_count as number) || 0,
    expires_at: (raw.expires_at as string) || null,
    is_active: raw.is_active as boolean,
    is_visible: raw.is_visible !== undefined ? (raw.is_visible as boolean) : true,
    created_at: (raw.created_at as string) || '',
  };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      const res = await fetch(`/api/coupons?${params}`);
      if (res.ok) {
        const json = await res.json();
        const rawList: Record<string, unknown>[] = Array.isArray(json.data) ? json.data : [];
        setCoupons(rawList.map(mapCoupon));
        setTotal(json.pagination?.total || json.total || rawList.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      min_order: coupon.min_order?.toString() || '0',
      max_uses: coupon.max_uses?.toString() || '0',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_active: coupon.is_active,
      is_visible: coupon.is_visible,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        min_order: parseFloat(form.min_order) || 0,
        max_uses: parseInt(form.max_uses) || 0,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        is_active: form.is_active,
        is_visible: form.is_visible,
      };

      const url = editingId ? `/api/coupons/${editingId}` : '/api/coupons';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchCoupons();
      }
    } catch (err) {
      console.error('Failed to save coupon', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: !coupon.is_visible }),
      });
      if (res.ok) fetchCoupons();
    } catch (err) {
      console.error('Failed to toggle visibility', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCoupons();
    } catch (err) {
      console.error('Failed to delete coupon', err);
    } finally {
      setDeletingId(null);
    }
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expires_at) return false;
    return new Date(coupon.expires_at) < new Date();
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-medium text-gray-900">{row.code as string}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row: Record<string, unknown>) => (
        <Badge variant="outline" className="text-xs capitalize">{row.type as string}</Badge>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      render: (row: Record<string, unknown>) => {
        const type = row.type as string;
        const value = row.value as number;
        return type === 'percent' ? `${value}%` : formatCurrency(value);
      },
    },
    {
      key: 'min_order',
      label: 'Min Order',
      render: (row: Record<string, unknown>) => formatCurrency(row.min_order as number),
    },
    {
      key: 'max_uses',
      label: 'Max Uses',
      render: (row: Record<string, unknown>) => (row.max_uses as number) === 0 ? 'Unlimited' : (row.max_uses as number).toString(),
    },
    {
      key: 'used_count',
      label: 'Used',
      render: (row: Record<string, unknown>) => <span className="font-medium">{row.used_count as number}</span>,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row: Record<string, unknown>) => {
        const coupon = mapCoupon(row);
        const expired = isExpired(coupon);
        return (
          <Badge className={cn('text-xs', expired ? 'bg-gray-100 text-gray-500' : coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
            {expired ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      key: 'is_visible',
      label: 'Visible',
      render: (row: Record<string, unknown>) => {
        const coupon = mapCoupon(row);
        return (
          <button
            onClick={() => handleToggleVisibility(coupon)}
            className={cn(
              'rounded p-1 transition-colors',
              coupon.is_visible
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-300 hover:bg-gray-50'
            )}
            title={coupon.is_visible ? 'Visible on checkout - click to hide' : 'Hidden on checkout - click to show'}
          >
            {coupon.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (row: Record<string, unknown>) => {
        const coupon = mapCoupon(row);
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => openEditDialog(coupon)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => handleDelete(coupon.id)} disabled={deletingId === coupon.id} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Coupons</h1>
        <Button onClick={openAddDialog} className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Coupon
        </Button>
      </div>

      <DataTable columns={columns} data={coupons as unknown as Record<string, unknown>[]} loading={loading} />
      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingId ? 'Edit Coupon' : 'Add Coupon'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Code</Label>
                <Input value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} className="h-8 text-xs font-mono" placeholder="SAVE10" />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Type</Label>
                <Select value={form.type} onValueChange={(val: 'percent' | 'flat') => setForm((prev) => ({ ...prev, type: val }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent" className="text-xs">Percentage</SelectItem>
                    <SelectItem value="flat" className="text-xs">Flat Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Value</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))} className="h-8 text-xs" placeholder="0" step="0.01" />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Min Order</Label>
                <Input type="number" value={form.min_order} onChange={(e) => setForm((prev) => ({ ...prev, min_order: e.target.value }))} className="h-8 text-xs" placeholder="0" step="0.01" />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Max Uses</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm((prev) => ({ ...prev, max_uses: e.target.value }))} className="h-8 text-xs" placeholder="0 = unlimited" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Expiry Date</Label>
                <Input type="date" value={form.expires_at} onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="flex flex-col justify-end gap-2 pb-0.5">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(val) => setForm((prev) => ({ ...prev, is_active: val }))} />
                  <Label className="text-sm text-gray-700">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_visible} onCheckedChange={(val) => setForm((prev) => ({ ...prev, is_visible: val }))} />
                  <Label className="text-sm text-gray-700">Visible on Checkout</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-8 text-xs">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
