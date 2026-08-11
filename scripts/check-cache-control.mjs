// scripts/check-cache-control.mjs
//
// Read-only audit — lists every object in the bucket and reports its
// current Cache-Control metadata, without downloading or modifying
// anything. Run this before AND after backfill-cache-control.mjs to
// confirm the fix actually took effect.
//
// Run from the project root:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/check-cache-control.mjs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'product-images';
const PAGE_SIZE = 100;
const TARGET = 'max-age=31536000';

async function listAllObjects() {
  const all = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } });

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...data.filter((obj) => obj.id !== null));

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

async function run() {
  const objects = await listAllObjects();
  console.log(`Found ${objects.length} objects\n`);

  let correct = 0;
  let wrong = 0;
  let unknown = 0;

  for (const obj of objects) {
    const cc = obj.metadata?.cacheControl;
    if (!cc) {
      unknown++;
      console.log(`❓ ${obj.name} — no cacheControl in metadata`);
    } else if (cc === TARGET) {
      correct++;
      console.log(`✅ ${obj.name} — ${cc}`);
    } else {
      wrong++;
      console.log(`⚠️  ${obj.name} — ${cc} (expected ${TARGET})`);
    }
  }

  console.log(`\nSummary: ${correct} correct, ${wrong} wrong, ${unknown} unknown, ${objects.length} total`);
}

run();
