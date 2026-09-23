import type { Metadata } from "next";
import DownloadClient from "./DownloadClient";

export const metadata: Metadata = {
  title: "Download Aplikasi Resmi Expedient 43 (Android APK & PWA)",
  description: "Unduh dan pasang aplikasi mobile resmi komunitas alumni Expedient Generation 43 (Pondok Modern Arrisalah) untuk perangkat Android dan iOS.",
};

export default function DownloadPage() {
  return <DownloadClient />;
}
