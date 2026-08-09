// app/api/admin-ops/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyAdmin(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token');
  return !!token && !!process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, payload } = await req.json();

  try {
    switch (action) {
      case 'ping': {
        // Used by the admin panel on load purely to confirm the stored
        // token is still valid (a 401 from verifyAdmin() above would have
        // already redirected to login before reaching here).
        return NextResponse.json({ ok: true });
      }
      case 'insert-product': {
        const { data, error } = await supabase.from('products').insert(payload).select().single();
        if (error) throw error;
        return NextResponse.json({ data });
      }
      case 'update-product': {
        const { id, ...rest } = payload;
        const { error } = await supabase.from('products').update(rest).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'delete-product': {
        await supabase.from('product_variants').delete().eq('product_id', payload.id);
        await supabase.from('wishlist').delete().eq('product_id', payload.id);
        const { error } = await supabase.from('products').delete().eq('id', payload.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'insert-variants': {
        const { error } = await supabase.from('product_variants').insert(payload.variants);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'update-variant-discount': {
        const { id, ...rest } = payload;
        const { error } = await supabase.from('product_variants').update(rest).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'restock': {
        const { error } = await supabase.from('product_variants').update({ stock: payload.newStock }).eq('id', payload.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'insert-promo': {
        const { error } = await supabase.from('promo_codes').insert(payload);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'update-promo': {
        const { id, ...rest } = payload;
        const { error } = await supabase.from('promo_codes').update(rest).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'delete-promo': {
        const { error } = await supabase.from('promo_codes').delete().eq('id', payload.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'toggle-country': {
        const { error } = await supabase.from('supported_countries').update({ enabled: payload.enabled }).eq('code', payload.code);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'upsert-shipping-city': {
        const { error } = await supabase.from('free_shipping_cities').upsert(payload);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'get-subscribers': {
        const { data, error } = await supabase
          .from('profiles')
          .select('email, marketing_opt_out')
          .not('email', 'is', null)
          .order('email');
        if (error) throw error;
        return NextResponse.json({ data });
      }
      case 'clear-collection': {
        const { error } = await supabase
          .from('products')
          .update({ collection: null })
          .eq('collection', payload.collection);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      // ── Offers (Buy X Get Y deals) ──────────────────────────────────────
      case 'insert-offer': {
        const { error } = await supabase.from('offers').insert(payload);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'update-offer': {
        const { id, ...rest } = payload;
        const { error } = await supabase.from('offers').update(rest).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'delete-offer': {
        const { error } = await supabase.from('offers').delete().eq('id', payload.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'insert-shipping-city': {
        const { data, error } = await supabase
          .from('free_shipping_cities')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json({ data });
      }
      case 'update-shipping-city': {
        const { id, ...rest } = payload;
        const { error } = await supabase
          .from('free_shipping_cities')
          .update(rest)
          .eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'delete-shipping-city': {
        const { error } = await supabase
          .from('free_shipping_cities')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'toggle-all-shipping-cities': {
        const { countryCode, enable } = payload;
        const { error } = await supabase
          .from('free_shipping_cities')
          .update({ is_free_shipping: enable })
          .eq('country_code', countryCode);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'get-shipping-cities': {
        const { data, error } = await supabase
          .from('free_shipping_cities')
          .select('*')
          .eq('country_code', payload.countryCode)
          .order('city_name');
        if (error) throw error;
        return NextResponse.json({ data });
      }
      case 'seed-shipping-cities': {
        const { data, error } = await supabase
          .from('free_shipping_cities')
          .insert(payload.cities)
          .select();
        if (error) throw error;
        return NextResponse.json({ data });
      }

      // ── Featured products (Home Page tab) ───────────────────────────────
      // These previously went straight through the browser's anon-key
      // Supabase client and were silently blocked by RLS with no error
      // surfaced to the admin — routed through the service role here like
      // every other admin write/read, so toggling a product reliably
      // persists and the admin panel reliably sees what's actually saved.
      case 'get-featured': {
        const { data, error } = await supabase
          .from('featured_products')
          .select('product_id')
          .eq('section', payload.section);
        if (error) throw error;
        return NextResponse.json({ data });
      }
      case 'set-featured': {
        const { productId, section, position } = payload;
        // Upsert instead of plain insert: if a row for this product+section
        // already exists (stale client state, a double-click, or a second
        // admin tab), this becomes a harmless no-op update instead of
        // throwing a unique-constraint error.
        const { error } = await supabase
          .from('featured_products')
          .upsert(
            { product_id: productId, section, position },
            { onConflict: 'product_id,section' }
          );
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'unset-featured': {
        const { productId, section } = payload;
        const { error } = await supabase
          .from('featured_products')
          .delete()
          .eq('product_id', productId)
          .eq('section', section);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'clear-featured': {
        const { error } = await supabase
          .from('featured_products')
          .delete()
          .eq('section', payload.section);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[admin-ops]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}