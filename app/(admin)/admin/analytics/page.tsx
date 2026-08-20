'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  MousePointerClick,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Search,
  CalendarDays,
} from 'lucide-react';

interface ProductAnalytics {
  product_id: string;
  product_name: string;
  product_slug?: string;
  visits: number;
  clicks: number;
  orders: number;
  revenue: number;
}

interface AnalyticsResponse {
  success: boolean;
  products: ProductAnalytics[];
  totals?: {
    visits: number;
    clicks: number;
    orders: number;
    revenue: number;
  };
}

export default function AnalyticsPage() {
  const [products, setProducts] = useState<ProductAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('30');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin-users/analytics?days=${dateRange}`,
        {
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data: AnalyticsResponse = await response.json();

      if (data.success) {
        setProducts(data.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Analytics error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      product.product_name
        .toLowerCase()
        .includes(query)
    );
  }, [products, search]);

  const totals = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        acc.visits += product.visits || 0;
        acc.clicks += product.clicks || 0;
        acc.orders += product.orders || 0;
        acc.revenue += product.revenue || 0;

        return acc;
      },
      {
        visits: 0,
        clicks: 0,
        orders: 0,
        revenue: 0,
      }
    );
  }, [products]);

  const conversionRate =
    totals.visits > 0
      ? ((totals.orders / totals.visits) * 100).toFixed(2)
      : '0.00';

  const clickRate =
    totals.visits > 0
      ? ((totals.clicks / totals.visits) * 100).toFixed(2)
      : '0.00';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Product Analytics
            </h1>

            <p className="mt-0.5 text-xs text-gray-500">
              Track visits, clicks, orders and revenue for every product.
            </p>
          </div>

          <div className="flex items-center gap-2">

            <div className="relative">
              <CalendarDays
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-8 rounded-md border border-gray-300 bg-white pl-8 pr-6 text-xs text-gray-700 outline-none focus:border-gray-500"
              >
                <option value="7">
                  Last 7 days
                </option>

                <option value="30">
                  Last 30 days
                </option>

                <option value="90">
                  Last 90 days
                </option>

                <option value="365">
                  Last 1 year
                </option>
              </select>
            </div>

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={
                  loading ? 'animate-spin' : ''
                }
              />

              Refresh
            </button>

          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Visits"
            value={totals.visits.toLocaleString()}
            icon={<Eye size={16} />}
            description={`${clickRate}% click rate`}
          />

          <StatCard
            title="Total Clicks"
            value={totals.clicks.toLocaleString()}
            icon={<MousePointerClick size={16} />}
            description="Product interactions"
          />

          <StatCard
            title="Total Orders"
            value={totals.orders.toLocaleString()}
            icon={<ShoppingBag size={16} />}
            description={`${conversionRate}% conversion`}
          />

          <StatCard
            title="Total Revenue"
            value={`Rs. ${totals.revenue.toLocaleString()}`}
            icon={<TrendingUp size={16} />}
            description="From tracked products"
          />

        </div>

        {/* Search */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div className="relative w-full sm:max-w-xs">

            <Search
              size={15}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="h-8 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-xs outline-none focus:border-gray-500"
            />

          </div>

          <div className="text-[11px] text-gray-500">
            {filteredProducts.length} product
            {filteredProducts.length !== 1 ? 's' : ''}
          </div>

        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[750px]">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">

                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Product
                  </th>

                  <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Visits
                  </th>

                  <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Clicks
                  </th>

                  <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Orders
                  </th>

                  <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Conversion
                  </th>

                  <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Revenue
                  </th>

                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <LoadingRows />
                ) : filteredProducts.length === 0 ? (

                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-xs text-gray-500"
                    >
                      No analytics data found.
                    </td>
                  </tr>

                ) : (

                  filteredProducts.map((product) => {

                    const conversion =
                      product.visits > 0
                        ? (
                            (product.orders /
                              product.visits) *
                            100
                          ).toFixed(2)
                        : '0.00';

                    return (
                      <tr
                        key={product.product_id}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                      >

                        <td className="px-3 py-2.5">

                          <div className="text-xs font-medium text-gray-900">
                            {product.product_name.split(/\s+/).slice(0, 3).join(' ')}
                          </div>

                          {product.product_slug && (
                            <div className="mt-0.5 text-[10px] text-gray-400">
                              {product.product_slug}
                            </div>
                          )}

                        </td>

                        <td className="px-3 py-2.5 text-right text-xs text-gray-700">
                          {product.visits.toLocaleString()}
                        </td>

                        <td className="px-3 py-2.5 text-right text-xs text-gray-700">
                          {product.clicks.toLocaleString()}
                        </td>

                        <td className="px-3 py-2.5 text-right text-xs font-medium text-gray-900">
                          {product.orders.toLocaleString()}
                        </td>

                        <td className="px-3 py-2.5 text-right">

                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                            {conversion}%
                          </span>

                        </td>

                        <td className="px-3 py-2.5 text-right text-xs font-medium text-gray-900">
                          Rs.{' '}
                          {product.revenue.toLocaleString()}
                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>
        </div>

      </div>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">

      <div className="mb-2 flex items-center justify-between">

        <p className="text-xs font-medium text-gray-500">
          {title}
        </p>

        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-700">
          {icon}
        </div>

      </div>

      <div className="text-lg font-semibold text-gray-900">
        {value}
      </div>

      <p className="mt-0.5 text-[10px] text-gray-500">
        {description}
      </p>

    </div>
  );
}

/* ============================================================
   LOADING ROWS
============================================================ */

function LoadingRows() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <tr
          key={item}
          className="border-b border-gray-100"
        >

          <td className="px-3 py-3">
            <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
          </td>

          <td className="px-3 py-3">
            <div className="ml-auto h-3 w-10 animate-pulse rounded bg-gray-200" />
          </td>

          <td className="px-3 py-3">
            <div className="ml-auto h-3 w-10 animate-pulse rounded bg-gray-200" />
          </td>

          <td className="px-3 py-3">
            <div className="ml-auto h-3 w-10 animate-pulse rounded bg-gray-200" />
          </td>

          <td className="px-3 py-3">
            <div className="ml-auto h-5 w-14 animate-pulse rounded-full bg-gray-200" />
          </td>

          <td className="px-3 py-3">
            <div className="ml-auto h-3 w-20 animate-pulse rounded bg-gray-200" />
          </td>

        </tr>
      ))}
    </>
  );
}