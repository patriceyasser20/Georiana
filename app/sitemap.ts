import { MetadataRoute } from 'next';
import { supabaseClient } from '../lib/supabaseClient';

const slugify = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabaseClient
    .from('products')
    .select('id, category, collection, created_at');

  const productUrls = (products || []).map((p) => ({
    url: `https://georiana.com/product/${p.id}`,
    lastModified: p.created_at,
  }));

  // Group products by category/collection slug so each group's
  // lastModified reflects the most recently added product in it —
  // a real signal instead of "now".
  const latestByCategorySlug = new Map<string, string>();
  const latestByCollectionSlug = new Map<string, string>();

  for (const p of products || []) {
    const catSlug = slugify(p.category);
    if (catSlug) {
      const existing = latestByCategorySlug.get(catSlug);
      if (!existing || new Date(p.created_at) > new Date(existing)) {
        latestByCategorySlug.set(catSlug, p.created_at);
      }
    }
    const colSlug = slugify(p.collection);
    if (colSlug) {
      const existing = latestByCollectionSlug.get(colSlug);
      if (!existing || new Date(p.created_at) > new Date(existing)) {
        latestByCollectionSlug.set(colSlug, p.created_at);
      }
    }
  }

  const categoryUrls = [...latestByCategorySlug.entries()].map(([slug, lastModified]) => ({
    url: `https://georiana.com/woman/${slug}`,
    lastModified,
  }));

  const collectionUrls = [...latestByCollectionSlug.entries()].map(([slug, lastModified]) => ({
    url: `https://georiana.com/collection/${slug}`,
    lastModified,
  }));

  // Static pages: no lastModified — an absent value is more honest
  // than a fabricated "just changed" timestamp. Bump these manually
  // (or track real edit dates) if you want per-page freshness signals.
  const staticUrls: MetadataRoute.Sitemap = [
    { url: 'https://georiana.com' },
    { url: 'https://georiana.com/shop' },
    { url: 'https://georiana.com/sale' },
    { url: 'https://georiana.com/about' },
    { url: 'https://georiana.com/contact' },
    { url: 'https://georiana.com/size-guide' },
    { url: 'https://georiana.com/return-exchange' },
    { url: 'https://georiana.com/customer-service' },
    { url: 'https://georiana.com/our-story' },
    { url: 'https://georiana.com/press' },
    { url: 'https://georiana.com/sustainability' },
  ];

  return [...staticUrls, ...categoryUrls, ...collectionUrls, ...productUrls];
}