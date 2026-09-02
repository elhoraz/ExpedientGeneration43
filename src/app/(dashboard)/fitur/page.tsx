import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FiturClient from "./FiturClient";

export const metadata = {
  title: "Fitur - Expedient",
};

export default async function FiturPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <FiturClient />;
}
