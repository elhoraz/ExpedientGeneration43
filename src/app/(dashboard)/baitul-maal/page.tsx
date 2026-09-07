import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BaitulMaalClient from "./BaitulMaalClient";
import { cookies } from "next/headers";
import { verifySignedAdminSession } from "@/lib/admin-auth";

export const metadata = {
  title: "Baitul Maal - Expedient",
};

export default async function BaitulMaalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama_panggilan, role, foto_profil, no_whatsapp")
    .eq("id", user.id)
    .single();

  // Check admin/bendahara access (Role or HMAC session cookie)
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;
  const isSignedAdmin = await verifySignedAdminSession(adminToken);
  const isLegacyUnlocked = adminToken === "unlocked";
  const isManager = profile?.role === "admin" || profile?.role === "bendahara" || isSignedAdmin || isLegacyUnlocked;

  // Fetch transactions
  const { data: rawTransactions } = await supabase
    .from("baitul_maal_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  // Security Filter: Regular members only see completed entries or their own
  const filteredRows = (rawTransactions || []).filter((t: any) => {
    if (isManager) return true;
    if (t.status === "completed" || !t.status) {
      return !t.description?.startsWith("[PENDING VERIFIKASI]");
    }
    return user && t.user_id === user.id;
  });

  // Safe mapping of donor names
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
      transaction_type: (isOut ? "OUT" : "IN") as "IN" | "OUT",
      raw_type: t.transaction_type,
      donor_name: t.user_id ? (profileMap.get(t.user_id) || "Hamba Allah") : "Hamba Allah",
    };
  });

  // Fetch official bank accounts from site_content
  const { data: scData } = await supabase
    .from("site_content")
    .select("content_value")
    .eq("content_key", "baitul_maal_bank_accounts")
    .maybeSingle();

  let bankAccounts: any[] = [];
  if (scData?.content_value) {
    try {
      bankAccounts = JSON.parse(scData.content_value);
    } catch {}
  }

  // Fetch bendahara / admin contact
  const { data: scContact } = await supabase
    .from("site_content")
    .select("content_value")
    .eq("content_key", "baitul_maal_contact")
    .maybeSingle();

  let bendaharaContact: { name: string; phone: string } | null = null;
  if (scContact?.content_value) {
    try {
      bendaharaContact = JSON.parse(scContact.content_value);
    } catch {}
  }

  if (!bendaharaContact) {
    // Fallback: look up user with bendahara or admin role
    const { data: managerProfile } = await supabase
      .from("profiles")
      .select("nama_panggilan, no_whatsapp")
      .in("role", ["bendahara", "admin"])
      .not("no_whatsapp", "is", null)
      .limit(1)
      .maybeSingle();

    if (managerProfile && managerProfile.no_whatsapp) {
      bendaharaContact = {
        name: managerProfile.nama_panggilan || "Bendahara",
        phone: managerProfile.no_whatsapp,
      };
    }
  }

  return (
    <BaitulMaalClient 
      initialTransactions={transactions} 
      isAdmin={isManager} 
      currentUser={{
        id: user.id,
        name: profile?.nama_panggilan || "Kolega",
        role: isManager ? (profile?.role === "bendahara" ? "bendahara" : "admin") : (profile?.role || "member"),
      }}
      initialBankAccounts={bankAccounts}
      bendaharaContact={bendaharaContact}
    />
  );
}
