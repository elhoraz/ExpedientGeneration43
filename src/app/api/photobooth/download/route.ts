import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    let dataUrl = "";
    let filename = "Expedient_Photostrip.png";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      dataUrl = body.dataUrl || "";
      filename = body.filename || filename;
    } else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      dataUrl = (formData.get("dataUrl") as string) || "";
      filename = (formData.get("filename") as string) || filename;
    } else {
      // Fallback: try parsing as text
      const rawText = await req.text();
      try {
        const parsed = JSON.parse(rawText);
        dataUrl = parsed.dataUrl || "";
        filename = parsed.filename || filename;
      } catch {
        return new NextResponse("Unsupported Content-Type", { status: 400 });
      }
    }

    if (!dataUrl) {
      return new NextResponse("Missing dataUrl", { status: 400 });
    }

    // Extract mime type and base64 content
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return new NextResponse("Invalid data URL format", { status: 400 });
    }

    const mimeType = match[1] || "image/png";
    const base64Content = match[2];
    const buffer = Buffer.from(base64Content, "base64");

    // Clean filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Photobooth download route error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
