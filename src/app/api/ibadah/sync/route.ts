import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitDistributed } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export interface SyncedLastRead {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  timestamp: number;
}

export interface SyncedBookmark {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  teksArab: string;
  teksIndonesia: string;
  addedAt: number;
}

export interface SyncedTasbihState {
  selectedId: string;
  count: number;
  target: number;
  round: number;
}

function sanitizeLastRead(raw: unknown): SyncedLastRead | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const surahNumber = Number(obj.surahNumber);
  const ayahNumber = Number(obj.ayahNumber);
  const timestamp = Number(obj.timestamp);
  const surahName = typeof obj.surahName === "string" ? obj.surahName.trim().slice(0, 80) : "";

  if (
    !Number.isInteger(surahNumber) ||
    surahNumber < 1 ||
    surahNumber > 114 ||
    !Number.isInteger(ayahNumber) ||
    ayahNumber < 1 ||
    ayahNumber > 300 ||
    !surahName
  ) {
    return null;
  }

  return {
    surahNumber,
    surahName,
    ayahNumber,
    timestamp: Number.isFinite(timestamp) && timestamp > 0 ? Math.floor(timestamp) : Date.now(),
  };
}

function sanitizeBookmarks(raw: unknown): SyncedBookmark[] | null {
  if (!Array.isArray(raw)) return null;
  const seen = new Set<string>();
  const cleaned: SyncedBookmark[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const surahNumber = Number(obj.surahNumber);
    const ayahNumber = Number(obj.ayahNumber);
    const surahName = typeof obj.surahName === "string" ? obj.surahName.trim().slice(0, 80) : "";
    if (
      !Number.isInteger(surahNumber) ||
      surahNumber < 1 ||
      surahNumber > 114 ||
      !Number.isInteger(ayahNumber) ||
      ayahNumber < 1 ||
      ayahNumber > 300 ||
      !surahName
    ) {
      continue;
    }

    const key = `${surahNumber}:${ayahNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const addedAt = Number(obj.addedAt);
    cleaned.push({
      surahNumber,
      surahName,
      ayahNumber,
      teksArab: typeof obj.teksArab === "string" ? obj.teksArab.slice(0, 1200) : "",
      teksIndonesia: typeof obj.teksIndonesia === "string" ? obj.teksIndonesia.slice(0, 1200) : "",
      addedAt: Number.isFinite(addedAt) && addedAt > 0 ? Math.floor(addedAt) : Date.now(),
    });

    if (cleaned.length >= 200) break;
  }

  return cleaned;
}

function sanitizeTasbihState(raw: unknown): SyncedTasbihState | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const selectedId = typeof obj.selectedId === "string" ? obj.selectedId.trim().slice(0, 64) : "";
  const count = Number(obj.count);
  const target = Number(obj.target);
  const round = Number(obj.round);

  if (
    !selectedId ||
    !Number.isFinite(count) ||
    count < 0 ||
    !Number.isFinite(target) ||
    target < 1 ||
    target > 100000 ||
    !Number.isFinite(round) ||
    round < 1
  ) {
    return null;
  }

  return {
    selectedId,
    count: Math.min(100000, Math.floor(count)),
    target: Math.floor(target),
    round: Math.min(100000, Math.floor(round)),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_ibadah_state")
      .select("quran_last_read, quran_bookmarks, tasbih_total, tasbih_state, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      state: {
        quran_last_read: sanitizeLastRead(data?.quran_last_read),
        quran_bookmarks: sanitizeBookmarks(data?.quran_bookmarks) ?? [],
        tasbih_total: Number(data?.tasbih_total ?? 0),
        tasbih_state: sanitizeTasbihState(data?.tasbih_state),
        updated_at: data?.updated_at ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch ibadah sync";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimitDistributed(`ibadah-sync:${user.id}`, 60, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many sync requests" }, { status: 429 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { data: existing, error: readErr } = await supabase
      .from("user_ibadah_state")
      .select("quran_last_read, quran_bookmarks, tasbih_total, tasbih_state")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readErr) {
      return NextResponse.json({ error: readErr.message }, { status: 500 });
    }

    const existingLastRead = sanitizeLastRead(existing?.quran_last_read);
    const incomingLastRead =
      body.quran_last_read !== undefined ? sanitizeLastRead(body.quran_last_read) : undefined;

    let nextLastRead = existingLastRead;
    if (incomingLastRead) {
      if (!existingLastRead || incomingLastRead.timestamp >= existingLastRead.timestamp) {
        nextLastRead = incomingLastRead;
      }
    }

    const existingBookmarks = sanitizeBookmarks(existing?.quran_bookmarks) ?? [];
    const incomingBookmarks =
      body.quran_bookmarks !== undefined ? sanitizeBookmarks(body.quran_bookmarks) : null;
    const nextBookmarks = incomingBookmarks ?? existingBookmarks;

    const existingTasbihTotal = Math.max(0, Math.floor(Number(existing?.tasbih_total ?? 0)));
    const incomingTotalRaw = Number(body.tasbih_total);
    const incomingTasbihTotal =
      body.tasbih_total !== undefined && Number.isFinite(incomingTotalRaw) && incomingTotalRaw >= 0
        ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(incomingTotalRaw))
        : 0;
    const nextTasbihTotal = Math.max(existingTasbihTotal, incomingTasbihTotal);

    const existingTasbihState = sanitizeTasbihState(existing?.tasbih_state);
    const incomingTasbihState =
      body.tasbih_state !== undefined ? sanitizeTasbihState(body.tasbih_state) : null;
    const nextTasbihState = incomingTasbihState ?? existingTasbihState ?? {};

    const nowIso = new Date().toISOString();
    const { data: saved, error: upsertErr } = await supabase
      .from("user_ibadah_state")
      .upsert(
        {
          user_id: user.id,
          quran_last_read: nextLastRead,
          quran_bookmarks: nextBookmarks,
          tasbih_total: nextTasbihTotal,
          tasbih_state: nextTasbihState,
          updated_at: nowIso,
        },
        { onConflict: "user_id" }
      )
      .select("quran_last_read, quran_bookmarks, tasbih_total, tasbih_state, updated_at")
      .single();

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      state: {
        quran_last_read: sanitizeLastRead(saved?.quran_last_read),
        quran_bookmarks: sanitizeBookmarks(saved?.quran_bookmarks) ?? [],
        tasbih_total: Number(saved?.tasbih_total ?? nextTasbihTotal),
        tasbih_state: sanitizeTasbihState(saved?.tasbih_state),
        updated_at: saved?.updated_at ?? nowIso,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save ibadah sync";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
