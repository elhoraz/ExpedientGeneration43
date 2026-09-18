import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PhotoboothDynamic from "./PhotoboothDynamic";

export const metadata = {
  title: "Studio Photobooth | Expedient Generation",
  description: "Abadikan momen kebersamaan dan cetak kenangan photostrip eksklusif Expedient 43rd Arrisalah.",
};

export default async function PhotoboothPage() {
  return <PhotoboothDynamic />;
}
