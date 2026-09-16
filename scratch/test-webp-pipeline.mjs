import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { convertImageToWebp } from '../src/lib/image/convertToWebp.ts';

async function testPipeline() {
  console.log('Testing convertImageToWebp pipeline...');

  // Create a sample 800x600 PNG in memory
  const testPngBuffer = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 4,
      background: { r: 255, g: 100, b: 50, alpha: 1 }
    }
  }).png().toBuffer();

  console.log(`Sample PNG created, size: ${testPngBuffer.length} bytes`);

  const result = await convertImageToWebp(testPngBuffer, 'image/png', { quality: 85 });

  console.log('Conversion result:');
  console.log(` - isConverted: ${result.isConverted}`);
  console.log(` - contentType: ${result.contentType}`);
  console.log(` - ext: ${result.ext}`);
  console.log(` - dimensions: ${result.width}x${result.height}`);
  console.log(` - original size: ${testPngBuffer.length} bytes`);
  console.log(` - webp size: ${result.size} bytes`);

  if (!result.isConverted || result.contentType !== 'image/webp' || result.ext !== '.webp') {
    throw new Error('WebP conversion pipeline test failed!');
  }

  // Also test non-image buffer (e.g. text/plain or audio/mpeg)
  const dummyAudio = Buffer.from('RIFF....WAVEfmt ');
  const audioResult = await convertImageToWebp(dummyAudio, 'audio/wav');
  console.log('\nTesting non-image bypass:');
  console.log(` - isConverted: ${audioResult.isConverted} (expected false)`);
  console.log(` - contentType: ${audioResult.contentType} (expected audio/wav)`);

  if (audioResult.isConverted || audioResult.contentType !== 'audio/wav') {
    throw new Error('Non-image bypass failed!');
  }

  console.log('\nALL CONVERSION PIPELINE TESTS PASSED SUCCESSFULLY!');
}

testPipeline().catch(err => {
  console.error(err);
  process.exit(1);
});
