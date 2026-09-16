import sharp from 'sharp';

export interface ConvertToWebpOptions {
  quality?: number;      // default: 85
  maxWidth?: number;     // default: 1920
  maxHeight?: number;    // default: 1920
  effort?: number;       // default: 4 (balance between speed & compression)
  lossless?: boolean;    // default: false
}

export interface ConvertResult {
  buffer: Buffer;
  contentType: string;
  ext: string;
  isConverted: boolean;
  width?: number;
  height?: number;
  size: number;
}

/**
 * Otomatis mengonversi buffer gambar (JPEG, PNG, BMP, TIFF, GIF) menjadi WebP modern.
 * Jika file bukan gambar (audio, video, dokumen), mengembalikan buffer dan MIME asli.
 */
export async function convertImageToWebp(
  inputBuffer: Buffer,
  mimeType?: string,
  options: ConvertToWebpOptions = {}
): Promise<ConvertResult> {
  const {
    quality = 85,
    maxWidth = 1920,
    maxHeight = 1920,
    effort = 4,
    lossless = false,
  } = options;

  // Cek apakah MIME type atau konten adalah gambar yang didukung
  const isImage = mimeType
    ? mimeType.startsWith('image/') && !mimeType.includes('svg')
    : true;

  if (!isImage) {
    return {
      buffer: inputBuffer,
      contentType: mimeType || 'application/octet-stream',
      ext: '',
      isConverted: false,
      size: inputBuffer.length,
    };
  }

  try {
    const pipeline = sharp(inputBuffer);
    const metadata = await pipeline.metadata();

    if (!metadata.format) {
      return {
        buffer: inputBuffer,
        contentType: mimeType || 'application/octet-stream',
        ext: '',
        isConverted: false,
        size: inputBuffer.length,
      };
    }

    // Auto-rotate berdasarkan EXIF orientation
    let transformer = pipeline.rotate();

    // Batasi dimensi maksimal tanpa distorsi/pembesaran paksa
    if (
      (metadata.width && metadata.width > maxWidth) ||
      (metadata.height && metadata.height > maxHeight)
    ) {
      transformer = transformer.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Konversi langsung ke WebP
    const webpBuffer = await transformer
      .webp({
        quality,
        effort,
        lossless,
      })
      .toBuffer();

    const outputMeta = await sharp(webpBuffer).metadata();

    return {
      buffer: webpBuffer,
      contentType: 'image/webp',
      ext: '.webp',
      isConverted: true,
      width: outputMeta.width,
      height: outputMeta.height,
      size: webpBuffer.length,
    };
  } catch (err) {
    console.warn('[convertImageToWebp] Gagal mengonversi ke WebP, menggunakan file asli:', err);
    return {
      buffer: inputBuffer,
      contentType: mimeType || 'image/jpeg',
      ext: '.jpg',
      isConverted: false,
      size: inputBuffer.length,
    };
  }
}
