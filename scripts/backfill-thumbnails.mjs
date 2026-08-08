import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'product-images';

async function makeThumb(imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const thumbBuf = await sharp(buf)
    .resize({ width: 400, withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  const fileName = `thumb-backfill-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, thumbBuf, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

async function run() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, images, thumbnail_url')
    .is('thumbnail_url', null);

  if (error) throw error;
  console.log(`${products.length} products need a thumbnail`);

  for (const p of products) {
    const firstImage = p.images?.[0];
    if (!firstImage) continue;

    try {
      const thumbUrl = await makeThumb(firstImage);
      const { error: updateError } = await supabase
        .from('products')
        .update({ thumbnail_url: thumbUrl })
        .eq('id', p.id);
      if (updateError) throw updateError;
      console.log(`✅ ${p.id}`);
    } catch (err) {
      console.error(`❌ ${p.id}:`, err.message);
    }
  }
}

run();