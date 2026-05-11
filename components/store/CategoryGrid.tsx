'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/lib/types';

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const activeCategories = categories.filter((c) => c.is_active);

  if (activeCategories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {activeCategories.map((category) => (
        <Link
          key={category.id}
          href={`/products?category=${category.slug}`}
          className="group relative flex flex-col items-center justify-center rounded-lg overflow-hidden border border-gray-100 bg-white hover:shadow-md transition-shadow aspect-[4/3]"
        >
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-green-50" />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

          {/* Category name */}
          <span className="relative z-10 text-sm font-medium text-white text-center px-2">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
