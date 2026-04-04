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

const allowedMimeToExt = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif'
};

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64'
);

function isCanonical(url) {
  return typeof url === 'string' && url.startsWith(publicPrefix);
}

function guessExtFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.toLowerCase().match(/\.([a-z0-9]+)(?:\?|#|$)/);
  if (!match) return null;

  const ext = match[1];
  if (ext === 'jpeg') return 'jpg';
  if (['jpg', 'png', 'webp', 'avif', 'gif'].includes(ext)) return ext;
  return null;
}

function extToMime(ext) {
  switch (ext) {
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/png';
  }
}

async function fetchImagePayload(url) {
  if (!url || typeof url !== 'string') {
    return {
      buffer: onePixelPng,
      contentType: 'image/png',
      source: 'fallback_empty'
    };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Fetch failed with ${response.status}`);
    }

    const rawType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const allowed = Object.prototype.hasOwnProperty.call(allowedMimeToExt, rawType);
    const contentType = allowed ? rawType : extToMime(guessExtFromUrl(url) || 'png');
    const arr = await response.arrayBuffer();

    return {
      buffer: Buffer.from(arr),
      contentType,
      source: 'fetched'
    };
  } catch {
    return {
      buffer: onePixelPng,
      contentType: 'image/png',
      source: 'fallback_fetch_failed'
    };
  }
}

function outPath(name) {
  const dir = path.resolve('reports');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, name);
}

async function main() {
  const productMediaRes = await supabase
    .from('product_media')
    .select('id,product_id,original_url,thumb_url,full_url')
    .order('id', { ascending: true });

  if (productMediaRes.error) {
    throw new Error(`Failed to query product_media: ${productMediaRes.error.message}`);
  }

  const rows = productMediaRes.data || [];
  const targets = rows.filter((row) => {
    return !isCanonical(row.original_url) || !isCanonical(row.thumb_url) || !isCanonical(row.full_url);
  });

  console.log(`[storage-normalize] found ${targets.length} non-canonical product_media rows.`);

  const changed = [];
  const errors = [];
  const startedAt = Date.now();

  for (const row of targets) {
    try {
      const payloads = {
        original_url: await fetchImagePayload(row.original_url),
        thumb_url: await fetchImagePayload(row.thumb_url),
        full_url: await fetchImagePayload(row.full_url)
      };

      const pathSeed = `normalized/product_media/${row.id}/${Date.now()}`;
      const uploaded = {};

      for (const [field, payload] of Object.entries(payloads)) {
        const ext = allowedMimeToExt[payload.contentType] || 'png';
        const objectPath = `${pathSeed}-${field}.${ext}`;
        const up = await supabase.storage.from(bucketName).upload(objectPath, payload.buffer, {
          upsert: true,
          contentType: payload.contentType
        });

        if (up.error) {
          throw new Error(`Failed uploading ${field} for ${row.id}: ${up.error.message}`);
        }

        const pub = supabase.storage.from(bucketName).getPublicUrl(objectPath);
        uploaded[field] = {
          object_path: objectPath,
          public_url: pub.data.publicUrl,
          source: payload.source,
          content_type: payload.contentType
        };
      }

      const updatePayload = {
        original_url: uploaded.original_url.public_url,
        thumb_url: uploaded.thumb_url.public_url,
        full_url: uploaded.full_url.public_url
      };

      const updateRes = await supabase
        .from('product_media')
        .update(updatePayload)
        .eq('id', row.id)
        .select('id,product_id,original_url,thumb_url,full_url')
        .single();

      if (updateRes.error) {
        throw new Error(`Failed updating row ${row.id}: ${updateRes.error.message}`);
      }

      changed.push({
        id: row.id,
        product_id: row.product_id,
        previous: {
          original_url: row.original_url || null,
          thumb_url: row.thumb_url || null,
          full_url: row.full_url || null
        },
        current: {
          original_url: updateRes.data.original_url,
          thumb_url: updateRes.data.thumb_url,
          full_url: updateRes.data.full_url
        },
        uploads: uploaded
      });
    } catch (error) {
      errors.push({
        id: row.id,
        product_id: row.product_id,
        message: error.message
      });
    }
  }

  const summary = {
    generated_at: new Date().toISOString(),
    bucket: bucketName,
    public_prefix: publicPrefix,
    total_rows_scanned: rows.length,
    targeted_rows: targets.length,
    changed_rows: changed.length,
    failed_rows: errors.length,
    duration_ms: Date.now() - startedAt
  };

  const report = { summary, changed, errors };
  const reportPath = outPath(`storage-normalization-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('[storage-normalize] summary:', summary);
  console.log(`[storage-normalize] report written: ${reportPath}`);

  if (errors.length > 0) {
    console.error('[storage-normalize] completed with failures.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[storage-normalize] failed:', err.message);
  process.exit(1);
});