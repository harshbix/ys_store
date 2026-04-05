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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const listed = await supabase.storage.listBuckets();
  if (listed.error) {
    throw new Error(`Failed to list buckets: ${listed.error.message}`);
  }

  const existing = (listed.data || []).find((bucket) => bucket.name === bucketName || bucket.id === bucketName);
  if (existing) {
    if (existing.public) {
      console.log(`[storage] bucket already exists and is public: ${bucketName}`);
      return;
    }

    const updated = await supabase.storage.updateBucket(bucketName, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
        'image/gif'
      ]
    });

    if (updated.error) {
      throw new Error(`Failed to update bucket ${bucketName}: ${updated.error.message}`);
    }

    console.log(`[storage] bucket updated to public: ${bucketName}`);
    return;
  }

  const created = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif'
    ]
  });

  if (created.error) {
    throw new Error(`Failed to create bucket ${bucketName}: ${created.error.message}`);
  }

  console.log(`[storage] bucket created: ${bucketName}`);
}

main().catch((err) => {
  console.error('[storage] ensure bucket failed:', err.message);
  process.exit(1);
});