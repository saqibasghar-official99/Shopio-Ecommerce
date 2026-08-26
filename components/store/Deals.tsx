"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowRight,
  Flame,
} from "lucide-react";

interface Deal {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  href: string;
  badge?: string;
  is_active: boolean;
  sort_order: number;
}

interface DealsProps {
  deals?: Deal[];
}

export default function Deals({
  deals: initialDeals,
}: DealsProps) {
  const [deals, setDeals] = useState<Deal[]>(
    initialDeals || [],
  );

  const [showSection, setShowSection] =
    useState(true);

  const [loading, setLoading] =
    useState(!initialDeals);

  useEffect(() => {
    if (initialDeals) {
      setDeals(
        initialDeals
          .filter((deal) => deal.is_active)
          .sort(
            (a, b) =>
              a.sort_order - b.sort_order,
          ),
      );

      setShowSection(true);
      setLoading(false);

      return;
    }

    const loadDeals = async () => {
      try {
        setLoading(true);

        const [
          dealsRes,
          settingsRes,
        ] = await Promise.all([
          fetch("/api/deals", {
            cache: "no-store",
          }),
          fetch("/api/deals/settings", {
            cache: "no-store",
          }),
        ]);

        if (dealsRes.ok) {
          const dealsJson =
            await dealsRes.json();

          const fetchedDeals =
            Array.isArray(dealsJson.data)
              ? dealsJson.data
              : [];

          const activeDeals = fetchedDeals
            .map((deal: Deal & { _id?: string }) => ({
              ...deal,

              // MongoDB fallback
              id: deal.id || deal._id || "",

              // Keep badge as a simple string
              badge:
                typeof deal.badge === "string"
                  ? deal.badge.trim()
                  : "",
            }))
            .filter(
              (deal: Deal) =>
                deal.is_active,
            )
            .sort(
              (
                a: Deal,
                b: Deal,
              ) =>
                a.sort_order -
                b.sort_order,
            );

          setDeals(activeDeals);
        } else {
          setDeals([]);
        }

        if (settingsRes.ok) {
          const settingsJson =
            await settingsRes.json();

          setShowSection(
            settingsJson.show_section !==
            false,
          );
        } else {
          setShowSection(true);
        }
      } catch (error) {
        console.error(
          "Failed to load deals:",
          error,
        );

        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    loadDeals();
  }, [initialDeals]);

  /*
   * Do not render anything when admin
   * has disabled the complete section.
   */
  if (!showSection) {
    return null;
  }

  /*
   * Avoid showing the section while
   * deals are being loaded.
   */
  if (loading) {
    return null;
  }

  /*
   * Only active deals should appear
   * on the storefront.
   */
  const visibleDeals = deals
    .filter((deal) => deal.is_active)
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order,
    );

  /*
   * If the section is enabled but there
   * are no active deals, don't show an
   * empty section.
   */
  if (visibleDeals.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex items-center justify-between m-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7A1F3D]/10">
            <Flame className="h-4 w-4 text-[#7A1F3D]" />
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
              Deals & Offers
            </h2>

            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
              Grab the best deals before they're gone
            </p>
          </div>
        </div>

        <Link
          href="/products?deals=true"
          className="
            flex
            items-center
            gap-1
            text-xs
            font-medium
            text-[#7A1F3D]
            hover:underline
            shrink-0
          "
        >
          View All

          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* =====================================================
          DEALS ROW
      ====================================================== */}
      <div
        className="
          flex
          w-full
          gap-3
          sm:gap-4
          overflow-x-auto
          py-4
          scrollbar-hide
          snap-x
          snap-mandatory
        "
      >
        {visibleDeals.map(
          (deal) => (
            <Link
              key={deal.id}
              href={
                deal.badge
                  ? `/products?badge=${encodeURIComponent(deal.badge.trim())}`
                  : deal.href || "/products"
              }
              className="
                group
                shrink-0
                w-[82px]
                sm:flex-1
                sm:w-auto
                sm:min-w-0
                snap-start
                text-center
              "
            >
              {/* =================================================
                  DEAL CIRCLE
              ================================================== */}
              <div className="relative mx-auto w-[68px] sm:w-[82px]">
                <div
                  className="
                    rounded-full
                    p-[2px]
                    bg-gradient-to-br
                    from-[#7A1F3D]
                    via-[#B94A68]
                    to-[#E9A2B5]
                    transition-transform
                    duration-300
                    group-hover:scale-105
                  "
                >
                  <div
                    className="
                      aspect-square
                      rounded-full
                      overflow-hidden
                      bg-gray-100
                      border-2
                      border-white
                      flex
                      items-center
                      justify-center
                    "
                  >
                    {deal.image ? (
                      <img
                        src={deal.image}
                        alt={deal.name}
                        className="
                          h-full
                          w-full
                          object-cover
                          transition-transform
                          duration-300
                          group-hover:scale-110
                        "
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#7A1F3D]/5">
                        <Flame
                          className="
                            h-7
                            w-7
                            text-[#7A1F3D]
                            transition-transform
                            duration-300
                            group-hover:scale-110
                          "
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* =================================================
                    BADGE
                ================================================== */}
                {deal.badge &&
                  deal.badge.trim() && (
                    <span
                      className="
                        absolute
                        -top-1
                        -right-1
                        max-w-[65px]
                        overflow-hidden
                        text-ellipsis
                        rounded-full
                        bg-[#7A1F3D]
                        px-1.5
                        py-0.5
                        text-[8px]
                        font-bold
                        leading-tight
                        text-white
                        shadow-sm
                        whitespace-nowrap
                      "
                      title={deal.badge}
                    >
                      {deal.badge.trim()}
                    </span>
                  )}
              </div>

              {/* =================================================
                  DEAL NAME
              ================================================== */}
              <h3
                className="
                  mt-2
                  text-[11px]
                  sm:text-xs
                  font-semibold
                  text-gray-900
                  line-clamp-1
                  group-hover:text-[#7A1F3D]
                  transition-colors
                "
              >
                {deal.name}
              </h3>

              {/* =================================================
                  SUBTITLE
              ================================================== */}
              {deal.subtitle && (
                <p
                  className="
                    mt-0.5
                    text-[9px]
                    sm:text-[10px]
                    text-gray-500
                    line-clamp-1
                  "
                >
                  {deal.subtitle}
                </p>
              )}
            </Link>
          ),
        )}
      </div>
    </section>
  );
}