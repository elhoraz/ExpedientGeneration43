import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TarbiyahClient from "./TarbiyahClient";

export const metadata = {
  title: "Tarbiyah Nexus - Expedient",
};

export default async function TarbiyahNexusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch current user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nama_panggilan, nama_lengkap, role, foto_profil, motivasi_hidup, pekerjaan")
    .eq("id", user.id)
    .single();

  const currentUser = {
    id: user.id,
    name: profile?.nama_panggilan || profile?.nama_lengkap || "Kolega",
    role: profile?.role || "member",
    avatar: profile?.foto_profil,
  };

  // 2. Fetch mentors (other profiles)
  const { data: mentorsRaw } = await supabase
    .from("profiles")
    .select("id, nama_panggilan, nama_lengkap, foto_profil, motivasi_hidup, role, pekerjaan, alamat_sekarang")
    .neq("id", user.id)
    .limit(20);

  // 3. Fetch tenders (syndicate businesses)
  const { data: tendersRaw } = await supabase
    .from("syndicate")
    .select("id, nama_bisnis, kategori, deskripsi, logo_url, user_id, kontak")
    .order("created_at", { ascending: false })
    .limit(20);

  // 4. Fetch user's syndicate business IDs (to check for incoming tender requests)
  const mySyndicateIds = tendersRaw?.filter(t => t.user_id === user.id).map(t => t.id) || [];

  // 5. Fetch sent requests (Permohonan Keluar)
  const { data: sentRequestsRaw } = await supabase
    .from("tarbiyah_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 6. Fetch incoming requests (Permohonan Masuk: as mentor or syndicate owner)
  let incomingRequestsQuery = supabase
    .from("tarbiyah_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (mySyndicateIds.length > 0) {
    incomingRequestsQuery = incomingRequestsQuery.or(`target_id.eq.${user.id},target_id.in.(${mySyndicateIds.join(",")})`);
  } else {
    incomingRequestsQuery = incomingRequestsQuery.eq("target_id", user.id);
  }

  const { data: incomingRequestsRaw } = await incomingRequestsQuery;

  // 7. Safe Profile Mapping for Sent & Incoming Requests
  const allUserIdsToFetch = new Set<string>();
  sentRequestsRaw?.forEach((r: any) => {
    if (r.type === "Mentor") allUserIdsToFetch.add(r.target_id);
  });
  incomingRequestsRaw?.forEach((r: any) => {
    allUserIdsToFetch.add(r.user_id);
  });
  tendersRaw?.forEach((t: any) => {
    if (t.user_id) allUserIdsToFetch.add(t.user_id);
  });

  const profileMap = new Map<string, any>();
  if (allUserIdsToFetch.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nama_panggilan, nama_lengkap, foto_profil, role, pekerjaan")
      .in("id", Array.from(allUserIdsToFetch));
    profiles?.forEach(p => profileMap.set(p.id, p));
  }

  const syndicateMap = new Map<string, any>();
  tendersRaw?.forEach(t => syndicateMap.set(t.id, t));

  // Map Sent Requests with target details
  const sentRequests = (sentRequestsRaw || []).map((r: any) => {
    let targetName = "Target Tidak Diketahui";
    let targetSubtitle = "";
    let targetAvatar = "";

    if (r.type === "Mentor") {
      const p = profileMap.get(r.target_id);
      targetName = p?.nama_panggilan || p?.nama_lengkap || "Mentor";
      targetSubtitle = p?.pekerjaan || "Mentor Profesional";
      targetAvatar = p?.foto_profil;
    } else if (r.type === "Tender") {
      const s = syndicateMap.get(r.target_id);
      targetName = s?.nama_bisnis || "Tender Bisnis";
      targetSubtitle = s?.kategori || "B2B Syndicate";
      targetAvatar = s?.logo_url;
    }

    return {
      ...r,
      target_name: targetName,
      target_subtitle: targetSubtitle,
      target_avatar: targetAvatar,
    };
  });

  // Map Incoming Requests with requester details
  const incomingRequests = (incomingRequestsRaw || []).map((r: any) => {
    const requester = profileMap.get(r.user_id);
    let targetName = "Permohonan untuk Anda";
    if (r.type === "Tender") {
      const s = syndicateMap.get(r.target_id);
      targetName = s?.nama_bisnis || "Bisnis Anda";
    }

    return {
      ...r,
      requester_name: requester?.nama_panggilan || requester?.nama_lengkap || "Kolega",
      requester_role: requester?.role || "member",
      requester_avatar: requester?.foto_profil,
      target_name: targetName,
    };
  });

  // 8. Fetch materi kajian
  const { data: materiList } = await supabase
    .from("tarbiyah_materi")
    .select("*")
    .order("event_date", { ascending: false });

  return (
    <TarbiyahClient
      currentUser={currentUser}
      mentors={mentorsRaw || []}
      tenders={tendersRaw || []}
      sentRequests={sentRequests}
      incomingRequests={incomingRequests}
      initialMateri={materiList || []}
    />
  );
}
