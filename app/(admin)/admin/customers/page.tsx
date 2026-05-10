'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Plus } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, cn, PAYMENT_METHODS } from '@/lib/utils';
import type { Customer, Order, Transaction } from '@/lib/types';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');

  // Detail dialog
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/customers?${params}`);
      if (res.ok) {
        const result = await res.json();
        const customersData = result.success ? (result.data || []) : (Array.isArray(result) ? result : result.customers || []);
        const mapped = customersData.map((c: Record<string, unknown>) => ({ ...c, id: c._id || c.id }));
        setCustomers(mapped);
        setTotal(result.pagination?.total || result.total || mapped.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailLoading(true);
    try {
      // Fetch orders by searching with customer email or phone
      const searchParam = customer.email || customer.phone || customer.name;
      const ordersRes = await fetch(`/api/orders?search=${encodeURIComponent(searchParam)}&limit=50`);

      if (ordersRes.ok) {
        const ordResult = await ordersRes.json();
        const ordData = ordResult.success ? (ordResult.data || []) : (Array.isArray(ordResult) ? ordResult : ordResult.orders || []);
        const mappedOrders = ordData.map((o: Record<string, unknown>) => ({ ...o, id: o._id || o.id }));
        setCustomerOrders(mappedOrders);
      }

      // Transactions endpoint not available in current API
      setCustomerTransactions([]);
    } catch (err) {
      console.error('Failed to fetch customer details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    setSavingPayment(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_due: Math.max(0, selectedCustomer.total_due - parseFloat(paymentAmount)),
        }),
      });

      if (res.ok) {
        setPaymentDialogOpen(false);
        setPaymentAmount('');
        setPaymentNotes('');
        openDetail(selectedCustomer);
        fetchCustomers();
      }
    } catch (err) {
      console.error('Failed to add payment', err);
    } finally {
      setSavingPayment(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row: Record<string, unknown>) => (
        <button
          onClick={() => openDetail(row as unknown as Customer)}
          className="font-medium text-green-600 hover:text-green-700 text-left"
        >
          {row.name as string}
        </button>
      ),
    },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    {
      key: 'total_orders',
      label: 'Orders',
      render: (row: Record<string, unknown>) => (
        <span className="font-medium">{row.total_orders as number}</span>
      ),
    },
    {
      key: 'total_spent',
      label: 'Total Spent',
      render: (row: Record<string, unknown>) => formatCurrency(row.total_spent as number),
    },
    {
      key: 'total_due',
      label: 'Due Balance',
      render: (row: Record<string, unknown>) => {
        const due = row.total_due as number;
        return (
          <span className={cn('font-medium', due > 0 ? 'text-red-600' : 'text-green-600')}>
            {formatCurrency(due)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (row: Record<string, unknown>) => (
        <button
          onClick={() => openDetail(row as unknown as Customer)}
          className="text-gray-400 hover:text-gray-600"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Customers</h1>

      {/* Search */}
      <Card>
        <CardContent className="flex items-end gap-3 p-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Name, phone, or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-8 w-64 pl-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        columns={columns}
        data={customers as unknown as Record<string, unknown>[]}
        loading={loading}
      />
      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            </div>
          ) : selectedCustomer ? (
            <div className="space-y-4 text-xs">
              {/* Contact Info */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-gray-500">Phone</span>
                  <p className="font-medium text-gray-900">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email</span>
                  <p className="font-medium text-gray-900">{selectedCustomer.email || '--'}</p>
                </div>
                <div>
                  <span className="text-gray-500">City</span>
                  <p className="font-medium text-gray-900">{selectedCustomer.city || '--'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded border p-3">
                  <span className="text-gray-500">Total Orders</span>
                  <p className="text-lg font-semibold text-gray-900">{selectedCustomer.total_orders}</p>
                </div>
                <div className="rounded border p-3">
                  <span className="text-gray-500">Total Spent</span>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedCustomer.total_spent)}</p>
                </div>
                <div className="rounded border p-3">
                  <span className="text-gray-500">Due Balance</span>
                  <p className={cn('text-lg font-semibold', selectedCustomer.total_due > 0 ? 'text-red-600' : 'text-green-600')}>
                    {formatCurrency(selectedCustomer.total_due)}
                  </p>
                </div>
              </div>

              {selectedCustomer.total_due > 0 && (
                <Button
                  onClick={() => setPaymentDialogOpen(true)}
                  className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Payment / Adjustment
                </Button>
              )}

              <Separator />

              {/* Order History */}
              <div>
                <h4 className="mb-2 font-medium text-gray-900">Order History</h4>
                {customerOrders.length === 0 ? (
                  <p className="text-gray-400 py-4 text-center">No orders</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Order #</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Payment</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((order) => (
                          <tr key={order.id} className="border-b last:border-0">
                            <td className="px-3 py-2 text-xs">{order.order_number}</td>
                            <td className="px-3 py-2 text-xs">{formatCurrency(order.total)}</td>
                            <td className="px-3 py-2 text-xs">
                              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', {
                                'bg-yellow-100 text-yellow-700': order.order_status === 'pending',
                                'bg-green-100 text-green-700': order.order_status === 'delivered',
                                'bg-red-100 text-red-700': order.order_status === 'cancelled',
                              }[order.order_status] || 'bg-gray-100 text-gray-700')}>
                                {order.order_status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs">
                              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', {
                                'bg-yellow-100 text-yellow-700': order.payment_status === 'pending',
                                'bg-green-100 text-green-700': order.payment_status === 'paid',
                              }[order.payment_status] || 'bg-gray-100 text-gray-700')}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <Separator />

              {/* Ledger */}
              <div>
                <h4 className="mb-2 font-medium text-gray-900">Ledger</h4>
                {customerTransactions.length === 0 ? (
                  <p className="text-gray-400 py-4 text-center">No transactions</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Method</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerTransactions.map((txn) => (
                          <tr key={txn.id} className="border-b last:border-0">
                            <td className="px-3 py-2 text-xs">{new Date(txn.created_at).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-xs capitalize">{txn.type}</td>
                            <td className={cn('px-3 py-2 text-xs font-medium', txn.type === 'payment' ? 'text-green-600' : txn.type === 'refund' ? 'text-red-600' : 'text-gray-900')}>
                              {txn.type === 'payment' ? '-' : '+'}{formatCurrency(txn.amount)}
                            </td>
                            <td className="px-3 py-2 text-xs">{txn.method || '--'}</td>
                            <td className="px-3 py-2 text-xs text-gray-500">{txn.notes || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Add Payment / Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Amount</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="h-8 text-xs"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs capitalize">{m}</SelectItem>
                  ))}
                  <SelectItem value="cash" className="text-xs">Cash</SelectItem>
                  <SelectItem value="adjustment" className="text-xs">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Notes</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="text-xs"
                rows={2}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="h-8 text-xs">Cancel</Button>
              <Button onClick={handleAddPayment} disabled={savingPayment} className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs">
                {savingPayment ? 'Saving...' : 'Add Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
