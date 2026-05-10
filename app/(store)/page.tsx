'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import CategoryGrid from '@/components/store/CategoryGrid';
import ProductCard from '@/components/store/ProductCard';
import { Category, Product, SiteSettings } from '@/lib/types';

export default function HomePage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then((r) => r.json()).catch(() => ({})),
      fetch('/api/categories').then((r) => r.json()).catch(() => ({})),
      fetch('/api/products?featured=true').then((r) => r.json()).catch(() => ({})),
      fetch('/api/products?sort=newest&limit=8').then((r) => r.json()).catch(() => ({})),
    ]).then(([settingsData, categoriesData, featuredData, arrivalsData]) => {
      if (settingsData.data) setSettings({ ...settingsData.data, id: settingsData.data._id || settingsData.data.id });
      if (categoriesData.data) setCategories(categoriesData.data.map((c: Category & { _id?: string }) => ({ ...c, id: c._id || c.id })));
      if (featuredData.data) setFeaturedProducts(featuredData.data.map((p: Product & { _id?: string }) => ({ ...p, id: p._id || p.id })));
      if (arrivalsData.data) setNewArrivals(arrivalsData.data.map((p: Product & { _id?: string }) => ({ ...p, id: p._id || p.id })));
    });
  }, []);

  const banners = settings?.banners?.filter((b) => b.isActive) || [];
  const currency = settings?.currency || '$';

  return (
    <div className="bg-white">
      {/* Hero Banner Carousel */}
      {banners.length > 0 && (
        <BannerCarousel banners={banners} />
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Shop by Category</h2>
            <Link
              href="/products"
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <CategoryGrid categories={categories} />
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Featured Products</h2>
            <Link
              href="/products?featured=true"
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">New Arrivals</h2>
            <Link
              href="/products?sort=newest"
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {categories.length === 0 && featuredProducts.length === 0 && newArrivals.length === 0 && (
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
                />
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Dots */}
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
