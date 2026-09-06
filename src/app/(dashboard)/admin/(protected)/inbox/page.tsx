import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InboxClient from "./InboxClient";

export const metadata = {
  title: "WhatsApp Inbox - Admin Expedient",
  description: "Kotak masuk dan manajemen pesan WhatsApp Cloud API resmi Expedient Generation",
};

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <InboxClient />;
}
