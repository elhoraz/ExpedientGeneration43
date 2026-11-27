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

  // Fetch transactions, bank accounts, & bendahara contact in parallel
  const [
    { data: profile },
    { data: rawTransactions },
    { data: scData },
    { data: scContact },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("nama_panggilan, role, foto_profil, no_whatsapp")
      .eq("id", user.id)
      .single(),
    supabase
      .from("baitul_maal_transactions")
      .select("id, user_id, transaction_type, amount, description, status, proof_url, created_at")
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("site_content")
      .select("content_value")
      .eq("content_key", "baitul_maal_bank_accounts")
      .maybeSingle(),
    supabase
      .from("site_content")
      .select("content_value")
      .eq("content_key", "baitul_maal_contact")
      .maybeSingle(),
  ]);

  // Check admin/bendahara access (Role or HMAC session cookie)
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;
  const isSignedAdmin = await verifySignedAdminSession(adminToken);
  const isManager = profile?.role === "admin" || profile?.role === "bendahara" || profile?.role === "superadmin" || isSignedAdmin;

  // Security Filter: Regular members only see completed entries or their own
  const filteredRows = (rawTransactions || []).filter((t: any) => {
    if (isManager) return true;
    if (t.status === "completed" || !t.status) {
      return !t.description?.startsWith("[PENDING VERIFIKASI]");
    }
    return user && t.user_id === user.id;
  });

  // Safe mapping of donor names & fallback bendahara contact
  const userIds = Array.from(new Set(filteredRows.map((t: any) => t.user_id).filter(Boolean)));

  let bankAccounts: any[] = [];
  if (scData?.content_value) {
    try {
      bankAccounts = JSON.parse(scData.content_value);
    } catch {}
  }

  let bendaharaContact: { name: string; phone: string } | null = null;
  if (scContact?.content_value) {
    try {
      bendaharaContact = JSON.parse(scContact.content_value);
    } catch {}
  }

  const [{ data: profiles }, fallbackManagerResult] = await Promise.all([
    userIds.length > 0
      ? supabase.from("profiles").select("id, nama_panggilan").in("id", userIds)
      : Promise.resolve({ data: [] as any[] }),
    !bendaharaContact
      ? supabase
          .from("profiles")
          .select("nama_panggilan, no_whatsapp")
          .in("role", ["bendahara", "admin"])
          .not("no_whatsapp", "is", null)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profileMap = new Map<string, string>();
  profiles?.forEach((p: any) => profileMap.set(p.id, p.nama_panggilan));

  const transactions = filteredRows.map((t: any) => {
    const isOut = t.transaction_type === "OUT" || t.transaction_type === "pengeluaran";
    return {
      ...t,
      transaction_type: (isOut ? "OUT" : "IN") as "IN" | "OUT",
      raw_type: t.transaction_type,
      donor_name: t.user_id ? (profileMap.get(t.user_id) || "Hamba Allah") : "Hamba Allah",
    };
  });

  if (!bendaharaContact) {
    const managerProfile = fallbackManagerResult?.data;
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
