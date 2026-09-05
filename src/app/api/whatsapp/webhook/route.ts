import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "expedient_meta_token_2026";

/**
 * GET Handler: Verifikasi Webhook dari Meta Developer Portal
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[META WEBHOOK] Verified successfully!");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * POST Handler: Menerima status pesan atau pesan masuk dari pengguna WhatsApp
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[META WEBHOOK INCOMING]:", JSON.stringify(body, null, 2));
    return NextResponse.json({ status: "EVENT_RECEIVED" });
  } catch (error) {
    console.error("[META WEBHOOK ERROR]:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
