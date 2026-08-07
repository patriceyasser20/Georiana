import { MetadataRoute } from 'next';
import { supabaseClient } from '../lib/supabaseClient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabaseClient.from('products').select('id, created_at');

  const productUrls = (products || []).map((p) => ({
    url: `https://georiana.com/product/${p.id}`,
    lastModified: p.created_at,
  }));

  const staticUrls = [
    { url: 'https://georiana.com', lastModified: new Date() },
    { url: 'https://georiana.com/shop', lastModified: new Date() },
    { url: 'https://georiana.com/sale', lastModified: new Date() },
    { url: 'https://georiana.com/about', lastModified: new Date() },
    { url: 'https://georiana.com/contact', lastModified: new Date() },
  ];

  return [...staticUrls, ...productUrls];
}