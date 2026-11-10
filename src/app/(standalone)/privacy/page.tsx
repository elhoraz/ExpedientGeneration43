import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Kebijakan Privasi (Privacy Policy) - Expedient 43",
  description:
    "Kebijakan privasi dan perlindungan data pribadi platform Expedient Generation 43 Pondok Modern Arrisalah Slahung sesuai UU PDP No. 27/2022 dan regulasi Google Play Store.",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}

