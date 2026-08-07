import type { Metadata } from 'next';
import { supabaseClient } from '../../../lib/supabaseClient';
import CollectionPageClient from './CollectionPageClient';
import { match } from 'assert';

type Props = { params: Promise<{ slug: string }> };

const slugify = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data } = await supabaseClient
    .from('products')
    .select('collection')
    .not('collection', 'is', null);

  const match = (data || []).find((p: any) => slugify(p.collection) === slug);
  const displayName = match?.collection || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    title: `Collection — ${displayName}`,
    description: `Shop the ${displayName} collection at GEORIANA.`,
    alternates: { canonical: `https://georiana.com/collection/${slug}` },
    openGraph: {
      title: `Collection — ${displayName} | GEORIANA`,
      description: `Shop the ${displayName} collection at GEORIANA.`,
      url: `https://georiana.com/collection/${slug}`,
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  
  const { data } = await supabaseClient
    .from('products')
    .select(`
      id, name, price, images, is_on_sale, discount_percentage, category, description, collection,
      product_variants (is_on_sale, discount_percentage)
    `)
    .order('created_at', { ascending: false });

  const filtered = (data || []).filter((p: any) => slugify(p.collection) === slug);
  const displayName = filtered[0]?.collection || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://georiana.com' },
      { '@type': 'ListItem', position: 2, name: displayName, item: `https://georiana.com/collection/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CollectionPageClient
        products={filtered}
        displayName={displayName}
      />
    </>
  );
}