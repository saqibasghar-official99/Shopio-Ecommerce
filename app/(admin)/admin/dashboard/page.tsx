'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, ChartBar as BarChart3, ShoppingBag, Package, Users } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import RevenueChart from '@/components/admin/RevenueChart';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import DataTable from '@/components/admin/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { formatCurrency, ORDER_STATUSES, cn } from '@/lib/utils';
import type { Order, Product } from '@/lib/types';

interface RevenueData {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  monthlyBreakdown: { month: string; revenue: number }[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [topCustomers, setTopCustomers] = useState<Array<{ customer_email: string; orderCount: number; totalSpent: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [revRes, ordersRes, productsRes, customersRes] = await Promise.all([
        fetch('/api/reports/revenue'),
        fetch('/api/orders?limit=5'),
        fetch('/api/reports/products'),
        fetch('/api/reports/customers'),
      ]);

      if (revRes.ok) {
        const revResult = await revRes.json();
        const revData = revResult.success ? revResult.data : revResult;
        setRevenueData(revData);
      }

      if (ordersRes.ok) {
        const ordResult = await ordersRes.json();
        const ordData = ordResult.success ? (ordResult.data || []) : (Array.isArray(ordResult) ? ordResult : ordResult.orders || []);
        const mappedOrders = ordData.map((o: Record<string, unknown>) => ({ ...o, id: o._id || o.id }));
        setRecentOrders(mappedOrders);
      }

      if (productsRes.ok) {
        const prodResult = await productsRes.json();
        const prodData = prodResult.success ? prodResult.data : prodResult;
        setTopProducts(Array.isArray(prodData) ? prodData : []);
      }

      if (customersRes.ok) {
        const custResult = await customersRes.json();
        const custData = custResult.success ? custResult.data : custResult;
        setTopCustomers(Array.isArray(custData) ? custData : []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuickStatusUpdate = async (orderNumber: string, newStatus: string) => {
    setUpdatingStatus(orderNumber);
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus }),
      });
      if (res.ok) {
        setRecentOrders((prev) =>
          prev.map((o) => (o.order_number === orderNumber ? { ...o, order_status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update order status', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const stats = revenueData
    ? [
        {
          label: 'Today Revenue',
          value: formatCurrency(revenueData.todayRevenue),
          icon: <DollarSign className="h-4 w-4 text-green-600" />,
          color: 'bg-green-100',
        },
        {
          label: 'Month Revenue',
          value: formatCurrency(revenueData.monthRevenue),
          icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
          color: 'bg-blue-100',
        },
        {
          label: 'Total Revenue',
          value: formatCurrency(revenueData.totalRevenue),
          icon: <BarChart3 className="h-4 w-4 text-yellow-600" />,
          color: 'bg-yellow-100',
        },
        {
          label: 'Recent Orders',
          value: recentOrders.length,
          icon: <ShoppingBag className="h-4 w-4 text-purple-600" />,
          color: 'bg-purple-100',
        },
        {
          label: 'Top Products',
          value: topProducts.length,
          icon: <Package className="h-4 w-4 text-indigo-600" />,
          color: 'bg-indigo-100',
        },
        {
          label: 'Top Customers',
          value: topCustomers.length,
          icon: <Users className="h-4 w-4 text-red-600" />,
          color: 'bg-red-100',
        },
      ]
    : [];

  const orderColumns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'total', label: 'Total', render: (row: Record<string, unknown>) => formatCurrency(row.total as number) },
    {
      key: 'order_status',
      label: 'Status',
      render: (row: Record<string, unknown>) => (
        <OrderStatusBadge status={row.order_status as string} />
      ),
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (row: Record<string, unknown>) => {
        const ps = row.payment_status as string;
        const colors: Record<string, string> = {
          pending: 'bg-yellow-100 text-yellow-700',
          paid: 'bg-green-100 text-green-700',
          partial: 'bg-blue-100 text-blue-700',
          refunded: 'bg-gray-100 text-gray-700',
        };
        return (
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', colors[ps] || 'bg-gray-100 text-gray-700')}>
            {ps.charAt(0).toUpperCase() + ps.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (row: Record<string, unknown>) => new Date(row.created_at as string).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Quick Update',
      render: (row: Record<string, unknown>) => (
        <Select
          value={row.order_status as string}
          onValueChange={(val) => handleQuickStatusUpdate(row.order_number as string, val)}
          disabled={updatingStatus === row.order_number}
        >
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  const productColumns = [
    {
      key: 'name',
      label: 'Product',
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-gray-900">{row.name as string}</span>
      ),
    },
    {
      key: 'totalQty',
      label: 'Qty Sold',
      render: (row: Record<string, unknown>) => (
        <span className="font-medium">{row.totalQty as number}</span>
      ),
    },
  ];

  const chartData = (revenueData?.monthlyBreakdown || []).map((entry) => ({
    date: entry.month,
    revenue: entry.revenue,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} />
        ))}
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-md border bg-gray-50" />
          ))}
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={chartData} />

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-900">Recent Orders</CardTitle>
          <button
            onClick={() => router.push('/admin/orders')}
            className="text-xs text-[#7A1F3D] hover:text-[#7A1F3D]"
          >
            View all
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={orderColumns} data={recentOrders as unknown as Record<string, unknown>[]} loading={loading} />
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-900">Top Products</CardTitle>
          <button
            onClick={() => router.push('/admin/products')}
            className="text-xs text-[#7A1F3D] hover:text-[#7A1F3D]"
          >
            View all
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={productColumns} data={topProducts as unknown as Record<string, unknown>[]} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
