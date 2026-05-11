import { connectDB } from '../mongodb';
import { Product, Category, SiteSettings } from '../models';
import { cached } from './cache';
import {
  transformProductImages,
  transformCategoryImage,
  transformSettings,
} from './imageTransforms';

const TTL_MS = 60_000;

// For LIST views we only need the first image (the thumbnail). Pulling the
// entire images array for every product can be megabytes of base64 each.
// $slice keeps only the first entry server-side.
const LIST_PROJECTION = {
  name: 1,
  slug: 1,
  short_description: 1,
  category_id: 1,
  price: 1,
  compare_price: 1,
  stock: 1,
  is_active: 1,
  is_featured: 1,
  tags: 1,
  ratings_avg: 1,
  ratings_count: 1,
  created_at: 1,
  images: { $slice: 1 } as unknown as 1,
};

function toPlain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function normalize<T extends { _id?: unknown }>(doc: T): T & { id: string } {
  return { ...doc, id: String(doc._id ?? '') };
}

export async function getSettings() {
  return cached('settings', TTL_MS, async () => {
    await connectDB();
    // Strip heavy text fields we don't need on every page render
    const doc = await SiteSettings.findOne()
      .select('-shipping_policy -return_policy -about_text')
      .lean();
    if (!doc) return null;
    const plain = normalize(toPlain(doc));
    return transformSettings(plain);
  });
}

export async function getActiveCategories() {
  return cached('categories:active', TTL_MS, async () => {
    await connectDB();
    const list = await Category.find({ is_active: true })
      .select('name slug image parent_id is_active sort_order')
      .sort({ sort_order: 1 })
      .lean();
    return (list as unknown[]).map((c) => {
      const plain = normalize(toPlain(c as { _id: unknown }));
      return transformCategoryImage(plain);
    });
  });
}

export async function getFeaturedProducts(limit = 8) {
  return cached(`products:featured:${limit}`, TTL_MS, async () => {
    await connectDB();
    const list = await Product.find({ is_active: true, is_featured: true })
      .select(LIST_PROJECTION)
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    return (list as unknown[]).map((p) => {
      const plain = normalize(toPlain(p as { _id: unknown }));
      return transformProductImages(plain);
    });
  });
}

export async function getNewArrivals(limit = 8) {
  return cached(`products:new:${limit}`, TTL_MS, async () => {
    await connectDB();
    const list = await Product.find({ is_active: true })
      .select(LIST_PROJECTION)
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    return (list as unknown[]).map((p) => {
      const plain = normalize(toPlain(p as { _id: unknown }));
      return transformProductImages(plain);
    });
  });
}
