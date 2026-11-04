import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MultazamClient from "./MultazamClient";

export const metadata = {
  title: "Protokol Multazam - Expedient",
};

export default async function MultazamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let activeTicket = null;
  let prayers: any[] = [];

  try {
      const { data: ticket } = await supabase
        .from("event_rsvps")
        .select("*, events(*)")
        .eq("user_id", user.id)
        .eq("status", "Hadir")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      activeTicket = ticket ? {
          event_id: ticket.event_id,
          title: ticket.events.title,
          description: ticket.events.description,
          event_date: ticket.events.event_date,
          location: ticket.events.location,
          dresscode: "Formal / Sesuai Tema",
          seat_number: "VVIP"
      } : null;

      const { data: prayersData } = await supabase
        .from("prayers")
        .select("*")
        .order("created_at", { ascending: false });
        
      prayers = prayersData || [];
  } catch (err) {
      console.warn("Tables might not exist yet", err);
  }

  return <MultazamClient activeTicket={activeTicket} initialPrayers={prayers} userId={user.id} />;
}
