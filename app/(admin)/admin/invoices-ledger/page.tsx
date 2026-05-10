'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, FileText, BookOpen, Download } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatCurrency, cn, getOrderStatusColor, getPaymentStatusColor } from '@/lib/utils';
import type { Order } from '@/lib/types';

export default function AdminInvoicesLedgerPage() {
  // Invoices tab
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit] = useState(20);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceDateFrom, setInvoiceDateFrom] = useState('');
  const [invoiceDateTo, setInvoiceDateTo] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('all');

  // Ledger tab - derived from orders with payment info
  const [ledgerOrders, setLedgerOrders] = useState<Order[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLimit] = useState(20);
  const [ledgerDateFrom, setLedgerDateFrom] = useState('');
  const [ledgerDateTo, setLedgerDateTo] = useState('');

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams({
        page: ordersPage.toString(),
        limit: ordersLimit.toString(),
      });
      if (invoiceSearch) params.set('search', invoiceSearch);
      if (invoiceDateFrom) params.set('date_from', invoiceDateFrom);
      if (invoiceDateTo) params.set('date_to', invoiceDateTo);
      if (invoiceStatus !== 'all') params.set('payment_status', invoiceStatus);

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const result = await res.json();
        const ordersData = result.success ? (result.data || []) : (Array.isArray(result) ? result : result.orders || []);
        const mapped = ordersData.map((o: Record<string, unknown>) => ({ ...o, id: o._id || o.id }));
        setOrders(mapped);
        setOrdersTotal(result.pagination?.total || result.total || mapped.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPage, ordersLimit, invoiceSearch, invoiceDateFrom, invoiceDateTo, invoiceStatus]);

  const fetchLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const params = new URLSearchParams({
        page: ledgerPage.toString(),
        limit: ledgerLimit.toString(),
      });
      if (ledgerDateFrom) params.set('date_from', ledgerDateFrom);
      if (ledgerDateTo) params.set('date_to', ledgerDateTo);
      params.set('payment_status', 'paid');

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const result = await res.json();
        const ordersData = result.success ? (result.data || []) : (Array.isArray(result) ? result : result.orders || []);
        const mapped = ordersData.map((o: Record<string, unknown>) => ({ ...o, id: o._id || o.id }));
        setLedgerOrders(mapped);
        setLedgerTotal(result.pagination?.total || result.total || mapped.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch ledger data', err);
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerPage, ledgerLimit, ledgerDateFrom, ledgerDateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const invoiceColumns = [
    {
      key: 'order_number',
      label: 'Invoice #',
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-green-600">{row.order_number as string}</span>
      ),
    },
    { key: 'customer_name', label: 'Customer' },
    {
      key: 'total',
      label: 'Amount',
      render: (row: Record<string, unknown>) => formatCurrency(row.total as number),
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (row: Record<string, unknown>) => {
        const ps = row.payment_status as string;
        return (
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', getPaymentStatusColor(ps))}>
            {ps.charAt(0).toUpperCase() + ps.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'order_status',
      label: 'Status',
      render: (row: Record<string, unknown>) => (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', getOrderStatusColor(row.order_status as string))}>
          {(row.order_status as string).charAt(0).toUpperCase() + (row.order_status as string).slice(1)}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (row: Record<string, unknown>) => new Date(row.created_at as string).toLocaleDateString(),
    },
    {
      key: 'invoice',
      label: 'Invoice',
      render: (row: Record<string, unknown>) => (
        <a href={`/api/invoice/${row.order_number as string}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 text-xs font-medium">
          Download
        </a>
      ),
    },
  ];

  const ledgerColumns = [
    {
      key: 'order_number',
      label: 'Order #',
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-green-600">{row.order_number as string}</span>
      ),
    },
    { key: 'customer_name', label: 'Customer' },
    {
      key: 'payment_method',
      label: 'Method',
      render: (row: Record<string, unknown>) => {
        const method = row.payment_method as string;
        return <span className="capitalize">{method || '--'}</span>;
      },
    },
    {
      key: 'total',
      label: 'Amount',
      render: (row: Record<string, unknown>) => formatCurrency(row.total as number),
    },
    {
      key: 'order_status',
      label: 'Status',
      render: (row: Record<string, unknown>) => (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', getOrderStatusColor(row.order_status as string))}>
          {(row.order_status as string).charAt(0).toUpperCase() + (row.order_status as string).slice(1)}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (row: Record<string, unknown>) => new Date(row.created_at as string).toLocaleString(),
    },
  ];

  const exportCsv = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).filter((h) => h !== '_id');
    const csv = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Invoices & Ledger</h1>

      <Tabs defaultValue="invoices">
        <TabsList className="h-9">
          <TabsTrigger value="invoices" className="text-xs">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Ledger
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Order # or customer..."
                    value={invoiceSearch}
                    onChange={(e) => { setInvoiceSearch(e.target.value); setOrdersPage(1); }}
                    className="h-8 w-48 pl-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">From</Label>
                <Input type="date" value={invoiceDateFrom} onChange={(e) => { setInvoiceDateFrom(e.target.value); setOrdersPage(1); }} className="h-8 w-36 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">To</Label>
                <Input type="date" value={invoiceDateTo} onChange={(e) => { setInvoiceDateTo(e.target.value); setOrdersPage(1); }} className="h-8 w-36 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Payment</Label>
                <Select value={invoiceStatus} onValueChange={(val) => { setInvoiceStatus(val); setOrdersPage(1); }}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Payments</SelectItem>
                    <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                    <SelectItem value="paid" className="text-xs">Paid</SelectItem>
                    <SelectItem value="partial" className="text-xs">Partial</SelectItem>
                    <SelectItem value="refunded" className="text-xs">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => exportCsv(orders as unknown as Record<string, unknown>[], 'invoices')}
                >
                  <Download className="mr-1 h-3 w-3" />
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={invoiceColumns}
            data={orders as unknown as Record<string, unknown>[]}
            loading={ordersLoading}
          />
          <Pagination page={ordersPage} limit={ordersLimit} total={ordersTotal} onPageChange={setOrdersPage} />
        </TabsContent>

        {/* Ledger Tab */}
        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">From</Label>
                <Input type="date" value={ledgerDateFrom} onChange={(e) => { setLedgerDateFrom(e.target.value); setLedgerPage(1); }} className="h-8 w-36 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">To</Label>
                <Input type="date" value={ledgerDateTo} onChange={(e) => { setLedgerDateTo(e.target.value); setLedgerPage(1); }} className="h-8 w-36 text-xs" />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => exportCsv(ledgerOrders as unknown as Record<string, unknown>[], 'ledger')}
                >
                  <Download className="mr-1 h-3 w-3" />
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={ledgerColumns}
            data={ledgerOrders as unknown as Record<string, unknown>[]}
            loading={ledgerLoading}
          />
          <Pagination page={ledgerPage} limit={ledgerLimit} total={ledgerTotal} onPageChange={setLedgerPage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
