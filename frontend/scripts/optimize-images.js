import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const directoryPath = path.join(process.cwd(), 'public', 'hero');

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }

  files.filter(file => file.endsWith('.jpeg') || file.endsWith('.jpg')).forEach(file => {
    const filePath = path.join(directoryPath, file);
    const outputPath = path.join(directoryPath, file.replace(/\.jpe?g$/, '.webp'));

    sharp(filePath)
      .resize(1200) // maximum width for hero
      .webp({ quality: 80 })
      .toFile(outputPath)
      .then(() => {
        console.log(`Optimized ${file} -> ${path.basename(outputPath)}`);
        // Remove old after successful convert to save space if needed
        // fs.unlinkSync(filePath);
      })
      .catch(err => {
        console.error(`Error optimizing ${file}:`, err);
      });
  });
});