'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Column {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>, index: number) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
}: DataTableProps) {
  const skeletonRows = 5;

  return (
    <div className="overflow-x-auto rounded-md border bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className="sticky top-0 bg-gray-50/80 px-4 py-2.5 text-left text-xs font-medium text-gray-500"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, rowIdx) => (
              <tr key={`skeleton-${rowIdx}`} className="border-b last:border-0">
                {columns.map((col, colIdx) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton
                      className={`h-3 ${colIdx === 0 ? 'w-24' : 'w-16'}`}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-xs text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b last:border-0 hover:bg-gray-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 text-xs text-gray-700">
                    {col.render ? col.render(row, rowIdx) : (row[col.key] as React.ReactNode) ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
