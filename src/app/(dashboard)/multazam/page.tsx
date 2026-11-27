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
        .select("event_id, events(title, description, event_date, location)")
        .eq("user_id", user.id)
        .eq("status", "Hadir")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const joinedEvent = ticket
        ? Array.isArray(ticket.events)
          ? ticket.events[0]
          : (ticket.events as { title?: string; description?: string; event_date?: string; location?: string } | null)
        : null;

      activeTicket = ticket && joinedEvent ? {
          event_id: ticket.event_id,
          title: joinedEvent.title,
          description: joinedEvent.description,
          event_date: joinedEvent.event_date,
          location: joinedEvent.location,
          dresscode: "Formal / Sesuai Tema",
          seat_number: "VVIP"
      } : null;

      const { data: prayersData } = await supabase
        .from("prayers")
        .select("id, prayer_text, status, created_at")
        .order("created_at", { ascending: false });
        
      prayers = prayersData || [];
  } catch (err) {
      console.warn("Tables might not exist yet", err);
  }

  return <MultazamClient activeTicket={activeTicket} initialPrayers={prayers} userId={user.id} />;
}
