import { NextResponse } from "next/server";
import {
  auditGroupMembersAgainstDatabase,
  formatAuditSummaryMessage,
  executeMemberInvitations,
} from "@/lib/whatsapp/memberAuditor";
import { verifySignedAdminSession } from "@/lib/admin-auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("expedient_admin_session")?.value;
    const isAuthorized = adminToken ? await verifySignedAdminSession(adminToken) : false;

    // Cek authorization
    if (!isAuthorized) {
      const authHeader = request.headers.get("authorization");
      const cronSecret = process.env.CRON_SECRET || "expedient-cron-secret-2026";
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || "audit"; // 'audit' | 'send_invitations'
    const rawText = body.text || body.phones || "";

    if (action === "send_invitations") {
      const adminPhone = process.env.ADMIN_WA_PHONE || "6282142877426";
      const result = await executeMemberInvitations(adminPhone);
      return NextResponse.json({
        success: result.success,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        message: result.message,
      });
    }

    // Default action: audit
    const auditRes = await auditGroupMembersAgainstDatabase(rawText);
    const summary = formatAuditSummaryMessage(auditRes);

    return NextResponse.json({
      success: true,
      totalAnalyzed: auditRes.totalAnalyzed,
      registeredCount: auditRes.registered.length,
      unregisteredCount: auditRes.unregistered.length,
      registered: auditRes.registered,
      unregistered: auditRes.unregistered,
      formattedSummary: summary,
    });
  } catch (err: any) {
    console.error("[MEMBER-AUDIT-API-ERR]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
