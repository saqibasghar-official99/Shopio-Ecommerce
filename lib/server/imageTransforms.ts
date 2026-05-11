// Replace huge base64 data URLs (stored in MongoDB) with tiny API paths.
// The /api/image/* routes stream the binary on demand with year-long browser
// caching, so the storefront HTML stays small (~KB instead of ~MB).
//
// Pass-through if the value is already a regular URL (http(s)/relative path).

type Anything = Record<string, unknown>;

const isDataUrl = (s: unknown): s is string =>
  typeof s === 'string' && s.startsWith('data:');

export function transformProductImages<T extends Anything>(product: T): T {
  if (!product) return product;
  const slug = product.slug as string | undefined;
  const images = product.images as unknown;
  if (!slug || !Array.isArray(images)) return product;

  const next = images.map((img, i) =>
    isDataUrl(img) ? `/api/image/p/${encodeURIComponent(slug)}/${i}` : img
  );
  return { ...product, images: next };
}

export function transformCategoryImage<T extends Anything>(category: T): T {
  if (!category) return category;
  const image = category.image as unknown;
  const slug = category.slug as string | undefined;
  if (!isDataUrl(image) || !slug) return category;
  return { ...category, image: `/api/image/c/${encodeURIComponent(slug)}` };
}

export function transformSettings<T extends Anything>(settings: T | null): T | null {
  if (!settings) return settings;
  const out: Anything = { ...settings };

  if (isDataUrl(out.logo)) {
    out.logo = '/api/image/logo';
  }

  const banners = out.banners as unknown;
  if (Array.isArray(banners)) {
    out.banners = banners.map((b, i) => {
      if (!b || typeof b !== 'object') return b;
      const banner = b as Anything;
      return {
        ...banner,
        image: isDataUrl(banner.image) ? `/api/image/b/${i}` : banner.image,
      };
    });
  }

  return out as T;
}
