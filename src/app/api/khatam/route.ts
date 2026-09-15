import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { addPrestise } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export const JUZ_DATA = [
  { juz: 1, range: "Al-Fatihah 1 - Al-Baqarah 141" },
  { juz: 2, range: "Al-Baqarah 142 - Al-Baqarah 252" },
  { juz: 3, range: "Al-Baqarah 253 - Ali 'Imran 92" },
  { juz: 4, range: "Ali 'Imran 93 - An-Nisa' 23" },
  { juz: 5, range: "An-Nisa' 24 - An-Nisa' 147" },
  { juz: 6, range: "An-Nisa' 148 - Al-Ma'idah 81" },
  { juz: 7, range: "Al-Ma'idah 82 - Al-An'am 110" },
  { juz: 8, range: "Al-An'am 111 - Al-A'raf 87" },
  { juz: 9, range: "Al-A'raf 88 - Al-Anfal 40" },
  { juz: 10, range: "Al-Anfal 41 - At-Taubah 92" },
  { juz: 11, range: "At-Taubah 93 - Hud 5" },
  { juz: 12, range: "Hud 6 - Yusuf 52" },
  { juz: 13, range: "Yusuf 53 - Ibrahim 52" },
  { juz: 14, range: "Al-Hijr 1 - An-Nahl 128" },
  { juz: 15, range: "Al-Isra' 1 - Al-Kahf 74" },
  { juz: 16, range: "Al-Kahf 75 - Ta-Ha 135" },
  { juz: 17, range: "Al-Anbiya' 1 - Al-Hajj 78" },
  { juz: 18, range: "Al-Mu'minun 1 - Al-Furqan 20" },
  { juz: 19, range: "Al-Furqan 21 - An-Naml 55" },
  { juz: 20, range: "An-Naml 56 - Al-'Ankabut 45" },
  { juz: 21, range: "Al-'Ankabut 46 - Al-Ahzab 30" },
  { juz: 22, range: "Al-Ahzab 31 - Ya-Sin 27" },
  { juz: 23, range: "Ya-Sin 28 - Az-Zumar 31" },
  { juz: 24, range: "Az-Zumar 32 - Fussilat 46" },
  { juz: 25, range: "Fussilat 47 - Al-Jasiyah 37" },
  { juz: 26, range: "Al-Ahqaf 1 - Az-Zariyat 30" },
  { juz: 27, range: "Az-Zariyat 31 - Al-Hadid 29" },
  { juz: 28, range: "Al-Mujadilah 1 - At-Tahrim 12" },
  { juz: 29, range: "Al-Mulk 1 - Al-Mursalat 50" },
  { juz: 30, range: "An-Naba' 1 - An-Nas 6" },
];

// In-memory fallback session for instant responsiveness and resilience
let memorySession: any = null;
let memoryAllocations: any[] = [];

function initMemoryState() {
  if (!memorySession) {
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));
    nextFriday.setHours(18, 0, 0, 0);

    memorySession = {
      id: "session-fallback-active",
      title: "Khataman Pekanan Angkatan 43",
      target_date: nextFriday.toISOString(),
      status: "active",
      total_juz_completed: 0,
      created_at: new Date().toISOString(),
    };

    memoryAllocations = JUZ_DATA.map((item) => ({
      id: `alloc-${item.juz}`,
      session_id: memorySession.id,
      juz_number: item.juz,
      surah_range: item.range,
      user_id: null,
      user_name: null,
      user_avatar: null,
      status: "available",
      claimed_at: null,
      completed_at: null,
    }));
  }
}

