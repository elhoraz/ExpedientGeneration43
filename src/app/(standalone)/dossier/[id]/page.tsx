import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DossierClient from "./DossierClient";

export const metadata = {
  title: "Dossier Profil - Expedient",
};

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the target user profile
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!targetUser) {
    return (
      <div style={{ textAlign: "center", padding: "100px", color: "red", fontFamily: "monospace" }}>
        <h1>[ ERROR 404 ]</h1>
        <p>ENTITAS TIDAK DITEMUKAN ATAU AKSES DITOLAK.</p>
      </div>
    );
  }

  // Calculate age or get formatted date
  const birthDate = targetUser.tanggal_lahir ? new Date(targetUser.tanggal_lahir) : null;
  const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : 'N/A';

  return <DossierClient targetUser={targetUser} age={age} />;
}
