import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseClient } from '../../../lib/supabaseClient';
import ProductDetailClient from './ProductDetailClient';

type Props = { params: Promise<{ id: string }> };


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: product } = await supabaseClient
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product) return { title: 'Product Not Found' };

  const description = product.description
    ? product.description.slice(0, 155)
    : `Shop ${product.name} at GEORIANA.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `https://georiana.com/product/${product.id}` },
    openGraph: {
      title: product.name,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      url: `https://georiana.com/product/${product.id}`,
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  const [{ data: product }, { data: variants }, { data: reviews }] = await Promise.all([
    supabaseClient.from('products').select('*').eq('id', id).single(),
    supabaseClient.from('product_variants').select('*').eq('product_id', id),
    supabaseClient
      .from('product_reviews')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!product) notFound();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://georiana.com' },
      ...(product.category
        ? [{
            '@type': 'ListItem',
            position: 2,
            name: product.category,
            item: `https://georiana.com/woman/${product.category.toLowerCase().replace(/\s+/g, '-')}`,
          }]
        : []),
      {
        '@type': 'ListItem',
        position: product.category ? 3 : 2,
        name: product.name,
        item: `https://georiana.com/product/${product.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient
        initialProduct={product}
        initialVariants={variants || []}
        initialReviews={reviews || []}
      />
    </>
  );
}