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

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[admin-ops]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}