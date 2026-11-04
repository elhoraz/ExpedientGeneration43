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
        <p>DATA ALUMNI TIDAK DITEMUKAN ATAU AKSES DIBATASI.</p>
      </div>
    );
  }

  // Calculate age safely
  let age: string | number = 'N/A';
  if (targetUser.tanggal_lahir) {
    const parts = targetUser.tanggal_lahir.split(/[-/]/);
    if (parts.length >= 3) {
      let birthYear = parseInt(parts[0], 10);
      let birthMonth = parseInt(parts[1], 10);
      let birthDay = parseInt(parts[2], 10);
      if (parts[2].length === 4) {
        birthYear = parseInt(parts[2], 10);
        birthMonth = parseInt(parts[1], 10);
        birthDay = parseInt(parts[0], 10);
      }
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      let computedAge = now.getFullYear() - birthYear;
      const m = (now.getMonth() + 1) - birthMonth;
      if (m < 0 || (m === 0 && now.getDate() < birthDay)) {
        computedAge--;
      }
      if (computedAge > 0 && computedAge < 120) {
        age = computedAge;
      }
    }
  }

  return <DossierClient targetUser={targetUser} age={age} />;
}
