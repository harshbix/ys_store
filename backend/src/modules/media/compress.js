import sharp from 'sharp';
import { extname } from 'path';

/**
 * Compress and resize an image buffer to ensure it is <= 1.5MB and optimized for web.
 * @param {Buffer} buffer - The original image buffer
 * @param {string} mimeType - The image MIME type (e.g., 'image/jpeg', 'image/png')
 * @returns {Promise<Buffer>} - The optimized image buffer
 */
export async function compressImage(buffer, mimeType) {
  let format = 'jpeg';
  if (mimeType === 'image/png') format = 'png';
  if (mimeType === 'image/webp') format = 'webp';

  let quality = 80;
  let output = buffer;
  let sizeLimit = 1.5 * 1024 * 1024; // 1.5MB

  // Try compressing and resizing until under size limit or quality threshold
  for (let i = 0; i < 5; i++) {
    let sharpInstance = sharp(buffer).rotate();
    if (format === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality });
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    }
    output = await sharpInstance.toBuffer();
    if (output.length <= sizeLimit || quality < 40) break;
    quality -= 10;
  }
  // If still too large, resize down
  while (output.length > sizeLimit) {
    const image = sharp(output);
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) break;
    const newWidth = Math.floor(metadata.width * 0.9);
    const newHeight = Math.floor(metadata.height * 0.9);
    output = await image.resize(newWidth, newHeight).toBuffer();
    if (newWidth < 300 || newHeight < 300) break;
  }
  return output;
}
