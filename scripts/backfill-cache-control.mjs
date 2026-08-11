// scripts/backfill-cache-control.mjs
//
// Re-uploads every existing object in the `product-images` bucket in place,
// this time with a long Cache-Control header. Needed because Supabase
// Storage has no "just patch the metadata" endpoint — the only way to
// change an existing object's Cache-Control is to overwrite it with
// `.update()`, which re-uploads the same bytes to the same path under a
// new cacheControl setting. Safe to re-run: it skips anything already
// correctly headered.
//
// Run from the project root:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-cache-control.mjs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'product-images';
const TARGET_CACHE_CONTROL = '31536000'; // 1 year — filenames are unique per upload, content never changes
const PAGE_SIZE = 100;

async function listAllObjects() {
  const all = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } });

    if (error) throw error;
    if (!data || data.length === 0) break;

    // Skip folder placeholder entries (id === null means it's a "directory")
    all.push(...data.filter((obj) => obj.id !== null));

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

function needsFix(obj) {
  // Supabase's list() returns metadata.cacheControl for each object when
  // available. If it's missing or not our target value, it needs re-upload.
  const current = obj.metadata?.cacheControl;
  return current !== `max-age=${TARGET_CACHE_CONTROL}`;
}

async function refreshCacheControl(objName) {
  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(objName);

  if (downloadError) throw downloadError;

  const { error: updateError } = await supabase.storage
    .from(BUCKET)
    .update(objName, fileBlob, {
      cacheControl: TARGET_CACHE_CONTROL,
      upsert: true,
    });

  if (updateError) throw updateError;
}

async function run() {
  console.log('Listing objects in bucket...');
  const objects = await listAllObjects();
  console.log(`Found ${objects.length} objects total`);

  const toFix = objects.filter(needsFix);
  console.log(`${toFix.length} objects need a Cache-Control refresh`);

  let done = 0;
  let failed = 0;

  for (const obj of toFix) {
    try {
      await refreshCacheControl(obj.name);
      done++;
      console.log(`✅ ${obj.name}`);
    } catch (err) {
      failed++;
      console.error(`❌ ${obj.name}:`, err.message || err);
    }
  }

  console.log(`\nDone. Fixed: ${done}, Failed: ${failed}, Already correct: ${objects.length - toFix.length}`);
}

run();
