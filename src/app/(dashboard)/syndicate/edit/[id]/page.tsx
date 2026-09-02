import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SyndicateForm from "../../SyndicateForm";

export const metadata = {
  title: "Edit Syndicate | Expedient",
};

export default async function EditSyndicatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch data
  const { data: syndicate, error } = await supabase
    .from("syndicate")
    .select("*")
    .eq("id", id)
    .single();

  if (!syndicate || syndicate.user_id !== user.id) {
    return redirect("/syndicate"); // Cannot edit someone else's or not found
  }

  // Ambil nomor WA user
  const { data: profile } = await supabase
    .from("profiles")
    .select("no_whatsapp")
    .eq("id", user.id)
    .single();

  return <SyndicateForm initialData={syndicate} userId={user.id} userWhatsapp={profile?.no_whatsapp || ""} />;
}
