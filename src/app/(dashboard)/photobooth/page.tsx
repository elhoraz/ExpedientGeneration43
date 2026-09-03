import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PhotoboothClient from "./PhotoboothClient";

export const metadata = {
  title: "Studio Photobooth | Expedient Generation",
  description: "Abadikan momen kebersamaan dan cetak kenangan photostrip eksklusif Expedient 42nd Arrisalah.",
};

export default async function PhotoboothPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <PhotoboothClient />;
}
