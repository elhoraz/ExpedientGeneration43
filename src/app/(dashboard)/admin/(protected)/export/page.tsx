import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExportClient from "./ExportClient";

export const metadata = {
  title: "Export Data - Admin",
};

export default async function ExportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Double check admin role


  return (
    <ExportClient />
  );
}
