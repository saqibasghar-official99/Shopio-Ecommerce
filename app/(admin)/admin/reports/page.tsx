'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChartBar as BarChart3, Download, TrendingUp, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DataTable from '@/components/admin/DataTable';
import { formatCurrency } from '@/lib/utils';

interface RevenueData {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  monthlyBreakdown: { month: string; revenue: number }[];
}

interface ProductReportItem {
  productId: string;
  name: string;
  totalQty: number;
}

interface CustomerReportItem {
  customer_email: string;
  orderCount: number;
  totalSpent: number;
}

export default function AdminReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Revenue
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Products
  const [productData, setProductData] = useState<ProductReportItem[]>([]);
  const [productLoading, setProductLoading] = useState(false);

  // Customers
  const [customerData, setCustomerData] = useState<CustomerReportItem[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    return params;
  };

  const fetchRevenue = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const res = await fetch(`/api/reports/revenue?${buildParams()}`);
      if (res.ok) {
        const result = await res.json();
        const data = result.success ? result.data : result;
        setRevenueData(data);
      }
    } catch (err) {
      console.error('Failed to fetch revenue report', err);
    } finally {
      setRevenueLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchProducts = useCallback(async () => {
    setProductLoading(true);
    try {
      const res = await fetch(`/api/reports/products?${buildParams()}`);
      if (res.ok) {
        const result = await res.json();
        const data = result.success ? result.data : result;
        setProductData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch product report', err);
    } finally {
      setProductLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchCustomers = useCallback(async () => {
    setCustomerLoading(true);
    try {
      const res = await fetch(`/api/reports/customers?${buildParams()}`);
      if (res.ok) {
        const result = await res.json();
        const data = result.success ? result.data : result;
        setCustomerData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch customer report', err);
    } finally {
      setCustomerLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const exportCsv = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
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

  const productColumns = [
    {
      key: 'name',
      label: 'Product',
      render: (row: Record<string, unknown>) => <span className="font-medium text-gray-900">{row.name as string}</span>,
    },
    {
      key: 'totalQty',
      label: 'Quantity Sold',
      render: (row: Record<string, unknown>) => <span className="font-medium">{row.totalQty as number}</span>,
    },
  ];

  const customerColumns = [
    {
      key: 'customer_email',
      label: 'Email',
      render: (row: Record<string, unknown>) => <span className="font-medium text-gray-900">{row.customer_email as string}</span>,
    },
    {
      key: 'orderCount',
      label: 'Orders',
      render: (row: Record<string, unknown>) => <span className="font-medium">{row.orderCount as number}</span>,
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (row: Record<string, unknown>) => formatCurrency(row.totalSpent as number),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Reports</h1>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-36 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-36 text-xs" />
          </div>
          <Button onClick={() => { fetchRevenue(); fetchProducts(); fetchCustomers(); }} className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs">
            Apply
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="revenue">
        <TabsList className="h-9">
          <TabsTrigger value="revenue" className="text-xs">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="products" className="text-xs">
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
            Top Products
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Top Customers
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          {revenueData && (
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Today Revenue</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(revenueData.todayRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Month Revenue</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(revenueData.monthRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(revenueData.totalRevenue)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue Chart (Last 12 Months)</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => exportCsv((revenueData?.monthlyBreakdown || []) as unknown as Record<string, unknown>[], 'revenue-report')}
              >
                <Download className="mr-1 h-3 w-3" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={revenueData?.monthlyBreakdown || []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrency(v)} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => exportCsv(productData as unknown as Record<string, unknown>[], 'products-report')}
            >
              <Download className="mr-1 h-3 w-3" />
              CSV
            </Button>
          </div>
          <DataTable
            columns={productColumns}
            data={productData as unknown as Record<string, unknown>[]}
            loading={productLoading}
          />
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => exportCsv(customerData as unknown as Record<string, unknown>[], 'customer-report')}
            >
              <Download className="mr-1 h-3 w-3" />
              CSV
            </Button>
          </div>
          <DataTable
            columns={customerColumns}
            data={customerData as unknown as Record<string, unknown>[]}
            loading={customerLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
