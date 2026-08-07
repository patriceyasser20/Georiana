import { MetadataRoute } from 'next';
import { supabaseClient } from '../lib/supabaseClient';

const slugify = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

export const revalidate = 3600; // regenerate at most once per hour, not on every crawl hit

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabaseClient
    .from('products')
    .select('id, category, collection, created_at');

  const productUrls = (products || []).map((p) => ({
    url: `https://georiana.com/product/${p.id}`,
    lastModified: p.created_at,
  }));

  // Dedupe categories/collections seen across products, so each only
  // appears once in the sitemap even though many products share one.
  const categorySlugs = [...new Set((products || []).map((p) => slugify(p.category)).filter(Boolean))];
  const collectionSlugs = [...new Set((products || []).map((p) => slugify(p.collection)).filter(Boolean))];

  const categoryUrls = categorySlugs.map((slug) => ({
    url: `https://georiana.com/woman/${slug}`,
    lastModified: new Date(),
  }));

  const collectionUrls = collectionSlugs.map((slug) => ({
    url: `https://georiana.com/collection/${slug}`,
    lastModified: new Date(),
  }));

  const staticUrls = [
    { url: 'https://georiana.com', lastModified: new Date() },
    { url: 'https://georiana.com/shop', lastModified: new Date() },
    { url: 'https://georiana.com/sale', lastModified: new Date() },
    { url: 'https://georiana.com/about', lastModified: new Date() },
    { url: 'https://georiana.com/contact', lastModified: new Date() },
    { url: 'https://georiana.com/size-guide', lastModified: new Date() },
    { url: 'https://georiana.com/return-exchange', lastModified: new Date() },
    { url: 'https://georiana.com/customer-service', lastModified: new Date() },
    { url: 'https://georiana.com/our-story', lastModified: new Date() },
    { url: 'https://georiana.com/press', lastModified: new Date() },
    { url: 'https://georiana.com/sustainability', lastModified: new Date() },
  ];

  return [...staticUrls, ...categoryUrls, ...collectionUrls, ...productUrls];
}