export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";
import webpush from "web-push";

// Configure Web Push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@expedientgeneration.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: Maksimal 30 notifikasi per menit per pengirim
    const rl = rateLimit(`chat-notify:${user.id}`, 30, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Terlalu banyak notifikasi dikirim. Harap tunggu beberapa saat." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const { receiverId, message } = await req.json();

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId is required" }, { status: 400 });
    }

    // Don't send notification to oneself
    if (receiverId === user.id) {
      return NextResponse.json({ status: "skipped" });
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch sender details
    const { data: senderProfile } = await serviceClient
      .from("profiles")
      .select("nama_panggilan, nama_lengkap, foto_profil")
      .eq("id", user.id)
      .maybeSingle();

    const senderName = senderProfile?.nama_panggilan || senderProfile?.nama_lengkap || "Rekan Angkatan";
    const previewText = message
      ? message.length > 80
        ? message.slice(0, 80) + "..."
        : message
      : "Mengirim lampiran media";

    // Insert in-app notification
    const { data: notif, error: notifErr } = await serviceClient
      .from("notifications")
      .insert([
        {
          user_id: receiverId,
          title: `Pesan Baru: ${senderName}`,
          message: previewText,
          link: `/chat/personal/${user.id}`,
          is_read: false,
        },
      ])
      .select()
      .single();

    if (notifErr) {
      console.error("Failed to insert chat notification:", notifErr);
    }

    // Trigger Web Push Notification if subscribed
    try {
      if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        const { data: subscriptions } = await serviceClient
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", receiverId);

        if (subscriptions && subscriptions.length > 0) {
          const payload = JSON.stringify({
            title: `Pesan Baru dari ${senderName}`,
            body: previewText,
            url: `/chat/personal/${user.id}`,
            tag: `chat_${user.id}`,
          });

          await Promise.allSettled(
            subscriptions.map(async (sub) => {
              try {
                await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                  },
                  payload
                );
              } catch (pushErr: any) {
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                  await serviceClient.from("push_subscriptions").delete().eq("id", sub.id);
                }
              }
            })
          );
        }
      }
    } catch (pushGeneralErr) {
      console.warn("Push delivery error:", pushGeneralErr);
    }

    return NextResponse.json({ status: "success", data: notif });
  } catch (err: any) {
    console.error("Chat notify endpoint error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
