import crypto from "crypto";
import fs from "fs";
import path from "path";

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

import { createAdminClient } from "@/lib/supabase/admin";

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedCredentials: {
  project_id: string;
  client_email: string;
  private_key: string;
} | null = null;

async function getServiceAccountCredentials(): Promise<{
  project_id: string;
  client_email: string;
  private_key: string;
} | null> {
  if (cachedCredentials) return cachedCredentials;

  // 1. Try environment variable (Vercel production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      cachedCredentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      return cachedCredentials;
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env:", e);
    }
  }

  // 2. Try local file fallback
  const possiblePaths = [
    path.join(process.cwd(), "android", "app", "expedient-43-firebase-adminsdk-fbsvc-6b717a2d84.json"),
    path.join(process.cwd(), "android", "app", "firebase-service-account.json"),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        cachedCredentials = JSON.parse(content);
        return cachedCredentials;
      } catch (e) {
        console.error("Failed to read local firebase service account file:", e);
      }
    }
  }

  // 3. Fallback to Supabase site_content table (Always accessible on Vercel)
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("site_content")
      .select("content_value")
      .eq("content_key", "firebase_service_account_key")
      .maybeSingle();

    if (data?.content_value) {
      cachedCredentials = JSON.parse(data.content_value);
      return cachedCredentials;
    }
  } catch (dbErr) {
    console.warn("Could not load Firebase Service Account from DB:", dbErr);
  }

  return null;
}

/**
 * Gets a valid Google OAuth2 Bearer Access Token for FCM HTTP v1 API
 */
export async function getGoogleFcmAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const creds = await getServiceAccountCredentials();
  if (!creds || !creds.client_email || !creds.private_key) {
    console.warn("Firebase Service Account credentials not found.");
    return null;
  }

  try {
    const header = { alg: "RS256", typ: "JWT" };
    const claimSet = {
      iss: creds.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedClaimSet = base64url(JSON.stringify(claimSet));
    const signInput = `${encodedHeader}.${encodedClaimSet}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(signInput);
    const signature = base64url(signer.sign(creds.private_key));

    const jwt = `${signInput}.${signature}`;

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      cachedToken = {
        token: data.access_token,
        expiresAt: now + (data.expires_in || 3600),
      };
      return data.access_token;
    } else {
      console.error("Google OAuth token exchange failed:", data);
    }
  } catch (err) {
    console.error("Error generating Google FCM token:", err);
  }

  return null;
}

export interface SendFcmOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  isCall?: boolean;
}

/**
 * Sends a high-priority Google FCM HTTP v1 push notification
 * to wake up Android devices even when app is killed/closed.
 */
export async function sendFcmNotification({
  token,
  title,
  body,
  data = {},
  isCall = false,
}: SendFcmOptions): Promise<boolean> {
  const accessToken = await getGoogleFcmAccessToken();
  if (!accessToken) {
    return false;
  }

  const creds = await getServiceAccountCredentials();
  const projectId = creds?.project_id || "expedient-43";

  try {
    const channelId = isCall
      ? "expedient_incoming_calls_channel"
      : "expedient_chat_channel";

    const payload = {
      message: {
        token,
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          title,
          body,
        },
        android: {
          priority: "HIGH",
          notification: {
            channel_id: channelId,
            notification_priority: "PRIORITY_MAX",
            default_sound: true,
            default_vibrate_timings: true,
            visibility: "PUBLIC",
          },
        },
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      return true;
    } else {
      const errText = await response.text();
      console.warn("FCM HTTP v1 error response:", response.status, errText);
      return false;
    }
  } catch (e) {
    console.error("FCM send notification error:", e);
    return false;
  }
}
