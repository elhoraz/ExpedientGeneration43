import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SyndicateForm from "../SyndicateForm";

export const metadata = {
  title: "Registrasi Syndicate | Expedient",
};

export default async function CreateSyndicatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Ambil nomor WA user
  const { data: profile } = await supabase
    .from("profiles")
    .select("no_whatsapp")
    .eq("id", user.id)
    .single();

  return <SyndicateForm userId={user.id} userWhatsapp={profile?.no_whatsapp || ""} />;
}
