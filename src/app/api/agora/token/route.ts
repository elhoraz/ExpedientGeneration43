import { NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelName = searchParams.get("channel") || "majlis_main_room";
    const uid = searchParams.get("uid") || "";

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json(
        {
          status: "error",
          message: "Agora App ID or App Certificate is missing on server",
          data: null,
        },
        { status: 500 }
      );
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600 * 24; // 24 jam
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    let token = "";
    if (uid) {
      token = RtcTokenBuilder.buildTokenWithUserAccount(
        appId,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs,
        privilegeExpiredTs
      );
    } else {
      token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        0,
        role,
        privilegeExpiredTs,
        privilegeExpiredTs
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Agora token generated successfully",
      data: { token, appId, channelName },
    });
  } catch (error: any) {
    console.error("Agora Token Generation Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error?.message || "Failed to generate Agora token",
        data: null,
      },
      { status: 500 }
    );
  }
}
