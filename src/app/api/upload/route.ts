import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_FOLDERS = ['gallery', 'profiles', 'chat', 'feed', 'documents'];

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/ogg',
  'audio/webm',
  'audio/wav',
  'video/mp4',
  'video/webm',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    const folderInput = (data.get('folder') as string || 'gallery').trim().toLowerCase();

    // 1. Path Traversal & Folder Whitelist Check
    if (!ALLOWED_FOLDERS.includes(folderInput)) {
      return NextResponse.json(
        { error: 'Folder penyimpanan tidak valid atau tidak diizinkan' },
        { status: 400 }
      );
    }

    // 2. Validate file existence
    if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file melebihi batas maksimum 5MB' },
        { status: 400 }
      );
    }

    // 4. Validate MIME Type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipe file '${file.type || 'tidak dikenal'}' tidak didukung` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 5. Generate secure, unique filename
    const originalExt = extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeExt = originalExt || (file.type.startsWith('image/') ? '.webp' : '.dat');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const sanitizedFilename = `${user.id.slice(0, 8)}_${uniqueSuffix}${safeExt}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads', folderInput);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, sanitizedFilename);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${folderInput}/${sanitizedFilename}`,
    });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: 'Gagal memproses unggahan file' }, { status: 500 });
  }
}
