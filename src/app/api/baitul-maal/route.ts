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
    const { data: { user } } = await supabase.auth.getUser();

    let userRole = 'member';
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role) userRole = profile.role;
    }

    const isManager = userRole === "admin" || userRole === "bendahara" || userRole === "superadmin";

    const { data: rawTransactions, error } = await supabase
      .from("baitul_maal_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Security Filter: Regular members only see completed entries, or their own pending entries
    const filteredRows = (rawTransactions || []).filter((t: any) => {
      if (isManager) return true;
      if (t.status === "completed" || !t.status) {
        // If status column doesn't exist or is completed, check description flag
        return !t.description?.startsWith("[PENDING VERIFIKASI]");
      }
      return user && t.user_id === user.id;
    });

    const userIds = Array.from(new Set(filteredRows.map((t: any) => t.user_id).filter(Boolean)));
    const profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nama_panggilan")
        .in("id", userIds);
      profiles?.forEach((p: any) => profileMap.set(p.id, p.nama_panggilan));
    }

    const transactions = filteredRows.map((t: any) => ({
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
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse("error", "Sesi login tidak valid. Silakan login kembali.", null, { status: 401 });
    }

    // Role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("nama_panggilan, role")
      .eq("id", user.id)
      .maybeSingle();

    const isManager = profile?.role === "admin" || profile?.role === "bendahara" || profile?.role === "superadmin";

    const body = await req.json();
    const action = body.action || "create_entry";

    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase;

    // ==========================================
    // ACTION 1: MEMBER DONASI / INFAQ MANDIRI (PENDING VERIFICATION)
    // ==========================================
    if (action === "donate") {
      const amount = Number(body.amount);
      const program = body.program || "Kas Rutin Angkatan";
      const prayerNote = (body.prayer_note || "").trim();
      const isAnonim = Boolean(body.anonim);
      const bankTarget = body.bank_target || "BSI";
      const proofUrl = body.proof_url || null;

      if (!amount || amount <= 0) {
        return jsonResponse("error", "Nominal donasi harus lebih dari Rp 0.", null, { status: 400 });
      }

      let description = `[PENDING VERIFIKASI] [${program}] Infaq via ${bankTarget}`;
      if (prayerNote) {
        description += ` — "${prayerNote}"`;
      }

      const insertPayload: Record<string, any> = {
        user_id: isAnonim ? null : user.id,
        amount,
        transaction_type: "IN",
        description,
      };

      // Try inserting with status & proof_url if available
      try {
        const { data, error } = await adminSupabase
          .from("baitul_maal_transactions")
          .insert([{ ...insertPayload, status: "pending", proof_url: proofUrl }])
          .select()
          .single();

        if (!error && data) {
          // Log Activity (Pending)
          await adminSupabase.from("activity_logs").insert([
            {
              user_id: user.id,
              action: "Pengajuan Infaq Baitul Maal",
              details: `Mengajukan infaq ${program} sebesar Rp ${amount.toLocaleString('id-ID')} (Menunggu Verifikasi)`,
            },
          ]);

          return jsonResponse("success", "Jazakumullah Khairan! Konfirmasi infaq Anda telah tersimpan dan sedang diverifikasi oleh Bendahara.", {
            ...data,
            donor_name: isAnonim ? "Hamba Allah" : (profile?.nama_panggilan || "Hamba Allah"),
          });
        }
      } catch {
        // Fallback without extra columns
      }

      const { data, error } = await adminSupabase
        .from("baitul_maal_transactions")
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;

      return jsonResponse("success", "Jazakumullah Khairan! Konfirmasi infaq Anda telah tersimpan dan sedang diverifikasi oleh Bendahara.", {
        ...data,
        donor_name: isAnonim ? "Hamba Allah" : (profile?.nama_panggilan || "Hamba Allah"),
      });
    }

    // ==========================================
    // ACTION 2: ADMIN / BENDAHARA RECORD OFFICIAL ENTRY
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

      const insertPayload: Record<string, any> = {
        user_id: isAnonim ? null : user.id,
        amount,
        transaction_type: type,
        description,
      };

      try {
        const { data, error } = await adminSupabase
          .from("baitul_maal_transactions")
          .insert([{ ...insertPayload, status: "completed" }])
          .select()
          .single();

        if (!error && data) {
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
      } catch {
        // Fallback without status column
      }

      const { data, error } = await adminSupabase
        .from("baitul_maal_transactions")
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;

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

    // ==========================================
    // ACTION 3: ADMIN / BENDAHARA VERIFIKASI DONASI
    // ==========================================
    if (action === "verify_donation") {
      if (!isManager) {
        return jsonResponse("error", "Akses ditolak. Hanya Bendahara atau Admin yang berhak memvalidasi donasi.", null, { status: 403 });
      }

      const transactionId = body.transaction_id;
      const isApproved = Boolean(body.approved);

      if (!transactionId) {
        return jsonResponse("error", "ID transaksi wajib dicantumkan.", null, { status: 400 });
      }

      const { data: targetTx, error: txError } = await adminSupabase
        .from("baitul_maal_transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (txError || !targetTx) {
        return jsonResponse("error", "Transaksi tidak ditemukan.", null, { status: 404 });
      }

      const cleanDescription = (targetTx.description || "").replace(/^\[PENDING VERIFIKASI\]\s*/i, "");

      if (isApproved) {
        // Update to completed & award prestise points
        await adminSupabase
          .from("baitul_maal_transactions")
          .update({
            description: cleanDescription,
            status: "completed",
          })
          .eq("id", transactionId);

        if (targetTx.user_id) {
          await addPrestise(adminSupabase as any, targetTx.user_id, "BAITUL_MAAL_DONASI", 25);
        }

        await adminSupabase.from("activity_logs").insert([
          {
            user_id: user.id,
            action: "Verifikasi Infaq Disetujui",
            details: `Menyetujui infaq Rp ${Number(targetTx.amount).toLocaleString('id-ID')} untuk donatur ID: ${targetTx.user_id || 'Anonim'}`,
          },
        ]);

        return jsonResponse("success", "Donasi berhasil diverifikasi dan poin prestise telah ditambahkan.", { transaction_id: transactionId, status: "completed" });
      } else {
        // Rejected
        await adminSupabase
          .from("baitul_maal_transactions")
          .update({
            status: "rejected",
            description: `[DITOLAK] ${cleanDescription}`,
          })
          .eq("id", transactionId);

        return jsonResponse("success", "Donasi ditandai sebagai ditolak.", { transaction_id: transactionId, status: "rejected" });
      }
    }

    return jsonResponse("error", "Aksi tidak dikenali.", null, { status: 400 });

  } catch (err: unknown) {
    console.error("Baitul Maal transaction error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses transaksi.";
    return jsonResponse("error", message, null, { status: 500 });
  }
}
