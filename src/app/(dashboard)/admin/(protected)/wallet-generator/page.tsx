import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WalletClient from "./WalletClient";

export const metadata = {
  title: "Wallet Generator - Admin",
};

export default async function WalletGeneratorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, nama_panggilan, no_whatsapp");

  return (
    <WalletClient users={users || []} />
  );
}
