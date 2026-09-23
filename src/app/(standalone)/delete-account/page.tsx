import type { Metadata } from "next";
import DeleteAccountClient from "./DeleteAccountClient";

export const metadata: Metadata = {
  title: "Penghapusan Akun & Data Pribadi - Expedient 43",
  description: "Kebijakan dan formulir permintaan penghapusan akun serta data pribadi pengguna platform Expedient Generation 43 sesuai regulasi Google Play Store.",
};

export default function DeleteAccountPage() {
  return <DeleteAccountClient />;
}
