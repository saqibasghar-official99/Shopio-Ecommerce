'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  limit,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (page > 3) pages.push('ellipsis-start');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push('ellipsis-end');

    pages.push(totalPages);

    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-1 py-2">
      <span className="text-xs text-gray-500">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors',
            page <= 1
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-600 hover:bg-gray-100'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {getPageNumbers().map((p, idx) =>
          typeof p === 'string' ? (
            <span
              key={p}
              className="inline-flex h-7 w-7 items-center justify-center text-xs text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p)}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors',
                p === page
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors',
            page >= totalPages
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-600 hover:bg-gray-100'
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
