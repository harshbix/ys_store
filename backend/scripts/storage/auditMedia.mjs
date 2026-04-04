import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_STORAGE_BUCKET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET;

const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${bucketName}/`;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function isSupabaseBucketUrl(url) {
  return typeof url === 'string' && url.startsWith(publicPrefix);
}

function rowIssues(row, ownerType) {
  const checks = [
    ['original_url', row.original_url],
    ['thumb_url', row.thumb_url],
    ['full_url', row.full_url]
  ];

  const issues = [];
  for (const [key, value] of checks) {
    if (!value) {
      issues.push({ field: key, type: 'missing_url' });
      continue;
    }

    if (!isSupabaseBucketUrl(value)) {
      issues.push({ field: key, type: 'external_or_mismatched_bucket', value });
    }
  }

  if (issues.length === 0) return null;

  return {
    owner_type: ownerType,
    id: row.id,
    product_id: row.product_id || null,
    issues
  };
}

async function fetchRows(tableName) {
  const result = await supabase.from(tableName).select('id,product_id,original_url,thumb_url,full_url');
  if (result.error) {
    throw new Error(`Failed to query ${tableName}: ${result.error.message}`);
  }
  return result.data || [];
}

async function main() {
  const [productMedia, shopMedia] = await Promise.all([
    fetchRows('product_media'),
    fetchRows('shop_media')
  ]);

  const findings = [
    ...productMedia.map((row) => rowIssues(row, 'product')).filter(Boolean),
    ...shopMedia.map((row) => rowIssues(row, 'shop')).filter(Boolean)
  ];

  const summary = {
    generated_at: new Date().toISOString(),
    bucket: bucketName,
    public_prefix: publicPrefix,
    total_product_media_rows: productMedia.length,
    total_shop_media_rows: shopMedia.length,
    rows_with_issues: findings.length
  };

  console.log('[storage-audit] summary:', summary);

  const outDir = path.resolve('reports');
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `storage-audit-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ summary, findings }, null, 2), 'utf8');

  console.log(`[storage-audit] detailed report written: ${outPath}`);

  if (findings.length > 0) {
    console.log('[storage-audit] found rows that are not using canonical Supabase bucket URLs.');
  } else {
    console.log('[storage-audit] all media rows are canonical for the configured bucket.');
  }
}

main().catch((err) => {
  console.error('[storage-audit] failed:', err.message);
  process.exit(1);
});