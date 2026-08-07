import { MetadataRoute } from 'next';
import { supabaseClient } from '../lib/supabaseClient';

const slugify = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

export const revalidate = 3600;

const SITE = 'https://georiana.com';

function withLocales(path: string, lastModified: string | Date) {
  const enUrl = path === '/' ? SITE : `${SITE}${path}`;
  const arUrl = path === '/' ? `${SITE}/ar` : `${SITE}/ar${path}`;
  const alternates = { languages: { en: enUrl, ar: arUrl } };
  return [
    { url: enUrl, lastModified, alternates },
    { url: arUrl, lastModified, alternates },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabaseClient
    .from('products')
    .select('id, category, collection, created_at');

  const productUrls = (products || []).flatMap((p) =>
    withLocales(`/product/${p.id}`, p.created_at)
  );

  const categorySlugs = [...new Set((products || []).map((p) => slugify(p.category)).filter(Boolean))];
  const collectionSlugs = [...new Set((products || []).map((p) => slugify(p.collection)).filter(Boolean))];

  const categoryUrls = categorySlugs.flatMap((slug) => withLocales(`/woman/${slug}`, new Date()));
  const collectionUrls = collectionSlugs.flatMap((slug) => withLocales(`/collection/${slug}`, new Date()));

  const staticPaths = [
    '/', '/shop', '/sale', '/about', '/contact', '/size-guide',
    '/return-exchange', '/customer-service', '/our-story', '/press', '/sustainability',
  ];
  const staticUrls = staticPaths.flatMap((p) => withLocales(p, new Date()));

  return [...staticUrls, ...categoryUrls, ...collectionUrls, ...productUrls];
}