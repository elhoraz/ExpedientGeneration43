import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline | Expedient Generation",
  description: "Anda sedang tidak terhubung ke jaringan internet.",
};

import OfflineClient from "./OfflineClient";

export default function OfflinePage() {
  return <OfflineClient />;
}
