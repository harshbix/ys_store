import { supabase } from '../../src/lib/supabase.js';

const runtimePrefix = 'Runtime';
const dryRun = process.argv.includes('--dry-run');

async function deleteByProductIds(table, column, ids) {
  const result = await supabase.from(table).delete().in(column, ids);
  if (result.error) {
    throw new Error(`[${table}] ${result.error.message}`);
  }
  return result;
}

async function main() {
  const runtimeProducts = await supabase
    .from('products')
    .select('id,title,sku,created_at')
    .ilike('title', `${runtimePrefix}%`)
    .order('created_at', { ascending: false });

  if (runtimeProducts.error) {
    throw new Error(`Lookup failed: ${runtimeProducts.error.message}`);
  }

  const rows = runtimeProducts.data || [];
  if (!rows.length) {
    console.log('No Runtime-prefixed products found.');
    return;
  }

  console.log(`Found ${rows.length} Runtime-prefixed products:`);
  for (const row of rows) {
    console.log(`- ${row.id} | ${row.sku} | ${row.title}`);
  }

  if (dryRun) {
    console.log('Dry run enabled. No records deleted.');
    return;
  }

  const productIds = rows.map((row) => row.id);

  // Delete dependent rows on non-cascading references first.
  await deleteByProductIds('analytics_events', 'product_id', productIds);
  await deleteByProductIds('cart_items', 'product_id', productIds);
  await deleteByProductIds('quote_items', 'ref_product_id', productIds);

  const deletedProducts = await supabase.from('products').delete().in('id', productIds);
  if (deletedProducts.error) {
    throw new Error(`Product delete failed: ${deletedProducts.error.message}`);
  }

  const remaining = await supabase
    .from('products')
    .select('id,title')
    .ilike('title', `${runtimePrefix}%`);

  if (remaining.error) {
    throw new Error(`Post-delete verification failed: ${remaining.error.message}`);
  }

  const left = remaining.data || [];
  if (left.length) {
    console.log(`WARNING: ${left.length} Runtime-prefixed products still remain.`);
    for (const row of left) {
      console.log(`- ${row.id} | ${row.title}`);
    }
  } else {
    console.log('Runtime cleanup complete: no Runtime-prefixed products remain.');
  }
}

await main();
