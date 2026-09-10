export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addPrestise } from "@/lib/gamification";
import { verifySignedAdminSession } from "@/lib/admin-auth";

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

    const cookieStore = await cookies();
    const adminToken = cookieStore.get("expedient_admin_session")?.value;
    const isSignedAdmin = await verifySignedAdminSession(adminToken);
    const isLegacyUnlocked = adminToken === "unlocked";

    const isManager = userRole === "admin" || userRole === "bendahara" || userRole === "superadmin" || isSignedAdmin || isLegacyUnlocked;

    const { data: rawTransactions, error } = await supabase
      .from("baitul_maal_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Security Filter: Regular members only see completed entries, or their own pending entries
    const filteredRows = (rawTransactions || []).filter((t: any) => {
      if (isManager) return true;
      if (t.status === "completed" || !t.status) {
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

    const transactions = filteredRows.map((t: any) => {
      const isOut = t.transaction_type === "OUT" || t.transaction_type === "pengeluaran";
      return {
        ...t,
        transaction_type: isOut ? "OUT" : "IN",
        raw_type: t.transaction_type,
        donor_name: t.user_id ? (profileMap.get(t.user_id) || "Hamba Allah") : "Hamba Allah",
      };
    });

    // Fetch official bank accounts and contact from site_content
    const { data: scData } = await supabase
      .from("site_content")
      .select("content_key, content_value")
      .in("content_key", ["baitul_maal_bank_accounts", "baitul_maal_contact"]);

    let bankAccounts: any[] = [];
    let contact: any = null;

    scData?.forEach((sc: any) => {
      if (sc.content_key === "baitul_maal_bank_accounts" && sc.content_value) {
        try { bankAccounts = JSON.parse(sc.content_value); } catch {}
      }
      if (sc.content_key === "baitul_maal_contact" && sc.content_value) {
        try { contact = JSON.parse(sc.content_value); } catch {}
      }
    });

    return NextResponse.json({
      status: "success",
      message: "Data Baitul Maal berhasil diambil.",
      data: transactions,
      bank_accounts: bankAccounts,
      contact: contact,
    });
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

    // Role and admin token check
    const { data: profile } = await supabase
      .from("profiles")
      .select("nama_panggilan, role")
      .eq("id", user.id)
      .maybeSingle();

    const cookieStore = await cookies();
    const adminToken = cookieStore.get("expedient_admin_session")?.value;
    const isSignedAdmin = await verifySignedAdminSession(adminToken);
    const isLegacyUnlocked = adminToken === "unlocked";

    const isManager = profile?.role === "admin" || profile?.role === "bendahara" || profile?.role === "superadmin" || isSignedAdmin || isLegacyUnlocked;

    const body = await req.json();
    const action = body.action || "create_entry";

    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
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
        transaction_type: "infaq",
        description,
        status: "pending",
        proof_url: proofUrl,
      };

      const { data, error } = await adminSupabase
        .from("baitul_maal_transactions")
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.error("Baitul Maal donation insert error:", error);
        throw error;
      }

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
        transaction_type: "IN",
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

      const dbType = type === "OUT" ? "pengeluaran" : "infaq";

      const insertPayload: Record<string, any> = {
        user_id: isAnonim ? null : user.id,
        amount,
        transaction_type: dbType,
        description,
        status: "completed",
      };

      const { data, error } = await adminSupabase
        .from("baitul_maal_transactions")
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.error("Baitul Maal create_entry insert error:", error);
        throw error;
      }

      await adminSupabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Otorisasi Kas Baitul Maal",
          details: `Mencatat ${type === 'IN' ? 'Pemasukan' : 'Pengeluaran'} sebesar Rp ${amount.toLocaleString('id-ID')}: ${description}`,
        },
      ]);

      return jsonResponse("success", "Entri transaksi berhasil dicatat di Buku Besar.", {
        ...data,
        transaction_type: type,
        donor_name: isAnonim ? "Hamba Allah" : (profile?.nama_panggilan || "Hamba Allah"),
      });
    }

    // ==========================================
    // ACTION: BENDAHARA / ADMIN UPDATE REKENING KAS RESMI
    // ==========================================
    if (action === "update_bank_accounts") {
      if (!isManager) {
        return jsonResponse("error", "Akses ditolak. Hanya Bendahara atau Admin yang berhak memperbarui rekening kas.", null, { status: 403 });
      }

      const accounts = Array.isArray(body.accounts) ? body.accounts : [];
      const contact = body.contact || null;

      const { error } = await adminSupabase
        .from("site_content")
        .upsert(
          {
            content_key: "baitul_maal_bank_accounts",
            content_value: JSON.stringify(accounts),
            content_type: "text",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "content_key" }
        );

      if (error) throw error;

      if (contact) {
        await adminSupabase
          .from("site_content")
          .upsert(
            {
              content_key: "baitul_maal_contact",
              content_value: JSON.stringify(contact),
              content_type: "text",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "content_key" }
          );
      }

      await adminSupabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Perbarui Rekening Kas Baitul Maal",
          details: `Memperbarui daftar rekening resmi kas (${accounts.length} rekening)`,
        },
      ]);

      return jsonResponse("success", "Daftar rekening resmi kas berhasil diperbarui.", { accounts, contact });
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
