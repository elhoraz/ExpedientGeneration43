import KiblatClient from "./KiblatClient";

export const metadata = {
  title: "Arah Kiblat & Jadwal Sholat",
  description: "Kompas arah kiblat, peta arah ke Makkah, dan jadwal sholat sesuai lokasi.",
};

export default function KiblatPage() {
  return <KiblatClient />;
}
