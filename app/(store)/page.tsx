'use client';

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import CategoryGrid from '@/components/store/CategoryGrid';
import ProductCard from '@/components/store/ProductCard';
import { Category, Product, SiteSettings } from '@/lib/types';
import { useSettings } from '@/contexts/SettingsContext';

const fetchJson = (url: string) =>
  fetch(url, { cache: 'no-store' })
    .then((r) => r.json())
    .catch(() => ({}));

export default function HomePage() {
  // Reuse the SettingsContext value instead of re-fetching /api/settings here.
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchJson('/api/categories'),
      fetchJson('/api/products?featured=true&limit=8'),
      fetchJson('/api/products?sort=newest&limit=8'),
    ]).then(([categoriesData, featuredData, arrivalsData]) => {
      if (!mounted) return;
      if (categoriesData.data) {
        setCategories(
          categoriesData.data.map((c: Category & { _id?: string }) => ({
            ...c,
            id: c._id || c.id,
          }))
        );
      }
      if (featuredData.data) {
        setFeaturedProducts(
          featuredData.data.map((p: Product & { _id?: string }) => ({
            ...p,
            id: p._id || p.id,
          }))
        );
      }
      if (arrivalsData.data) {
        setNewArrivals(
          arrivalsData.data.map((p: Product & { _id?: string }) => ({
            ...p,
            id: p._id || p.id,
          }))
        );
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const banners = settings?.banners?.filter((b) => b.isActive) || [];

  return (
    <div className="bg-white">
      {banners.length > 0 && <BannerCarousel banners={banners} />}

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <SectionHeader title="Shop by Category" href="/products" />
          <CategoryGrid categories={categories} />
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <SectionHeader title="Featured Products" href="/products?featured=true" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <SectionHeader title="New Arrivals" href="/products?sort=newest" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {loading &&
        categories.length === 0 &&
        featuredProducts.length === 0 &&
        newArrivals.length === 0 && <HomeSkeleton />}

      {!loading &&
        categories.length === 0 &&
        featuredProducts.length === 0 &&
        newArrivals.length === 0 && (
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

const SectionHeader = memo(function SectionHeader({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <Link
        href={href}
        className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
      >
        View all
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
});

function HomeSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function BannerCarousel({
  banners,
}: {
  banners: { image: string; link: string; isActive: boolean }[];
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden bg-gray-100">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div key={index} className="w-full shrink-0">
            <Link href={banner.link || '#'}>
              <div className="relative w-full aspect-[21/9] sm:aspect-[3/1]">
                <img
                  src={banner.image}
                  alt={`Banner ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
              </div>
            </Link>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-2 rounded-full transition-all ${
                index === current
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
