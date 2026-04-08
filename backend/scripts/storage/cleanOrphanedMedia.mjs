// backend/scripts/storage/cleanOrphanedMedia.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'media';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log(`[STORAGE RESET] Auditing files in bucket: "${bucketName}"`);
  
  // Products have been wiped from DB. We should remove all product-related images.
  // We'll safely wipe all items in the products/ folder inside the bucket.
  
  try {
    const { data: files, error: listError } = await supabase.storage.from(bucketName).list('products', {
      limit: 1000,
      offset: 0
    });

    if (listError) {
      console.error('[ERROR] Failed to list files in products/:', listError.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log('[OK] No demo images found in products/. Product media is completely clean.');
      return;
    }

    console.log(`[INFO] Found ${files.length} orphaned product images. Initiating flush...`);

    const pathsToDelete = files.map((file) => `products/${file.name}`);
    const { error: removeError, data: removed } = await supabase.storage.from(bucketName).remove(pathsToDelete);

    if (removeError) {
      console.error('[ERROR] Failed to remove product images:', removeError.message);
    } else {
      console.log(`[OK] Successfully deleted ${removed?.length || 0} orphaned demo product images.`);
    }

    console.log('[STORAGE RESET] Storage completely primed for production uploads.');
  } catch (e) {
    console.error('[FATAL ERROR]', e);
  }
}

run();
