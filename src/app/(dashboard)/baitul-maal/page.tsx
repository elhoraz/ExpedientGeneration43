import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BaitulMaalClient from "./BaitulMaalClient";

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
    .select("nama_panggilan, role, foto_profil")
    .eq("id", user.id)
    .single();

  // Fetch transactions
  const { data: rawTransactions } = await supabase
    .from("baitul_maal_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  // Safe mapping of donor names
  const userIds = Array.from(new Set(rawTransactions?.map((t: any) => t.user_id).filter(Boolean)));
  const profileMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nama_panggilan")
      .in("id", userIds);
    profiles?.forEach((p: any) => profileMap.set(p.id, p.nama_panggilan));
  }

  const transactions = (rawTransactions || []).map((t: any) => ({
    ...t,
    donor_name: t.user_id ? (profileMap.get(t.user_id) || "Hamba Allah") : "Hamba Allah",
  }));

  const isManager = profile?.role === "admin" || profile?.role === "bendahara";

  return (
    <BaitulMaalClient 
      initialTransactions={transactions} 
      isAdmin={isManager} 
      currentUser={{
        id: user.id,
        name: profile?.nama_panggilan || "Kolega",
        role: profile?.role || "member",
      }} 
    />
  );
}
