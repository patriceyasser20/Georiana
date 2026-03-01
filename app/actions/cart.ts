// app/actions/cart.ts
'use server';


import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../../lib/supabaseServer';

export async function addToCart(productId: string, quantity: number = 1) {
  const supabase = await createSupabaseServerClient();   // ← await added

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Auth error:', userError);
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      {
        user_id: user.id,
        product_id: productId,
        quantity,
      },
      { onConflict: 'user_id, product_id' }
    )
    .select();

  if (error) {
    console.error('Add to cart error:', error);
    throw error;
  }

  revalidatePath('/cart');
  revalidatePath('/');
  return data;
}

export async function updateCartItem(productId: string, quantity: number) {
  const supabase = await createSupabaseServerClient();   // ← await added

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Auth error:', userError);
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('user_id', user.id)
    .eq('product_id', productId);

  if (error) throw error;

  revalidatePath('/cart');
  return true;
}

export async function removeFromCart(productId: string) {
  const supabase = await createSupabaseServerClient();   // ← await added

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Auth error:', userError);
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);

  if (error) throw error;

  revalidatePath('/cart');
  return true;
}

export async function getCart() {
  const supabase = await createSupabaseServerClient();   // ← await added

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Auth error:', userError);
    return [];
  }

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      product:products (
        id,
        name,
        price,
        image_url
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Get cart error:', error);
    throw error;
  }

  return data || [];
}