export async function GET() {
  const supabase = await createClient();

  try {
    // Try to get active session from Supabase
    const { data: session, error: sessionErr } = await supabase
      .from("khatam_sessions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sessionErr && session) {
      const { data: allocations, error: allocErr } = await supabase
        .from("khatam_allocations")
        .select("*")
        .eq("session_id", session.id)
        .order("juz_number", { ascending: true });

      if (!allocErr && allocations && allocations.length > 0) {
        const completedCount = allocations.filter((a: any) => a.status === "completed").length;
        return NextResponse.json({
          session: {
            ...session,
            total_juz_completed: completedCount,
          },
          allocations,
        });
      }
    }
  } catch (e) {
    console.warn("Khatam Supabase read fallback:", e);
  }

  // Graceful in-memory fallback
  initMemoryState();
  const completedCount = memoryAllocations.filter((a) => a.status === "completed").length;
  memorySession.total_juz_completed = completedCount;

  return NextResponse.json({
    session: memorySession,
    allocations: memoryAllocations,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const body = await request.json();
  const { action, juz_number, user_name, user_avatar } = body;

  if (!action || !juz_number) {
    return NextResponse.json({ error: "Parameter tidak lengkap." }, { status: 400 });
  }

  const targetJuz = parseInt(juz_number, 10);
  if (isNaN(targetJuz) || targetJuz < 1 || targetJuz > 30) {
    return NextResponse.json({ error: "Nomor Juz tidak valid." }, { status: 400 });
  }

  // Fetch actual user profile
  let resolvedName = user_name;
  let resolvedAvatar = user_avatar;

  if (!resolvedName) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nama_panggilan, nama_lengkap, foto_profil")
      .eq("id", user.id)
      .maybeSingle();

    resolvedName = profile?.nama_panggilan || profile?.nama_lengkap || user.user_metadata?.nama_panggilan || "Sahabat 43";
    resolvedAvatar = profile?.foto_profil || user.user_metadata?.avatar_url || null;
  }

  let dbSuccess = false;

  try {
    const { data: session } = await supabase
      .from("khatam_sessions")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (session) {
      if (action === "claim") {
        const { error } = await supabase
          .from("khatam_allocations")
          .update({
            user_id: user.id,
            user_name: resolvedName,
            user_avatar: resolvedAvatar,
            status: "reading",
            claimed_at: new Date().toISOString(),
          })
          .eq("session_id", session.id)
          .eq("juz_number", targetJuz)
          .eq("status", "available");

        if (!error) dbSuccess = true;
      } else if (action === "complete") {
        const { error } = await supabase
          .from("khatam_allocations")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("session_id", session.id)
          .eq("juz_number", targetJuz)
          .eq("user_id", user.id);

        if (!error) {
          dbSuccess = true;
          // Award gamification prestise points
          await addPrestise(supabase as any, user.id, "KHATAM_JUZ_COMPLETE", 25);
        }
      } else if (action === "unclaim") {
        const { error } = await supabase
          .from("khatam_allocations")
          .update({
            user_id: null,
            user_name: null,
            user_avatar: null,
            status: "available",
            claimed_at: null,
            completed_at: null,
          })
          .eq("session_id", session.id)
          .eq("juz_number", targetJuz)
          .eq("user_id", user.id);

        if (!error) dbSuccess = true;
      }
    }
  } catch (err) {
    console.warn("Khatam Supabase action error, switching to memory state:", err);
  }

  // Update in-memory fallback state
  initMemoryState();
  const itemIndex = memoryAllocations.findIndex((a) => a.juz_number === targetJuz);

  if (itemIndex !== -1) {
    if (action === "claim") {
      if (memoryAllocations[itemIndex].status === "available" || !dbSuccess) {
        memoryAllocations[itemIndex] = {
          ...memoryAllocations[itemIndex],
          user_id: user.id,
          user_name: resolvedName,
          user_avatar: resolvedAvatar,
          status: "reading",
          claimed_at: new Date().toISOString(),
        };
      }
    } else if (action === "complete") {
      memoryAllocations[itemIndex] = {
        ...memoryAllocations[itemIndex],
        status: "completed",
        completed_at: new Date().toISOString(),
      };
    } else if (action === "unclaim") {
      memoryAllocations[itemIndex] = {
        ...memoryAllocations[itemIndex],
        user_id: null,
        user_name: null,
        user_avatar: null,
        status: "available",
        claimed_at: null,
        completed_at: null,
      };
    }
  }

  const completedCount = memoryAllocations.filter((a) => a.status === "completed").length;
  memorySession.total_juz_completed = completedCount;

  return NextResponse.json({
    success: true,
    action,
    juz_number: targetJuz,
    allocations: memoryAllocations,
    session: memorySession,
  });
}
