import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RadarClient from "./RadarClient";
import "./radar.css";

export const metadata = {
  title: "Jaringan Silaturahmi - Expedient",
};

export default async function RadarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get users with coordinates
  const { data: users } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, nama_panggilan, jenis_kelamin, tempat_lahir, alamat_lengkap, lat, lng, foto_profil, no_whatsapp")
    .not("lat", "is", null)
    .not("lng", "is", null);

  const nodes = [];

  nodes.push({
    id: "center",
    name: "Pondok Modern Arrisalah",
    nick: "Arrisalah",
    city: "Ponorogo, Jawa Timur",
    lat: -8.0358875,
    lng: 111.4145280,
    type: "center",
    foto: null,
    wa: null,
    gender: null,
  });

  if (users) {
    users.forEach((u: any) => {
      let city = "Lokasi Tidak Diketahui";
      if (u.alamat_lengkap) city = u.alamat_lengkap;
      else if (u.tempat_lahir) city = u.tempat_lahir;

      nodes.push({
        id: u.id,
        name: u.nama_lengkap,
        nick: u.nama_panggilan || '',
        city: city,
        lat: parseFloat(u.lat),
        lng: parseFloat(u.lng),
        type: "agent",
        foto: u.foto_profil || null,
        wa: u.no_whatsapp || null,
        gender: u.jenis_kelamin || null,
      });
    });
  }

  return <RadarClient nodes={nodes} />;
}
