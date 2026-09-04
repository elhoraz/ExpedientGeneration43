import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const jsonResponse = (
  status: "success" | "error",
  message: string,
  data: unknown = null,
  init?: ResponseInit
) => NextResponse.json({ status, message, data }, init);

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Terjadi kesalahan server.";

const toCoordinate = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return jsonResponse("error", "Unauthorized - Anda harus login terlebih dahulu", null, { status: 401 });
    }

    // Rate Limit: Maksimal 20 update GPS per menit per pengguna
    const rl = rateLimit(`radar-loc:${user.id}`, 20, 60 * 1000);
    if (!rl.success) {
      return jsonResponse("error", "Terlalu banyak update lokasi. Harap tunggu sebentar.", null, {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }

    const body = await req.json();
    const latitude = toCoordinate(body.latitude);
    const longitude = toCoordinate(body.longitude);
    const city = typeof body.city === "string" && body.city.trim() ? body.city.trim() : null;

    if (latitude === null || longitude === null) {
      return jsonResponse("error", "Koordinat GPS tidak valid", null, { status: 400 });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return jsonResponse("error", "Koordinat GPS berada di luar rentang valid", null, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        lat: latitude,
        lng: longitude,
        alamat_lengkap: city,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Supabase update error:", error);
      return jsonResponse("error", error.message, null, { status: 500 });
    }

    return jsonResponse("success", "Lokasi berhasil diperbarui", {
      latitude,
      longitude,
      city,
    });
  } catch (err: unknown) {
    console.error("Location update error:", err);
    return jsonResponse("error", getErrorMessage(err), null, { status: 500 });
  }
}
