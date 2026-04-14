import { env } from '../../config/env.js';
import { createSignedUploadUrl } from './repository.js';
import { getPublicUrl } from './repository.js';
import { insertShopMedia } from './repository.js';

// This controller compresses, enforces size, uploads to storage, and returns only metadata
export async function uploadImageController(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    if (req.file.size > 1.5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Compressed image exceeds 1.5MB limit.' });
    }

    // Generate storage path
    const fileName = req.file.originalname || 'image.jpg';
    const path = `shop/original/${Date.now()}-${fileName.toLowerCase().replace(/[^a-z0-9._-]/g, '-')}`;
    // Get signed upload URL
    const signed = await createSignedUploadUrl(env.supabaseStorageBucket, path);
    if (signed.error) throw { status: 500, code: 'media_signed_url_failed', message: signed.error.message };

    // Upload to Supabase Storage (using fetch)
    const uploadRes = await fetch(signed.data.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': req.file.mimetype,
        'x-upsert': 'true',
      },
      body: req.file.buffer,
    });
    if (!uploadRes.ok) {
      return res.status(500).json({ error: 'Failed to upload image to storage.' });
    }

    // Get public URL
    const publicUrl = getPublicUrl(env.supabaseStorageBucket, path).data.publicUrl;

    // Save metadata to DB
    const dbRes = await insertShopMedia({
      original_url: publicUrl,
      thumb_url: publicUrl, // For now, use same for thumb/full
      full_url: publicUrl,
      width: req.file.width || null,
      height: req.file.height || null,
      size_bytes: req.file.size,
      caption: req.body.caption || null,
      is_visible: true,
      sort_order: 0,
    });
    if (dbRes.error) throw { status: 500, code: 'shop_media_upload_failed', message: dbRes.error.message };

    return res.json({
      url: publicUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
      media: dbRes.data,
      message: 'Image uploaded, compressed, and metadata saved.',
    });
  } catch (err) {
    next(err);
  }
}