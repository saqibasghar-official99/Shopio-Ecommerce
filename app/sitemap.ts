import type { MetadataRoute } from 'next';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';

const BASE_URL = 'https://veeostore.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB connection is not available');
  }

  const products = await db
    .collection('products')
    .find(
      { is_active: true },
      {
        projection: {
          slug: 1,
          updated_at: 1,
        },
      }
    )
    .toArray();

  const productUrls: MetadataRoute.Sitemap = products
    .filter((product) => product.slug)
    .map((product) => ({
      url: `${BASE_URL}/products/${product.slug}`,
      lastModified: product.updated_at
        ? new Date(product.updated_at)
        : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...productUrls,
  ];
}