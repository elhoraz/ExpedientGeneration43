export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { addPrestise } from "@/lib/gamification";

const jsonResponse = (
  status: "success" | "error",
  message: string,
  data: unknown = null,
  init?: ResponseInit
) => NextResponse.json({ status, message, data }, init);

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse("error", "Sesi login tidak valid. Silakan login kembali.", null, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nama_panggilan, role")
      .eq("id", user.id)
      .maybeSingle();

    const body = await req.json();
    const action = body.action || "create_request";

    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase;

    // =========================================================================
    // ACTION 1: CREATE REQUEST (MENTORSHIP / B2B TENDER)
    // =========================================================================
    if (action === "create_request") {
      const targetId = body.targetId || body.target_id;
      const type = body.type; // 'Mentor' | 'Tender'
      const subject = (body.subject || "").trim();
      const message = (body.message || "").trim();

      if (!targetId || !type) {
        return jsonResponse("error", "Data target permohonan tidak lengkap.", null, { status: 400 });
      }

      if (targetId === user.id) {
        return jsonResponse("error", "Anda tidak dapat mengajukan bimbingan kepada diri sendiri.", null, { status: 400 });
      }

      // Check if request already exists
      const { data: existing } = await adminSupabase
        .from("tarbiyah_requests")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("target_id", targetId)
        .maybeSingle();

      if (existing) {
        return jsonResponse(
          "error",
          `Permohonan sudah ada dengan status: ${existing.status}. Harap tunggu konfirmasi.`,
          null,
          { status: 400 }
        );
      }

      const { data, error } = await adminSupabase
        .from("tarbiyah_requests")
        .insert([
          {
            user_id: user.id,
            target_id: targetId,
            type: type,
            status: "Pending",
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Send notification to mentor/target
      await adminSupabase.from("notifications").insert([
        {
          user_id: targetId,
          title: `Permohonan ${type} Baru`,
          message: `${profile?.nama_panggilan || "Rekan Angkatan"} mengajukan bimbingan/tender: "${subject || "Permohonan Tarbiyah"}"`,
          link: "/tarbiyah",
          is_read: false,
        },
      ]);

      // Log Activity
      await adminSupabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: `Ajukan ${type} Tarbiyah`,
          details: `Mengajukan permohonan ${type} ${subject ? `(${subject})` : ''}`,
        },
      ]);

      return jsonResponse("success", `Permohonan ${type} berhasil dikirim dan disegel.`, data);
    }

    // =========================================================================
    // ACTION 2: UPDATE REQUEST STATUS (APPROVE / REJECT)
    // =========================================================================
    if (action === "update_status") {
      const requestId = body.requestId || body.request_id;
      const newStatus = body.status; // 'Approved' | 'Rejected'

      if (!requestId || !["Approved", "Rejected"].includes(newStatus)) {
        return jsonResponse("error", "Parameter status tidak valid.", null, { status: 400 });
      }

      // Fetch request details
      const { data: reqData, error: fetchErr } = await adminSupabase
        .from("tarbiyah_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchErr || !reqData) {
        return jsonResponse("error", "Permohonan tidak ditemukan.", null, { status: 404 });
      }

      // Verify permission: User must be target (mentor) OR owner of the target syndicate OR admin
      let isAuthorized = reqData.target_id === user.id || profile?.role === "admin";

      if (!isAuthorized && reqData.type === "Tender") {
        const { data: syndicateItem } = await adminSupabase
          .from("syndicate")
          .select("user_id")
          .eq("id", reqData.target_id)
          .maybeSingle();
        if (syndicateItem?.user_id === user.id) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return jsonResponse("error", "Anda tidak memiliki wewenang untuk menanggapi permohonan ini.", null, { status: 403 });
      }

      const { data: updated, error: updateErr } = await adminSupabase
        .from("tarbiyah_requests")
        .update({ status: newStatus })
        .eq("id", requestId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Award Prestise points if approved
      if (newStatus === "Approved") {
        await addPrestise(adminSupabase as any, reqData.user_id, "TARBIYAH_MENTORSHIP_APPROVED", 20);
        await addPrestise(adminSupabase as any, user.id, "TARBIYAH_MENTOR_ACCEPTED", 20);
      }

      // Send notification to applicant
      await adminSupabase.from("notifications").insert([
        {
          user_id: reqData.user_id,
          title: `Permohonan ${reqData.type}: ${newStatus === 'Approved' ? 'Disetujui' : 'Ditolak'}`,
          message: `Permohonan bimbingan/tender ${reqData.type} Anda telah ${newStatus === 'Approved' ? 'diterima oleh Mentor' : 'ditolak'}.`,
          link: "/tarbiyah",
          is_read: false,
        },
      ]);

      // Log Activity
      await adminSupabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: `${newStatus === 'Approved' ? 'Setujui' : 'Tolak'} Permohonan Tarbiyah`,
          details: `Menanggapi permohonan ${reqData.type} menjadi '${newStatus}'`,
        },
      ]);

      return jsonResponse(
        "success",
        `Permohonan berhasil di-${newStatus === 'Approved' ? 'setujui' : 'tolak'}.`,
        updated
      );
    }

    // =========================================================================
    // ACTION 3: CREATE MATERI KAJIAN (ADMIN ONLY)
    // =========================================================================
    if (action === "create_materi") {
      if (profile?.role !== "admin") {
        return jsonResponse("error", "Hanya Admin yang dapat menambahkan materi kajian.", null, { status: 403 });
      }

      const title = (body.title || "").trim();
      const description = (body.description || "").trim();
      const event_date = body.event_date || new Date().toISOString();
      const status = body.status || "upcoming";

      if (!title) {
        return jsonResponse("error", "Judul materi kajian wajib diisi.", null, { status: 400 });
      }

      const { data: newMateri, error: materiErr } = await adminSupabase
        .from("tarbiyah_materi")
        .insert([
          {
            title,
            description,
            event_date,
            status,
          }
        ])
        .select()
        .single();

      if (materiErr) throw materiErr;

      return jsonResponse("success", "Materi kajian baru berhasil ditambahkan.", newMateri);
    }

    return jsonResponse("error", "Aksi tidak dikenali.", null, { status: 400 });

  } catch (err: any) {
    console.error("Tarbiyah request error:", err);
    return jsonResponse("error", err.message || "Terjadi kesalahan server.", null, { status: 500 });
  }
}
