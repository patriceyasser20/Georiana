import type { Metadata } from 'next';
import { supabaseClient } from '../../../lib/supabaseClient';
import CategoryPageClient from './CategoryPageClient';

type Props = { params: Promise<{ category: string }> };

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

const humanize = (slug: string) =>
  slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const displayName = humanize(category);

  return {
    title: `Woman — ${displayName}`,
    description: `Shop ${displayName} for women at GEORIANA. Natural fabrics, timeless pieces.`,
    alternates: { canonical: `https://georiana.com/woman/${category}` },
    openGraph: {
      title: `Woman — ${displayName} | GEORIANA`,
      description: `Shop ${displayName} for women at GEORIANA.`,
      url: `https://georiana.com/woman/${category}`,
    },
  };
}

export default async function WomanCategoryPage({ params }: Props) {
  const { category } = await params;
  const displayName = humanize(category);

  const { data } = await supabaseClient
    .from('products')
    .select('id, name, price, images, thumbnail_url, is_on_sale, discount_percentage, category, collection, collection_ar')
    .order('created_at', { ascending: false });

  const filtered = (data || []).filter((p: any) => slugify(p.category) === category);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://georiana.com' },
      { '@type': 'ListItem', position: 2, name: 'Woman', item: 'https://georiana.com/shop' },
      { '@type': 'ListItem', position: 3, name: displayName, item: `https://georiana.com/woman/${category}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryPageClient products={filtered} categorySlug={category} />
    </>
  );
}