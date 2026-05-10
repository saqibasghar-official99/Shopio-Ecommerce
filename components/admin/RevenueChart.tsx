'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-md border bg-white p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-900">Revenue</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCurrency(v)}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#16a34a' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
