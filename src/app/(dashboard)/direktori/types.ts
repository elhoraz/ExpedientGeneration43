export interface ProfileItem {
  id: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  jenis_kelamin: string | null;
  foto_profil: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat_lengkap: string | null;
  cita_cita: string | null;
  motivasi_hidup: string | null;
  akun_ig: string | null;
  akun_tiktok: string | null;
  no_whatsapp: string | null;
  role: string | null;
  is_active: boolean | null;
  prestise_points?: number | null;
  kelas?: string | null;
  tahun_masuk?: number | null;
  tahun_lulus?: number | null;
  privacy_settings?: {
    show_whatsapp?: boolean;
    show_social?: boolean;
    show_domisili?: boolean;
  } | null;
}

export function buildWhatsAppLink(
  user: ProfileItem,
  isLoggedIn: boolean,
  currentUserId: string | null
): string | null {
  if (!isLoggedIn || !user.no_whatsapp) return null;
  const isOwner = Boolean(currentUserId && currentUserId === user.id);
  const isPublic = user.privacy_settings?.show_whatsapp !== false;
  if (!isPublic && !isOwner) return null;

  let raw = user.no_whatsapp.replace(/\D/g, "");
  if (!raw) return null;
  if (raw.startsWith("0")) raw = "62" + raw.slice(1);
  if (!raw.startsWith("62")) raw = "62" + raw;
  return `https://wa.me/${raw}?text=${encodeURIComponent(
    "Assalamu'alaikum sahabat Expedient 43..."
  )}`;
}

export function buildVCardPayload(
  user: ProfileItem,
  isLoggedIn: boolean,
  currentUserId: string | null
): string {
  const isOwner = Boolean(currentUserId && currentUserId === user.id);
  const isWaHidden = !isLoggedIn || (user.privacy_settings?.show_whatsapp === false && !isOwner);
  let rawPhone = (user.no_whatsapp || "").replace(/\D/g, "");
  if (rawPhone.startsWith("0")) rawPhone = "62" + rawPhone.slice(1);
  const phoneFormatted = rawPhone ? `+${rawPhone}` : "";

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${user.nama_lengkap || user.nama_panggilan || "Alumni 43"}`,
    `N:${user.nama_lengkap || user.nama_panggilan || "Alumni 43"};;;;`,
    `NICKNAME:${user.nama_panggilan || ""}`,
    "ORG:Expedient Generation 43",
    !isWaHidden && phoneFormatted ? `TEL;TYPE=CELL,VOICE:${phoneFormatted}` : "",
    "NOTE:Alumni Expedient Generation Angkatan 43",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");
}

