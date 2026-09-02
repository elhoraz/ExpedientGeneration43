import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DivineClient from "./DivineClient";

export const metadata = {
  title: "Kalam Ilahi",
};

export default async function DivinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // We have the verses in the component for standalone offline-capability if DB is not seeded
  // But we can just use a constant list of 32 verses inside DivineClient to match the CI4 implementation.

  return (
    <DivineClient />
  );
}
