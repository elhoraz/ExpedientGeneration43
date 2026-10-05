/**
 * Modul Apresiasi & Traktir Kopi Developer (Website & Bot Expedient 43)
 * Menangani pertanyaan rekening/QRIS developer secara alami (tanpa command tanda seru !)
 * dan merespons bukti transfer dengan ucapan terima kasih tulus serta doa berkah.
 */

export function isDeveloperSupportInquiry(text: string): boolean {
  if (!text) return false;
  const lower = text.trim().toLowerCase();

  // Pola alami pertanyaan seputar traktir kopi / donasi developer / bantuan server
  const patterns = [
    /\b(traktir|beliin|kasih|beli|sedekah)\s*(an\s*)?(kopi|es\s*teh|camilan)?\s*(dev|developer|pembuat|admin|min|bot)?\b/i,
    /\b(rekening|norek|no\s*rek|qris|saweria)\s*(dev|developer|admin|pembuat|web|bot|server|kopi)\b/i,
    /\b(bantu|support|dukung|donasi|sawer)\s*(biaya\s*)?(dev|developer|server|hosting|pembuat|web|website|kopi)\b/i,
    /\b(cara\s*)?(traktir\s*kopi|sawer\s*kopi|donasi\s*web|beli\s*kopi)\b/i,
    /\b(mau|ingin|pengen)\s*(traktir|bantu|donasi|sawer)\b/i,
    /\brekening\s*pengembang\b/i,
    /\bkopi\s*(admin|dev|developer)\b/i,
  ];

  return patterns.some((p) => p.test(lower));
}

/**
 * Pesan bersahabat dan santun berisi rekening / QRIS developer (tanpa nama penerima)
 */
export function getDeveloperSupportMessage(): string {
  return (
    `☕ *Traktir Kopi & Dukungan Operasional Server*\n\n` +
    `Masya Allah, terima kasih banyak atas perhatian dan kepedulian Sahabat terhadap kelancaran website & bot WhatsApp Expedient 43! 🤲✨\n\n` +
    `Bagi sahabat yang ingin mentraktir secangkir kopi santai atau mendukung biaya operasional server, silakan langsung scan kode QRIS di atas:\n\n` +
    `📱 *QRIS (Mendukung Seluruh Bank & E-Wallet):*\n` +
    `   • Bisa discan via BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, ShopeePay, dll.\n\n` +
    `Semoga setiap rupiah yang disalurkan menjadi amal jariyah, diganti oleh Allah dengan keberkahan rezeki yang berlipat ganda, serta dilapangkan segala urusan antum sekeluarga. Aamiin ya Rabbal 'Alamin. ☕🌿`
  );
}

/**
 * Cek apakah struk transfer yang dikirim ditujukan untuk traktir kopi developer
 */
export function isDeveloperCoffeeReceipt(ocrText: string, caption?: string): boolean {
  const combined = `${ocrText} ${caption || ""}`.toLowerCase();
  return (
    combined.includes("kopi") ||
    combined.includes("developer") ||
    combined.includes("server") ||
    combined.includes("web") ||
    combined.includes("traktir") ||
    combined.includes("id1026582005231")
  );
}

/**
 * Balasan terima kasih dan doa tulus untuk sahabat yang mentraktir kopi developer
 * (Sederhana, hangat, tanpa menyebut nama penerima)
 */
export function getDeveloperCoffeeThankYou(senderName: string): string {
  const name = senderName || "Sahabat";
  return (
    `Alhamdulillah, jazakumullah khairan katsiran Sahabat *${name}*! ☕🤲\n\n` +
    `Dukungan dan traktiran kopinya sudah diterima dengan penuh rasa syukur. Semoga sistem website & bot Expedient 43 semakin bermanfaat untuk seluruh alumni.\n\n` +
    `Semoga Allah membalas kebaikan hati antum dengan keberkahan rezeki yang melimpah ruah, kesehatan lahir batin, dan kemudahan dalam setiap langkah ikhtiar. Titip salam hangat untuk keluarga ya sahabat! ✨`
  );
}
