'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import ProductCard from '@/components/store/ProductCard';
import { Product, Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'best-selling', label: 'Best Selling' },
];

const PRODUCTS_PER_PAGE = 12;

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-100 rounded w-48" /><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-lg" />)}</div></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state from URL
  const categorySlug = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const [tagFilter, setTagFilter] = useState<string>(
    searchParams.get('tag') || ''
  );
  const [priceMin, setPriceMin] = useState<string>(
    searchParams.get('min') || ''
  );
  const [priceMax, setPriceMax] = useState<string>(
    searchParams.get('max') || ''
  );
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories((data.data || []).map((c: Category & { _id?: string }) => ({ ...c, id: c._id || c.id }))))
      .catch(() => { });
  }, []);

  // Fetch products — cancel in-flight on rapid filter changes
  const fetchProducts = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (categorySlug) params.set('category', categorySlug);
        if (sort) params.set('sort', sort);
        params.set('page', page.toString());
        params.set('limit', PRODUCTS_PER_PAGE.toString());
        if (search) params.set('search', search);
        if (tagFilter) params.set('tag', tagFilter);
        if (priceMin) params.set('min', priceMin);
        if (priceMax) params.set('max', priceMax);

        const res = await fetch(`/api/products?${params.toString()}`, { signal });
        const data = await res.json();
        setProducts(
          (data.data || []).map((p: Product & { _id?: string }) => ({ ...p, id: p._id || p.id }))
        );
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') setProducts([]);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [categorySlug, sort, page, search, tagFilter, priceMin, priceMax]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  // Build URL with updated params
  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    return `/products?${params.toString()}`;
  };

  // Active filter count
  const activeFilterCount = [
    categorySlug,
    tagFilter,
    priceMin,
    priceMax,
  ].filter(Boolean).length;

  // Category tree building
  const parentCategories = categories.filter((c) => !c.parent_id && c.is_active);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId && c.is_active);

  // All unique tags from products
  const allTags = Array.from(
    new Set(products.flatMap((p) => p.tags || []))
  ).sort();

  const clearAllFilters = () => {
    setTagFilter('');
    setPriceMin('');
    setPriceMax('');
    router.push('/products');
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Active Filters
            </span>
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#7A1F3D]"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categorySlug && (
              <Badge variant="secondary" className="text-xs gap-1">
                {categories.find((c) => c.slug === categorySlug)?.name || categorySlug}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => router.push(buildUrl({ category: null }))}
                />
              </Badge>
            )}
            {tagFilter && (
              <Badge variant="secondary" className="text-xs gap-1">
                {tagFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setTagFilter('');
                    router.push(buildUrl({ tag: null }));
                  }}
                />
              </Badge>
            )}
            {(priceMin || priceMax) && (
              <Badge variant="secondary" className="text-xs gap-1">
                {priceMin && priceMax
                  ? `$${priceMin} - $${priceMax}`
                  : priceMin
                    ? `From $${priceMin}`
                    : `Up to $${priceMax}`}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setPriceMin('');
                    setPriceMax('');
                    router.push(buildUrl({ min: null, max: null }));
                  }}
                />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      <div>
        <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
          Categories
        </span>
        <div className="mt-2 space-y-1">
          <button
            onClick={() => router.push(buildUrl({ category: null }))}
            className={cn(
              'w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors',
              !categorySlug
                ? 'bg-green-50 text-black font-medium'
                : 'text-gray-600 hover:bg-black-50'
            )}
          >
            All Products
          </button>
          {parentCategories.map((cat) => {
            const children = getChildren(cat.id);
            const isExpanded = collapsedCats[cat.id] !== false;
            const isActive = categorySlug === cat.slug;

            return (
              <Collapsible
                key={cat.id}
                open={isExpanded}
                onOpenChange={(open) =>
                  setCollapsedCats((prev) => ({ ...prev, [cat.id]: open }))
                }
              >
                <div className="flex items-center">
                  <button
                    onClick={() => router.push(buildUrl({ category: cat.slug }))}
                    className={cn(
                      'flex-1 text-left px-2 py-1.5 text-sm rounded-md transition-colors',
                      isActive
                        ? 'bg-green-50 text-green-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {cat.name}
                  </button>
                  {children.length > 0 && (
                    <CollapsibleTrigger asChild>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 text-gray-400 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                  )}
                </div>
                {children.length > 0 && (
                  <CollapsibleContent>
                    <div className="ml-4 space-y-0.5">
                      {children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() =>
                            router.push(buildUrl({ category: child.slug }))
                          }
                          className={cn(
                            'w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors',
                            categorySlug === child.slug
                              ? 'bg-green-50 text-green-600 font-medium'
                              : 'text-gray-500 hover:bg-gray-50'
                          )}
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
          Price Range
        </span>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full h-8 px-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-600"
          />
          <span className="text-gray-400 self-center">-</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full h-8 px-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        </div>
        <Button
          size="sm"
          className="mt-2 w-full h-8 text-xs bg-[#7A1F3D] text-white hover:bg-[#7A1F3D] disabled:bg-gray-200 disabled:text-gray-400"
          onClick={() => {
            const url = buildUrl({
              min: priceMin || null,
              max: priceMax || null,
            });
            router.push(url);
          }}
        >
          Apply Price
        </Button>
      </div>

      <Separator />

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Tags
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  const newTag = tagFilter === tag ? '' : tag;
                  setTagFilter(newTag);
                  router.push(buildUrl({ tag: newTag || null }));
                }}
                className={cn(
                  'px-2 py-1 text-xs rounded-md border transition-colors',
                  tagFilter === tag
                    ? ''
                    : 'text-black'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          {/* Mobile filter button */}
          <div className="md:hidden">
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters

                  {activeFilterCount > 0 && (
                    <Badge className="h-4 min-w-[16px] px-1 bg-green-600 text-white text-[9px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>

                <div className="mt-4">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <h1 className="text-sm font-semibold text-gray-900">
            {categorySlug
              ? categories.find((c) => c.slug === categorySlug)?.name || 'Products'
              : search
                ? `Results for "${search}"`
                : 'All Products'}
          </h1>

          <span className="text-[10px] text-gray-400">
            {products.length} item{products.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Sort dropdown */}
        <Select
          value={sort}
          onValueChange={(value) =>
            router.push(buildUrl({ sort: value, page: '1' }))
          }
        >
          <SelectTrigger className="w-[95px] h-7 px-2 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>

          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <FilterSidebar />
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500">No products found.</p>
              <button
                onClick={clearAllFilters}
                className="mt-3 text-sm text-green-600 hover:text-green-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() =>
                      router.push(buildUrl({ page: (page - 1).toString() }))
                    }
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          router.push(buildUrl({ page: p.toString() }))
                        }
                        className={cn(
                          'h-8 w-8 text-xs p-0',
                          p === page && 'bg-green-600 hover:bg-green-700'
                        )}
                      >
                        {p}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() =>
                      router.push(buildUrl({ page: (page + 1).toString() }))
                    }
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
