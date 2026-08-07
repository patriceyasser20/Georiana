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

  const { data } = await supabaseClient
    .from('products')
    .select('id, name, price, images, is_on_sale, discount_percentage, category, collection, collection_ar, product_variants ( is_on_sale, discount_percentage )')
    .order('created_at', { ascending: false });

  const filtered = (data || []).filter((p: any) => slugify(p.category) === category);

  return <CategoryPageClient products={filtered} categorySlug={category} />;
}