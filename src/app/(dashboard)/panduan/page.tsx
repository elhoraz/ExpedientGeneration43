import type { Metadata } from "next";
import PanduanClient from "./PanduanClient";

export const metadata: Metadata = {
  title: "Pusat Panduan & Bantuan Alumni",
  description: "Panduan lengkap penggunaan fitur, fungsi tombol, dan tutorial aplikasi portal Expedient Generation.",
};

export default function PanduanPage() {
  return <PanduanClient />;
}
