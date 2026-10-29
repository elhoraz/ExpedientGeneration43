import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySignedAdminSession, timingSafeEqualString } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;
  const isSignedAdmin = await verifySignedAdminSession(adminToken);

  const authHeader = request.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const queryToken = (new URL(request.url).searchParams.get("token") || "").trim();
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  const isCronAuthorized = Boolean(
    cronSecret &&
      ((bearerToken && timingSafeEqualString(bearerToken, cronSecret)) ||
        (queryToken && timingSafeEqualString(queryToken, cronSecret)))
  );

  if (!isSignedAdmin && !isCronAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/beranda");
  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
