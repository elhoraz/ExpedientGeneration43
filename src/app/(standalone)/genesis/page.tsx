import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GenesisClient from "./GenesisClient";

export const metadata = {
  title: "The Genesis Core",
};

export default async function GenesisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <GenesisClient userId={user.id} />
  );
}
