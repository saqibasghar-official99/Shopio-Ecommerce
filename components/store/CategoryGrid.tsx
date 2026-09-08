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
    <section className="w-full">
      {/* Section Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-2 flex items-center gap-3">
          <span className="h-px w-8 bg-[#7A1F3D]/30" />

          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#7A1F3D]">
            Discover
          </span>

          <span className="h-px w-8 bg-[#7A1F3D]/30" />
        </div>

        <h2 className="font-serif text-xl font-medium tracking-wide text-gray-900 sm:text-2xl">
          Shop by Category
        </h2>

        <p className="mt-1.5 text-xs text-gray-500 sm:text-sm">
          Find something beautiful for every occasion
        </p>
      </div>

      {/* Categories */}
      <div
        className="
          w-full
          overflow-x-auto
          overflow-y-hidden
          scrollbar-hide
          [-ms-overflow-style:none]
          [scrollbar-width:none]
        "
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          className="
            flex
            items-start
            justify-start
            gap-5
            px-5
            pb-3
            pt-2
            sm:gap-7
            sm:px-6
            lg:justify-center
            lg:gap-10
            lg:px-8
          "
        >
          {activeCategories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="
                group
                flex
                w-[96px]
                flex-shrink-0
                flex-col
                items-center
                outline-none
                sm:w-[112px]
                lg:w-[128px]
              "
            >
              {/* Image Wrapper */}
              <div
                className="
                  relative
                  flex
                  h-[88px]
                  w-[88px]
                  items-center
                  justify-center
                  transition-all
                  duration-500
                  ease-out
                  group-hover:-translate-y-1
                  sm:h-[104px]
                  sm:w-[104px]
                  lg:h-[118px]
                  lg:w-[118px]
                  lg:group-hover:-translate-y-2
                "
              >
                {/* Outer Decorative Ring */}
                <div
                  className="
                    absolute
                    inset-0
                    rounded-full
                    border
                    border-[#7A1F3D]/10
                    transition-all
                    duration-500
                    group-hover:scale-[1.08]
                    group-hover:border-[#7A1F3D]/35
                  "
                />

                {/* Dashed Inner Ring */}
                <div
                  className="
                    absolute
                    inset-[4px]
                    rounded-full
                    border
                    border-dashed
                    border-[#7A1F3D]/10
                    transition-all
                    duration-700
                    group-hover:rotate-[25deg]
                    group-hover:border-[#7A1F3D]/30
                  "
                />

                {/* Main Image Circle */}
                <div
                  className="
                    relative
                    h-[76px]
                    w-[76px]
                    overflow-hidden
                    rounded-full
                    border-[3px]
                    border-white
                    bg-[#f9f1f4]
                    shadow-[0_5px_20px_rgba(122,31,61,0.10)]
                    transition-all
                    duration-500
                    group-hover:shadow-[0_12px_30px_rgba(122,31,61,0.20)]
                    sm:h-[90px]
                    sm:w-[90px]
                    lg:h-[104px]
                    lg:w-[104px]
                  "
                >
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      decoding="async"
                      className="
                        absolute
                        inset-0
                        h-full
                        w-full
                        object-cover
                        transition-transform
                        duration-700
                        ease-out
                        group-hover:scale-110
                      "
                    />
                  ) : (
                    <div
                      className="
                        absolute
                        inset-0
                        bg-gradient-to-br
                        from-[#fff8fa]
                        via-[#f8e9ef]
                        to-[#ead1da]
                      "
                    />
                  )}

                  {/* Image Overlay */}
                  <div
                    className="
                      absolute
                      inset-0
                      bg-gradient-to-t
                      from-[#7A1F3D]/10
                      via-transparent
                      to-white/20
                      opacity-70
                      transition-opacity
                      duration-500
                      group-hover:opacity-100
                    "
                  />

                  {/* Animated Shine */}
                  <div
                    className="
                      pointer-events-none
                      absolute
                      -left-[100%]
                      top-0
                      h-full
                      w-[55%]
                      rotate-[18deg]
                      bg-gradient-to-r
                      from-transparent
                      via-white/50
                      to-transparent
                      opacity-0
                      transition-all
                      duration-700
                      group-hover:left-[130%]
                      group-hover:opacity-100
                    "
                  />
                </div>

                {/* Small Decorative Dot */}
                <span
                  className="
                    absolute
                    bottom-[3px]
                    right-[4px]
                    h-2.5
                    w-2.5
                    rounded-full
                    border-2
                    border-white
                    bg-[#7A1F3D]
                    opacity-0
                    scale-0
                    shadow-sm
                    transition-all
                    duration-300
                    group-hover:scale-100
                    group-hover:opacity-100
                    sm:bottom-[5px]
                    sm:right-[6px]
                  "
                />
              </div>

              {/* Category Name */}
              <div className="mt-3 flex min-h-[38px] flex-col items-center">
                <span
                  className="
                    text-center
                    text-[11px]
                    font-semibold
                    leading-tight
                    tracking-wide
                    text-gray-800
                    transition-colors
                    duration-300
                    group-hover:text-[#7A1F3D]
                    sm:text-xs
                    lg:text-sm
                  "
                >
                  {category.name}
                </span>

                {/* Hover Indicator */}
                <span
                  className="
                    mt-1.5
                    h-[1.5px]
                    w-0
                    rounded-full
                    bg-[#7A1F3D]
                    transition-all
                    duration-300
                    group-hover:w-5
                  "
                />
              </div>

              {/* Keyboard Focus */}
              <span
                className="
                  pointer-events-none
                  absolute
                  rounded-full
                  ring-2
                  ring-[#7A1F3D]/0
                  ring-offset-2
                  transition-all
                  group-focus-visible:ring-[#7A1F3D]/40
                "
              />
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}