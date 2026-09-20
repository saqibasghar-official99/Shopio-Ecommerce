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
      w-max
      min-w-full
      items-start
      justify-start
      gap-7
      px-6
      pb-4
      pt-4
      sm:gap-9
      sm:px-8
      lg:justify-center
      lg:gap-12
      lg:px-10
    "
  >
          {activeCategories.map((category, index) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="
    group
    flex
    w-[112px]
    flex-shrink-0
    flex-col
    items-center
    outline-none
    sm:w-[136px]
    lg:w-[156px]
  "
            >
              {/* Image Wrapper */}
              <div
                className="
      category-float
      relative
      flex
      h-[112px]
      w-[112px]
      items-center
      justify-center
      sm:h-[130px]
      sm:w-[130px]
      lg:h-[150px]
      lg:w-[150px]
    "
                style={{
                  animationDelay: `${index * 0.35}s`,
                }}
              >
                {/* Outer Decorative Ring */}
                <div
                  className="
        category-ring
        absolute
        inset-0
        rounded-full
        border
        border-[#7A1F3D]/10
      "
                  style={{
                    animationDelay: `${index * 0.25}s`,
                  }}
                />

                {/* Dashed Inner Ring */}
                <div
                  className="
        category-dashed-ring
        absolute
        inset-[5px]
        rounded-full
        border
        border-dashed
        border-[#7A1F3D]/10
      "
                  style={{
                    animationDelay: `${index * 0.4}s`,
                  }}
                />

                {/* Main Image Circle */}
                <div
                  className="
        category-image
        relative
        h-[98px]
        w-[98px]
        overflow-hidden
        rounded-full
        border-[3px]
        border-white
        bg-[#f9f1f4]
        shadow-[0_6px_24px_rgba(122,31,61,0.11)]
        sm:h-[114px]
        sm:w-[114px]
        lg:h-[132px]
        lg:w-[132px]
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
            category-image-zoom
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
        "
                  />

                  {/* Continuous Shine */}
                  <div
                    className="
          category-shine
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
        "
                    style={{
                      animationDelay: `${index * 0.7}s`,
                    }}
                  />
                </div>
              </div>

              {/* Category Name */}
              <div className="mt-4 flex min-h-[42px] flex-col items-center">
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

                {/* Indicator */}
                <span
                  className="
        category-indicator
        mt-2
        h-[1.5px]
        rounded-full
        bg-[#7A1F3D]
      "
                  style={{
                    animationDelay: `${index * 0.35}s`,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* =========================================
           FLOATING CATEGORY
        ========================================= */

        .category-float {
          animation: category-float 4.5s ease-in-out infinite;
        }

        @keyframes category-float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        /* =========================================
           OUTER RING
        ========================================= */

        .category-ring {
          animation: category-ring 3.5s ease-in-out infinite;
        }

        @keyframes category-ring {
          0%,
          100% {
            transform: scale(1);
            border-color: rgba(122, 31, 61, 0.1);
          }

          50% {
            transform: scale(1.07);
            border-color: rgba(122, 31, 61, 0.28);
          }
        }

        /* =========================================
           DASHED RING
        ========================================= */

        .category-dashed-ring {
          animation: category-rotate 8s linear infinite;
        }

        @keyframes category-rotate {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        /* =========================================
           IMAGE ZOOM
        ========================================= */

        .category-image-zoom {
          animation: category-image-zoom 5s ease-in-out infinite;
        }

        @keyframes category-image-zoom {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.07);
          }
        }

        /* =========================================
           CONTINUOUS SHINE
        ========================================= */

        .category-shine {
          animation: category-shine 4s ease-in-out infinite;
        }

        @keyframes category-shine {
          0% {
            left: -100%;
            opacity: 0;
          }

          10% {
            opacity: 0.8;
          }

          35% {
            left: 130%;
            opacity: 0.8;
          }

          36%,
          100% {
            left: 130%;
            opacity: 0;
          }
        }

        /* =========================================
           DECORATIVE DOT
        ========================================= */

        .category-dot {
          animation: category-dot 2.5s ease-in-out infinite;
        }

        @keyframes category-dot {
          0%,
          100% {
            transform: scale(0.85);
            opacity: 0.7;
          }

          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        /* =========================================
           CATEGORY INDICATOR
        ========================================= */

        .category-indicator {
          width: 20px;
          animation: category-indicator 3s ease-in-out infinite;
        }

        @keyframes category-indicator {
          0%,
          100% {
            width: 10px;
            opacity: 0.35;
          }

          50% {
            width: 24px;
            opacity: 1;
          }
        }

        /* =========================================
           HOVER
           Keep hover subtle rather than controlling
           the main animation.
        ========================================= */

        .group:hover .category-image {
          box-shadow: 0 12px 30px rgba(122, 31, 61, 0.2);
        }

        /* =========================================
           REDUCED MOTION
        ========================================= */

        @media (prefers-reduced-motion: reduce) {
          .category-float,
          .category-ring,
          .category-dashed-ring,
          .category-image-zoom,
          .category-shine,
          .category-dot,
          .category-indicator {
            animation: none !important;
          }

          .category-image-zoom {
            transform: none !important;
          }

          .category-indicator {
            width: 20px;
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}