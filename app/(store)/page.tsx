import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import CategoryGrid from '@/components/store/CategoryGrid';
import ProductCard from '@/components/store/ProductCard';
import BannerCarousel from '@/components/store/BannerCarousel';
import Deals from '@/components/store/Deals';

import {
  getSettings,
  getActiveCategories,
  getFeaturedProducts,
  getNewArrivals,
} from '@/lib/server/queries';
import type { Category, Product } from '@/lib/types';

// ISR — the rendered HTML is cached and re-generated at most every 60 seconds.
// First user pays the DB cost; everyone else gets HTML straight from cache.
export const revalidate = 60;

export default async function HomePage() {
  // Parallel server-side fetches — no client roundtrip, no waterfall.
  // The cached() helper de-dupes if the same data was already loaded in the
  // shared layout (e.g. SettingsProvider hydration).
  const [settings, categories, featured, newArrivals] = await Promise.all([
    getSettings(),
    getActiveCategories(),
    getFeaturedProducts(8),
    getNewArrivals(8),
  ]);

  const banners = (settings?.banners || []).filter((b: { isActive: boolean }) => b.isActive);

  return (
    <div className="bg-white">
      {banners.length > 0 && <BannerCarousel banners={banners} />}

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <SectionHeader title="Shop by Category" href="/products" />
          <CategoryGrid categories={categories as unknown as Category[]} />
        </section>
      )}

       {/* Deals */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <Deals />
      </section>

      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <SectionHeader title="Featured Products" href="/products?featured=true" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(featured as unknown as Product[]).map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <SectionHeader title="New Arrivals" href="/products?sort=newest" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(newArrivals as unknown as Product[]).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {categories.length === 0 && featured.length === 0 && newArrivals.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500 text-sm">No products available yet. Check back soon!</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm text-green-600 hover:text-green-700"
          >
            Browse all products
          </Link>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <Link
        href={href}
        className="text-sm text-[#7A1F3D] hover:text-[#7A1F3D] flex items-center gap-1"
      >
        View all
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
