import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Configure Web Push with VAPID Keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@expedientgeneration.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

/**
 * POST /api/push/call
 * Sends a push notification for incoming voice/video call.
 * Any authenticated user can call this (not admin-only).
 * 
 * Body: { targetUserId, callerName, callType, callerId }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Authorization check — must be logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    const { targetUserId, callType } = await req.json();

    if (!targetUserId) {
      return NextResponse.json(
        { status: "error", message: "targetUserId is required", data: null },
        { status: 400 }
      );
    }

    // Service role client to bypass RLS for cross-user queries
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch caller's profile name
    let callerName = "Seseorang";
    const { data: callerProfile } = await serviceClient
      .from("profiles")
      .select("nama_panggilan")
      .eq("id", user.id)
      .single();
    if (callerProfile?.nama_panggilan) {
      callerName = callerProfile.nama_panggilan;
    }

    // Fetch all push subscriptions for the target user (bypasses RLS)
    const { data: subscriptions, error } = await serviceClient
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", targetUserId);

    if (error) {
      console.error("Failed to fetch push subscriptions:", error);
      return NextResponse.json(
        { status: "error", message: error.message, data: null },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        status: "success",
        message: "No push subscriptions found for target user",
        data: { sent: 0 },
      });
    }

    // Build push URL — callee will be redirected to caller's chat page
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const callUrl = `${siteUrl}/chat/personal/${user.id}?callAction=accept&type=${callType || "voice"}`;

    const callTypeLabel = callType === "video" ? "Video" : "Suara";
    const payload = JSON.stringify({
      title: `📞 Panggilan ${callTypeLabel} Masuk`,
      body: `${callerName || "Seseorang"} sedang menelepon Anda`,
      icon: "/images/logo-utuh.webp",
      url: callUrl,
      tag: `call-${user.id}`, // Replaces previous call notification from same caller
      requireInteraction: true, // Keep notification visible until user interacts
    });

    let sentCount = 0;
    const sendPromises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key,
        },
      };

      return webpush
        .sendNotification(pushSubscription, payload, { TTL: 60 }) // 60s TTL for call
        .then(() => {
          sentCount++;
        })
        .catch(async (e) => {
          if (e.statusCode === 404 || e.statusCode === 410) {
            // Subscription expired/unsubscribed — clean up
            await serviceClient.from("push_subscriptions").delete().eq("id", sub.id);
          } else {
            console.error("Push send failed:", e.statusCode, e.body);
          }
        });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({
      status: "success",
      message: `Push sent to ${sentCount} device(s)`,
      data: { sent: sentCount },
    });
  } catch (err: any) {
    console.error("Push call error:", err);
    return NextResponse.json(
      { status: "error", message: err.message, data: null },
      { status: 500 }
    );
  }
}
