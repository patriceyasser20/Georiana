import type { Metadata } from 'next';
import { supabaseClient } from '../../lib/supabaseClient';
import ShopPageClient from './ShopPageClient';

export const metadata: Metadata = {
  title: 'Shop All',
  description: 'Browse the full GEORIANA collection — dresses, tops, jeans, jackets and more. Natural fabrics, timeless pieces.',
  alternates: { canonical: 'https://georiana.com/shop' },
  openGraph: {
    title: 'Shop All | GEORIANA',
    description: 'Browse the full GEORIANA collection — dresses, tops, jeans, jackets and more.',
    url: 'https://georiana.com/shop',
  },
};

export default async function Shop() {
  const [{ data: products }, { data: offers }] = await Promise.all([
    supabaseClient
      .from('products')
      .select('id, name, name_ar, price, images, thumbnail_url, is_on_sale, discount_percentage, category, collection, collection_ar')
      .order('created_at', { ascending: false }),
    supabaseClient
      .from('offers')
      .select('*')
      .eq('is_active', true),
  ]);

  return <ShopPageClient initialProducts={products || []} initialOffers={offers || []} />;
}