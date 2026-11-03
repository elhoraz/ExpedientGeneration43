import { redirect } from "next/navigation";

export const metadata = {
  title: "Mutiara Hikmah & Nasihat Santri - Expedient 43",
  description: "Koleksi kata mutiara, mahfuzhat, dan nasehat asatidz alumni Expedient Generation 43.",
};

export default function CelestialPage() {
  redirect("/mahfuzhat");
}
