import fs from 'fs';
import path from 'path';
import { compressImage } from './compress.js';

async function testCompression() {
  const inputPath = path.resolve('./test-image.jpg'); // Place a test image here
  const outputPath = path.resolve('./test-image-compressed.jpg');
  if (!fs.existsSync(inputPath)) {
    console.error('Test image not found:', inputPath);
    process.exit(1);
  }
  const buffer = fs.readFileSync(inputPath);
  const compressed = await compressImage(buffer, 'image/jpeg');
  fs.writeFileSync(outputPath, compressed);
  console.log('Original size:', buffer.length, 'bytes');
  console.log('Compressed size:', compressed.length, 'bytes');
  console.log('Compressed image saved to:', outputPath);
}

testCompression();
