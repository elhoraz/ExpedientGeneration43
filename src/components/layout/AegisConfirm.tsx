"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type ConfirmOptions = {
  title: string;
  message: string;
  isAlert?: boolean; // If true, only show OK button
};

const ConfirmContext = createContext<{
  showConfirm: (title: string, message: string) => Promise<boolean>;
  showAlert: (title: string, message: string) => Promise<void>;
}>({
  showConfirm: async () => false,
  showAlert: async () => {},
});

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { locale, isRTL } = useLanguage();
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (val: boolean) => void }) | null>(null);

  const showConfirm = useCallback((title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ title, message, isAlert: false, resolve });
      if (navigator.vibrate) navigator.vibrate(50);
    });
  }, []);

  const showAlert = useCallback((title: string, message: string) => {
    return new Promise<void>((resolve) => {
      setDialog({ title, message, isAlert: true, resolve: () => resolve() });
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (navigator.vibrate) navigator.vibrate(20);
    if (dialog) {
      dialog.resolve(result);
      setDialog(null);
    }
  };

const DIALOG_TITLE_I18N: Record<string, { en: string; ar: string }> = {
  "Peringatan": { en: "Warning", ar: "تحذير" },
  "Berhasil": { en: "Success", ar: "نجاح" },
  "Sukses": { en: "Success", ar: "نجاح" },
  "Gagal": { en: "Failed", ar: "فشل" },
  "Error": { en: "Error", ar: "خطأ" },
  "Validasi Gagal": { en: "Validation Failed", ar: "فشل التحقق" },
  "Akses Ditolak": { en: "Access Denied", ar: "تم رفض الوصول" },
  "Informasi": { en: "Information", ar: "معلومات" },
  "Info": { en: "Information", ar: "معلومات" },
  "Tidak Tersedia": { en: "Not Available", ar: "غير متاح" },
  "Tidak Didukung": { en: "Not Supported", ar: "غير مدعوم" },
  "Disegel Resmi": { en: "Officially Sealed", ar: "مختوم رسمياً" },
  "Enkripsi Gagal": { en: "Encryption Failed", ar: "فشل التشفير" },
  "Izin Diperlukan": { en: "Permission Required", ar: "الإذن مطلوب" },
  "Setujui Permohonan": { en: "Approve Request", ar: "الموافقة على الطلب" },
  "Tolak Permohonan": { en: "Reject Request", ar: "رفض الطلب" },
  "Konfirmasi": { en: "Confirmation", ar: "تأكيد" },
  "Reset Target Khatam": { en: "Reset Khatam Target", ar: "إعادة تعيين هدف الختمة" },
  "Reset Seluruh Dzikir": { en: "Reset All Dhikr", ar: "إعادة ضبط جميع الأذكار" },
  "Hapus Akun & Data": { en: "Delete Account & Data", ar: "حذف الحساب والبيانات" },
  "Keluar Sesi": { en: "Sign Out", ar: "تسجيل الخروج" },
};

const DIALOG_MESSAGE_I18N: Record<string, { en: string; ar: string }> = {
  "Pesan harus minimal 10 karakter.": { en: "Message must be at least 10 characters.", ar: "يجب ألا تقل الرسالة عن 10 أحرف." },
  "Kunci akses harus minimal 4 karakter.": { en: "Passphrase key must be at least 4 characters.", ar: "يجب ألا يقل مفتاح المرور عن 4 أحرف." },
  "Ukuran gambar maksimal 5MB.": { en: "Maximum image size is 5MB.", ar: "الحد الأقصى لحجم الصورة هو 5 ميغابايت." },
  "Ukuran foto produk maksimal 5MB.": { en: "Maximum product photo size is 5MB.", ar: "الحد الأقصى لحجم صورة المنتج هو 5 ميغابايت." },
  "Ukuran file maksimal 10MB.": { en: "Maximum file size is 10MB.", ar: "الحد الأقصى لحجم الملف هو 10 ميغابايت." },
  "Gagal mengunggah foto produk": { en: "Failed to upload product photo.", ar: "فشل تحميل صورة المنتج." },
  "Format enkripsi tidak didukung di versi ini.": { en: "Encryption format is not supported in this version.", ar: "صيغة التشفير غير مدعومة في هذا الإصدار." },
  "Gagal membuka segel: Kunci akses tidak cocok.": { en: "Failed to unseal: Passphrase key is incorrect.", ar: "فشل فك الختم: مفتاح المرور غير متطابق." },
  "Munajat berhasil dipanjatkan.": { en: "Supplication successfully sent.", ar: "تم رفع الدعاء والمناجاة بنجاح." },
  "Data usaha berhasil dihapus.": { en: "Business listing removed successfully.", ar: "تم حذف بيانات المشروع بنجاح." },
  "Website dan data bisnis berhasil disimpan!": { en: "Business profile and website saved successfully!", ar: "تم حفظ بيانات المشروع والموقع بنجاح!" },
  "Pemilik bisnis belum mencantumkan nomor WhatsApp yang aktif.": { en: "The owner has not provided an active WhatsApp number.", ar: "لم يقم صاحب العمل بإدراج رقم واتساب نشط." },
  "Pemilik belum mencantumkan nomor WhatsApp yang aktif.": { en: "The owner has not provided an active WhatsApp number.", ar: "لم يقم صاحب العمل بإدراج رقم واتساب نشط." },
  "Silakan pilih target mentor atau bisnis terlebih dahulu.": { en: "Please select a mentor or business target first.", ar: "يرجى تحديد المرشد أو الفرصة المستهدفة أولاً." },
  "Gagal mengirimkan permohonan.": { en: "Failed to submit request.", ar: "فشل إرسال الطلب." },
  "Judul materi kajian wajib diisi.": { en: "Study material title is required.", ar: "عنوان مادة اللقاء مطلوب." },
  "Materi kajian baru berhasil ditambahkan.": { en: "New study material added successfully.", ar: "تمت إضافة مادة دراسية جديدة بنجاح." },
  "Gagal menambahkan materi.": { en: "Failed to add study material.", ar: "فشل إضافة المادة الدراسية." },
  "Angkat tangan telah dibatalkan.": { en: "Raise hand cancelled.", ar: "تم إلغاء رفع اليد." },
  "Permintaan bicara (Raise Hand) terkirim. Menunggu persetujuan Admin.": { en: "Raise hand request sent. Awaiting Admin approval.", ar: "تم إرسال طلب التحدث، في انتظار موافقة المشرف." },
  "Koneksi ke ruangan belum terhubung. Silakan coba beberapa detik lagi.": { en: "Room connection is not established yet. Please try again shortly.", ar: "الاتصال بالغرفة غير مستقر، يرجى المحاولة بعد قليل." },
  "Hanya Pimpinan Sidang (Admin) yang berhak mengatur dan menghentikan pembicara.": { en: "Only Session Leaders (Admin) have authority to manage speakers.", ar: "يحق فقط لرئيس الجلسة (المشرف) إدارة المتحدثين." },
  "Sesi bicara Anda sedang berlangsung. Hanya Pimpinan Sidang (Admin) yang berhak menghentikan sesi podium.": { en: "Your speaking session is active. Only Session Leaders can conclude the session.", ar: "جلستك الصوتية نشطة، يحق فقط لرئيس الجلسة إنهاء التحدث." },
  "Permintaan bicara Anda telah diajukan. Harap tunggu persetujuan Pimpinan Sidang.": { en: "Your speaking request is submitted. Please await Session Leader approval.", ar: "تم تقديم طلب التحدث، يرجى انتظار اعتماد رئيس الجلسة." },
  "Anda harus menjadi pembicara aktif terlebih dahulu sebelum bisa menyalakan kamera.": { en: "You must be an active speaker before activating your camera.", ar: "يجب أن تكون متحدثاً معتمداً قبل تشغيل الكاميرا." },
  "Judul mosi minimal 5 karakter.": { en: "Motion title must be at least 5 characters.", ar: "عنوان الاقتراح يجب ألا يقل عن 5 أحرف." },
  "Deskripsi mosi minimal 10 karakter.": { en: "Motion description must be at least 10 characters.", ar: "وصف الاقتراح يجب ألا يقل عن 10 أحرف." },
  "Mosi berhasil diajukan ke forum.": { en: "Motion successfully submitted to the assembly.", ar: "تم تقديم الاقتراح إلى المجلس بنجاح." },
  "Gagal mengajukan mosi.": { en: "Failed to submit motion.", ar: "فشل تقديم الاقتراح." },
  "Hanya pembuat mosi atau admin yang dapat menutup voting.": { en: "Only the motion author or admin can conclude the vote.", ar: "يحق فقط لصاحب الاقتراح أو المشرف إغلاق التصويت." },
  "Gagal menutup sesi voting.": { en: "Failed to conclude voting session.", ar: "فشل إغلاق جلسة التصويت." },
  "Gagal merekam suara.": { en: "Failed to record voice vote.", ar: "فشل تسجيل التصويت الصوتي." },
  "Gagal mengirim pesan suara.": { en: "Failed to send voice note.", ar: "فشل إرسال الرسالة الصوتية." },
  "Gagal mengirim video pesan.": { en: "Failed to send video message.", ar: "فشل إرسال رسالة الفيديو." },
  "Gagal mengunggah gambar.": { en: "Failed to upload image.", ar: "فشل تحميل الصورة." },
  "Fitur FaceID / Sidik Jari untuk Admin sedang dalam pengembangan.": { en: "FaceID / Biometric authentication for Admin is under development.", ar: "خاصية التعرف على الوجه / البصمة قيد التطوير حالياً." },
};

function getLocalizedText(rawText: string, locale: "id" | "en" | "ar", isTitle: boolean): string {
  if (locale === "id") return rawText;
  const map = isTitle ? DIALOG_TITLE_I18N : DIALOG_MESSAGE_I18N;
  const match = map[rawText];
  if (match) {
    return locale === "ar" ? match.ar : match.en;
  }
  return rawText;
}

  return (
    <ConfirmContext.Provider value={{ showConfirm, showAlert }}>
      {children}
      {dialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            zIndex: 100000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              background: "rgba(15, 18, 16, 0.9)",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              borderRadius: "20px",
              padding: "35px 30px",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              fontFamily: isRTL ? "var(--font-amiri, serif), 'Inter', sans-serif" : "'Inter', sans-serif",
              animation: "slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2)",
            }}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div style={{ fontSize: "3rem", color: "#d4af37", marginBottom: "15px" }}>
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <h3 style={{ color: "#d4af37", fontFamily: isRTL ? "inherit" : "'Playfair Display', serif", margin: "0 0 15px 0", fontSize: "1.5rem" }}>
              {getLocalizedText(dialog.title, locale, true)}
            </h3>
            <p style={{ color: "#ccc", fontSize: "0.95rem", marginBottom: "30px", lineHeight: "1.5" }}>
              {getLocalizedText(dialog.message, locale, false)}
            </p>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              {!dialog.isAlert && (
                <button
                  onClick={() => handleClose(false)}
                  style={{
                    flex: 1,
                    padding: "12px 15px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#fff",
                    borderRadius: "50px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    transition: "0.3s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                >
                  {locale === "ar" ? "إلغاء" : locale === "en" ? "CANCEL" : "BATAL"}
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                style={{
                  flex: 1,
                  padding: "12px 15px",
                  border: "none",
                  background: "linear-gradient(135deg, #d4af37, #aa8529)",
                  color: "#000",
                  borderRadius: "50px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  transition: "0.3s",
                  boxShadow: "0 5px 15px rgba(212, 175, 55, 0.3)",
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {dialog.isAlert
                  ? (locale === "ar" ? "حسناً، فهمت" : locale === "en" ? "UNDERSTOOD" : "MENGERTI")
                  : (locale === "ar" ? "نعم، متابعة" : locale === "en" ? "YES, PROCEED" : "YA, LANJUTKAN")}
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(30px); }
              to { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
