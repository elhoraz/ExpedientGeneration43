import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EventClient from "./EventClient";

export const metadata = {
  title: "Agenda & Eksibisi Expedient",
};

export default async function EventsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Handle missing tables gracefully
  let eventsWithStats: any[] = [];

  try {
    const { data: events, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        event_date,
        location,
        creator_id,
        profiles!creator_id(nama_panggilan)
      `)
      .order("event_date", { ascending: true });

    if (error) throw error;

    if (events) {
      // For each event, fetch RSVPs
      const { data: rsvps } = await supabase.from("event_rsvps").select("*");
      
      eventsWithStats = events.map(ev => {
        const eventRsvps = (rsvps || []).filter(r => r.event_id === ev.id);
        const myRsvp = eventRsvps.find(r => r.user_id === user.id)?.status || null;
        
        const stats = {
          Hadir: eventRsvps.filter(r => r.status === "Hadir").length,
          Tentatif: eventRsvps.filter(r => r.status === "Tentatif").length,
          Tidak: eventRsvps.filter(r => r.status === "Tidak Hadir").length,
        };

        return {
          ...ev,
          creator_name: (ev.profiles as any)?.nama_panggilan || "Unknown",
          stats,
          my_rsvp: myRsvp
        };
      });
    }
  } catch (err) {
    console.warn("Events table might not exist yet:", err);
  }

  return <EventClient initialEvents={eventsWithStats} userId={user.id} />;
}
