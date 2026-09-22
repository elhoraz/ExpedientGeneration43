import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// In-memory cache for temporary download buffers (15-minute TTL)
interface CachedFile {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  createdAt: number;
}

const tempDownloadCache = new Map<string, CachedFile>();

// Clean up expired cache entries periodically
function purgeExpiredCache() {
  const now = Date.now();
  const maxAge = 15 * 60 * 1000; // 15 minutes
  for (const [id, item] of tempDownloadCache.entries()) {
    if (now - item.createdAt > maxAge) {
      tempDownloadCache.delete(id);
    }
  }
}

/**
 * POST /api/photobooth/download
 * Receives file/dataUrl, stores in Supabase Storage and temp cache,
 * returns absolute HTTPS GET download URL that Android WebView can intercept natively.
 */
export async function POST(req: NextRequest) {
  try {
    purgeExpiredCache();

    let buffer: Buffer | null = null;
    let mimeType = "image/png";
    let filename = `Expedient_Photostrip_${Date.now()}.png`;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const dataUrl = formData.get("dataUrl") as string | null;
      const customFilename = formData.get("filename") as string | null;

      if (customFilename) filename = customFilename;

      if (file && typeof file.arrayBuffer === "function") {
        const arrayBuf = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        mimeType = file.type || (filename.endsWith(".mp4") ? "video/mp4" : "image/png");
      } else if (dataUrl) {
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          buffer = Buffer.from(match[2], "base64");
        }
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      const dataUrl = body.dataUrl || "";
      if (body.filename) filename = body.filename;

      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        buffer = Buffer.from(match[2], "base64");
      }
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: "Missing or invalid file data" }, { status: 400 });
    }

    // Clean safe filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Store in in-memory cache for GET route
    tempDownloadCache.set(uniqueId, {
      buffer,
      mimeType,
      filename: safeFilename,
      createdAt: Date.now(),
    });

    let supabaseDownloadUrl = "";

    // Attempt to upload to Supabase Storage bucket
    try {
      const admin = createAdminClient();
      const storagePath = `photobooth/${uniqueId}_${safeFilename}`;
      let bucket = "gallery";

      let { error: uploadError } = await admin.storage
        .from(bucket)
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        // Fallback to profile-photos bucket which is guaranteed to exist
        bucket = "profile-photos";
        const fallbackRes = await admin.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });
        uploadError = fallbackRes.error;
      }

      if (!uploadError) {
        const { data: publicUrlData } = admin.storage
          .from(bucket)
          .getPublicUrl(storagePath);

        // Appending ?download= forces Supabase CDN to return Content-Disposition: attachment
        supabaseDownloadUrl = `${publicUrlData.publicUrl}?download=${encodeURIComponent(safeFilename)}`;
      } else {
        console.warn("Supabase storage upload warning:", uploadError?.message);
      }
    } catch (storageErr) {
      console.warn("Supabase upload exception:", storageErr);
    }

    // Origin host for fallback absolute URL
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const fallbackGetUrl = `${proto}://${host}/api/photobooth/download?id=${uniqueId}`;

    return NextResponse.json({
      success: true,
      id: uniqueId,
      downloadUrl: supabaseDownloadUrl || fallbackGetUrl,
      fallbackUrl: fallbackGetUrl,
      filename: safeFilename,
    });
  } catch (error: any) {
    console.error("Photobooth POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /api/photobooth/download?id=...&url=...
 * Serves binary payload with Content-Disposition: attachment.
 * This is the standard HTTPS GET request that Android WebView's DownloadListener intercepts!
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const remoteUrl = searchParams.get("url");
    const customFilename = searchParams.get("filename") || "Expedient_Photostrip.png";

    // 1. Check in-memory cache
    if (id && tempDownloadCache.has(id)) {
      const cached = tempDownloadCache.get(id)!;
      const safeName = cached.filename || customFilename;

      return new NextResponse(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          "Content-Type": cached.mimeType,
          "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
          "Content-Length": cached.buffer.length.toString(),
          "Cache-Control": "public, max-age=3600, must-revalidate",
        },
      });
    }

    // 2. Proxy remote URL with attachment header if provided
    if (remoteUrl) {
      const remoteRes = await fetch(remoteUrl);
      if (remoteRes.ok) {
        const arrayBuf = await remoteRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const mimeType = remoteRes.headers.get("content-type") || "application/octet-stream";
        const safeName = customFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
            "Content-Length": buffer.length.toString(),
            "Cache-Control": "public, max-age=3600, must-revalidate",
          },
        });
      }
    }

    return new NextResponse("File not found or expired. Silakan render ulang foto.", { status: 404 });
  } catch (error: any) {
    console.error("Photobooth GET error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
