export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { addPrestise } from "@/lib/gamification";

const jsonResponse = (
  status: "success" | "error",
  message: string,
  data: unknown = null,
  init?: ResponseInit,
) => NextResponse.json({ status, message, data }, init);

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: rawTransactions, error } = await supabase
      .from("baitul_maal_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const userIds = Array.from(new Set(rawTransactions?.map((t: any) => t.user_id).filter(Boolean)));
    const profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nama_panggilan")
        .in("id", userIds);
      profiles?.forEach((p: any) => profileMap.set(p.id, p.nama_panggilan));
    }

    const transactions = (rawTransactions || []).map((t: any) => ({
      ...t,
      donor_name: t.user_id ? (profileMap.get(t.user_id) || "Hamba Allah") : "Hamba Allah",
    }));

    return jsonResponse("success", "Data Baitul Maal berhasil diambil.", transactions);
  } catch (err: unknown) {
    console.error("Baitul Maal GET error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    return jsonResponse("error", message, null, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Authorization check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse("error", "Sesi login tidak valid. Silakan login kembali.", null, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nama_panggilan, role")
      .eq("id", user.id)
      .single();

    const isManager = profile?.role === "admin" || profile?.role === "bendahara";

    const body = await req.json();
    const action = body.action || "create_entry";

    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase;

    // ==========================================
    // ACTION 1: MEMBER DONASI / INFAQ MANDIRI
    // ==========================================
    if (action === "donate") {
      const amount = Number(body.amount);
      const program = body.program || "Kas Rutin Angkatan";
      const prayerNote = (body.prayer_note || "").trim();
      const isAnonim = Boolean(body.anonim);
      const bankTarget = body.bank_target || "BSI";

      if (!amount || amount <= 0) {
        return jsonResponse("error", "Nominal donasi harus lebih dari Rp 0.", null, { status: 400 });
      }

      let description = `[${program}] Infaq via ${bankTarget}`;
      if (prayerNote) {
        description += ` — "${prayerNote}"`;
      }

      const { data, error } = await adminSupabase
        .from("baitul_maal_transactions")
        .insert([
          {
            user_id: isAnonim ? null : user.id,
            amount,
            transaction_type: "IN",
            description,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Add Gamification Prestise points for donation
      await addPrestise(adminSupabase as any, user.id, "BAITUL_MAAL_DONASI", 25);

      // Log Activity
      await adminSupabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Infaq Baitul Maal",
          details: `Menyalurkan infaq ${program} sebesar Rp ${amount.toLocaleString('id-ID')}`,
        },
      ]);

      return jsonResponse("success", "Jazakumullah Khairan! Infaq Anda telah tercatat di Buku Besar Baitul Maal.", {
        ...data,
        donor_name: isAnonim ? "Hamba Allah" : (profile?.nama_panggilan || "Hamba Allah"),
      });
    }

    // ==========================================
    // ACTION 2: ADMIN / BENDAHARA RECORD ENTRY
    // ==========================================
    if (action === "create_entry") {
      if (!isManager) {
        return jsonResponse("error", "Akses ditolak. Hanya Bendahara atau Admin yang dapat mencatat entri buku besar.", null, { status: 403 });
      }

      const amount = Number(body.amount);
      const type = body.type;
      const description = (body.description || "").trim();
      const isAnonim = Boolean(body.anonim);

      if (!amount || amount <= 0 || !type || !description) {
        return jsonResponse("error", "Harap isi nominal, jenis transaksi, dan keterangan dengan lengkap.", null, { status: 400 });
      }

      if (type !== "IN" && type !== "OUT") {
        return jsonResponse("error", "Jenis transaksi harus 'IN' (Pemasukan) atau 'OUT' (Pengeluaran).", null, { status: 400 });
      }

      const { data, error } = await adminSupabase
        .from("baitul_maal_transactions")
        .insert([
          {
            user_id: isAnonim ? null : user.id,
            amount,
            transaction_type: type,
            description,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Log Activity
      await adminSupabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Otorisasi Kas Baitul Maal",
          details: `Mencatat ${type === 'IN' ? 'Pemasukan' : 'Pengeluaran'} sebesar Rp ${amount.toLocaleString('id-ID')}: ${description}`,
        },
      ]);

      return jsonResponse("success", "Entri transaksi berhasil dicatat di Buku Besar.", {
        ...data,
        donor_name: isAnonim ? "Hamba Allah" : (profile?.nama_panggilan || "Hamba Allah"),
      });
    }

    return jsonResponse("error", "Aksi tidak dikenali.", null, { status: 400 });

  } catch (err: unknown) {
    console.error("Baitul Maal transaction error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses transaksi.";
    return jsonResponse("error", message, null, { status: 500 });
  }
}
