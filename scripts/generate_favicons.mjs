import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateFavicons() {
  const sourceImage = path.resolve('public/images/logo-utuh.webp');
  console.log('Source:', sourceImage);

  const metadata = await sharp(sourceImage).metadata();
  console.log('Metadata:', metadata);

  // Generate PNGs at multiple sizes
  const sizes = [16, 32, 48, 64, 180, 192, 512];
  
  for (const size of sizes) {
    const outPng = path.resolve(`public/icon-${size}.png`);
    await sharp(sourceImage)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPng);
    console.log(`Generated: public/icon-${size}.png`);
  }

  // Generate apple-touch-icon.png
  await sharp(sourceImage)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));

  await sharp(sourceImage)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.resolve('src/app/apple-icon.png'));

  // Generate src/app/icon.png
  await sharp(sourceImage)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.resolve('src/app/icon.png'));

  // Generate standard favicon.ico
  // An ICO file can contain multiple PNG or BMP sub-images (16x16, 32x32, 48x48)
  // Standard ICO header:
  // 0-1: reserved (0)
  // 2-3: image type (1 for ico)
  // 4-5: number of images
  const icoSizes = [16, 32, 48];
  const pngBuffers = [];
  for (const s of icoSizes) {
    const buf = await sharp(sourceImage)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push({ size: s, buffer: buf });
  }

  // Construct standard ICO binary
  const count = pngBuffers.length;
  const headerSize = 6 + (16 * count);
  let currentOffset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // count

  const directoryEntries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 0); // width
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // size of image data
    entry.writeUInt32LE(currentOffset, 12); // offset
    directoryEntries.push(entry);
    currentOffset += item.buffer.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    ...directoryEntries,
    ...pngBuffers.map(p => p.buffer)
  ]);

  fs.writeFileSync(path.resolve('public/favicon.ico'), icoBuffer);
  fs.writeFileSync(path.resolve('src/app/favicon.ico'), icoBuffer);
  console.log('Successfully generated public/favicon.ico and src/app/favicon.ico, total size:', icoBuffer.length);
}

generateFavicons().catch(console.error);
