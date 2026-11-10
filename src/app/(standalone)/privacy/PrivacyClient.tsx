"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function PrivacyClient() {
  const { isRTL: isRtl, dir, locale } = useLanguage();

  const isAr = locale === "ar";
  const isEn = locale === "en";

  return (
    <div
      dir={dir}
      style={{
        minHeight: "100dvh",
        backgroundColor: "#060b14",
        color: "#e6edf3",
        padding: "2.5rem 1rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        fontFamily: isRtl
          ? "var(--font-amiri, serif), var(--font-inter, sans-serif)"
          : "var(--font-inter, sans-serif)",
      }}
    >
      <article
        style={{
          maxWidth: "840px",
          width: "100%",
          background: "rgba(12, 21, 38, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(212, 175, 55, 0.28)",
          borderRadius: "20px",
          padding: "2.5rem 2rem",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.65)",
          position: "relative",
        }}
      >
        {/* Top Bar with Back Button & Language Switcher */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "1.25rem",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#94a3b8",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 500,
              transition: "color 0.2s ease",
            }}
          >
            <i className={`fa-solid ${isRtl ? "fa-arrow-right" : "fa-arrow-left"}`} />
            <span>
              {isAr
                ? "العودة إلى الصفحة الرئيسية"
                : isEn
                ? "Back to Home"
                : "Kembali ke Beranda"}
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/delete-account"
              style={{
                fontSize: "0.82rem",
                color: "#f87171",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
              }}
            >
              <i className="fa-solid fa-user-xmark" />
              <span>
                {isAr
                  ? "طلب حذف الحساب"
                  : isEn
                  ? "Account Deletion"
                  : "Hapus Akun"}
              </span>
            </Link>
            <LanguageSwitcher variant="pill" />
          </div>
        </div>

        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(212, 175, 55, 0.15)",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              color: "#f3ba2f",
              fontSize: "26px",
              marginBottom: "1.25rem",
            }}
          >
            <i className="fa-solid fa-shield-halved" />
          </div>
          <h1
            style={{
              fontFamily: isRtl ? "inherit" : "var(--font-playfair, serif)",
              fontSize: "2rem",
              color: "#f3ba2f",
              margin: "0 0 0.5rem 0",
              lineHeight: 1.25,
            }}
          >
            {isAr
              ? "سياسة الخصوصية وحماية البيانات"
              : isEn
              ? "Privacy Policy & Data Protection"
              : "Kebijakan Privasi & Perlindungan Data"}
          </h1>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "0.95rem",
              margin: "0 0 1rem 0",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.6,
            }}
          >
            {isAr
              ? "التزامنا الراسخ بحماية خصوصية وأمان بيانات خريجي الدفعة 43 - معهد الرسالة الحديث الإسلامي"
              : isEn
              ? "Our commitment to protecting the privacy and personal data of the 43rd Cohort Alumni — Pondok Modern Arrisalah."
              : "Komitmen perlindungan privasi & data pribadi alumni angkatan ke-43 Pondok Modern Arrisalah Slahung Ponorogo."}
          </p>

          {/* Compliance Badges */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#34d399",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              <i className="fa-solid fa-scale-balanced" />
              UU PDP No. 27/2022
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "rgba(59, 130, 246, 0.12)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                color: "#60a5fa",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              <i className="fa-brands fa-google-play" />
              Google Play Data Safety
            </span>
          </div>
        </header>

        {/* Content Body */}
        <div style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "#cbd5e1" }}>
          {/* Section 1: Pendahuluan */}
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                color: "#f3ba2f",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <i className="fa-solid fa-landmark" />
              {isAr
                ? "١. مقدمة وهوية الجهة المسؤولة"
                : isEn
                ? "1. Introduction & Data Controller Identity"
                : "1. Pendahuluan & Identitas Pengelola"}
            </h2>
            <p style={{ margin: "0 0 0.75rem 0" }}>
              {isAr
                ? "تطبيق ومنصة Expedient Generation 43 هي منصة رسمية غير تجارية مخصصة لأعضاء الدفعة 43 من معهد الرسالة الحديث الإسلامي الدولي (Slahung, Ponorogo, Jawa Timur). تخضع المنصة بالكامل لأحكام القانون الإندونيسي لحماية البيانات الشخصية رقم 27 لسنة 2022 (UU PDP)."
                : isEn
                ? "Expedient Generation 43 is the official, non-commercial digital hub and alumni registry for the 43rd Cohort of Pondok Modern Arrisalah International Program, Slahung, Ponorogo, East Java. This platform strictly complies with the Indonesian Personal Data Protection Act No. 27 of 2022 (UU PDP) and Google Play Developer Policies."
                : "Platform dan aplikasi Expedient Generation 43 adalah wadah digital resmi non-komersial bagi alumni angkatan ke-43 Pondok Modern Arrisalah Program Internasional, Slahung, Ponorogo, Jawa Timur. Platform ini dikelola oleh Badan Pengurus Alumni Angkatan 43 dengan komitmen penuh terhadap privasi dan perlindungan data pribadi sesuai amanat Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022) dan standar keamanan Google Play Store."}
            </p>
          </section>

          {/* Section 2: Data yang Dikumpulkan */}
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                color: "#f3ba2f",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <i className="fa-solid fa-database" />
              {isAr
                ? "٢. فئات البيانات الشخصية التي نجمعها"
                : isEn
                ? "2. Categories of Personal Data Collected"
                : "2. Kategori Data Pribadi yang Dikumpulkan"}
            </h2>
            <p style={{ margin: "0 0 1rem 0" }}>
              {isAr
                ? "نحن نجمع البيانات الضرورية فقط لخدمة أهداف التواصل الأخوي والأمان:"
                : isEn
                ? "We only collect data strictly necessary for alumni networking, verified brotherhood, and security:"
                : "Kami hanya mengumpulkan data yang relevan dan dibutuhkan untuk silaturahmi, keamanan identitas alumni, dan kelancaran fitur:"}
            </p>

            <div style={{ display: "grid", gap: "1rem" }}>
              {/* Card 2.1: Identitas & Profil */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                }}
              >
                <h3
                  style={{
                    color: "#f8fafc",
                    fontSize: "1.05rem",
                    margin: "0 0 0.5rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <i className="fa-solid fa-id-card" style={{ color: "#f3ba2f" }} />
                  {isAr
                    ? "أ. بيانات الملف الشخصي والاتصال"
                    : isEn
                    ? "a. Profile & Contact Information"
                    : "a. Data Profil & Kontak"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8" }}>
                  {isAr
                    ? "الاسم الكامل، اسم الشهرة (الكنية)، البريد الإلكتروني، رقم الواتساب، عنوان الإقامة/المدينة، السيرة الذاتية، الصورة الشخصية، ومجال التخصص أو المهنة الحالية."
                    : isEn
                    ? "Full name, nickname, email address, WhatsApp/phone number, residential address/city, bio, profile photo, and current professional field."
                    : "Nama lengkap, nama panggilan/kunyah, alamat email, nomor WhatsApp aktif, kota domisili, biografi singkat, foto profil, dan profesi/instansi alumni."}
                </p>
              </div>

              {/* Card 2.2: Data Biometrik */}
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                }}
              >
                <h3
                  style={{
                    color: "#fca5a5",
                    fontSize: "1.05rem",
                    margin: "0 0 0.5rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <i className="fa-solid fa-fingerprint" style={{ color: "#ef4444" }} />
                  {isAr
                    ? "ب. البيانات الحيوية (التعرف على الوجه و Passkey)"
                    : isEn
                    ? "b. Biometric Data (Face Recognition & WebAuthn / Passkeys)"
                    : "b. Data Biometrik Khusus (Face Recognition & Passkey/WebAuthn)"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#cbd5e1" }}>
                  {isAr
                    ? "ميزة التعرف على الوجه و Passkey اختيارية لتسجيل الدخول السريع، وتُعد بيانات حيوية حساسة بموجب قانون UU PDP. لا نخزّن صورة الوجه لهذا الغرض؛ يُحوَّل الوجه على جهازك إلى متجه رقمي (128 قيمة) ويُحفظ هذا المتجه في ملفك الشخصي في قاعدة البيانات. لا نشارك هذه البيانات مع أي طرف ثالث، ويمكنك حذفها بحذف حسابك."
                    : isEn
                    ? "Face recognition and passkeys are optional, used for quick sign-in, and are treated as sensitive biometric data under the UU PDP. We do not store a face photo for this purpose: your face is converted on your device into a numeric vector (128 values), and that vector is saved to your profile record in our database. It is not shared with third parties and is removed when you delete your account."
                    : "Fitur pengenalan wajah (Face API) dan Passkey bersifat opsional untuk login cepat, dan termasuk data pribadi spesifik menurut UU PDP. Kami tidak menyimpan foto wajah untuk fungsi ini: wajah diubah di perangkat antum menjadi vektor angka (128 nilai), lalu vektor tersebut disimpan di data profil antum pada database. Data ini tidak dibagikan ke pihak ketiga dan ikut terhapus saat akun dihapus."}
                </p>
              </div>

              {/* Card 2.3: Data Lokasi */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                }}
              >
                <h3
                  style={{
                    color: "#f8fafc",
                    fontSize: "1.05rem",
                    margin: "0 0 0.5rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <i className="fa-solid fa-location-dot" style={{ color: "#38bdf8" }} />
                  {isAr
                    ? "ج. بيانات الموقع الجغرافي (رادار الخريجين)"
                    : isEn
                    ? "c. Geolocation Data (Alumni Radar)"
                    : "c. Data Lokasi Geografis (Fitur Radar Alumni)"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8" }}>
                  {isAr
                    ? "تُجمع إحداثيات الموقع (خط العرض وخط الطول) فقط عندما تفتح ميزة رادار الخريجين وتمنح إذن الموقع، وذلك لإظهار الخريجين القريبين. يمكنك رفض إذن الموقع في جهازك في أي وقت، ولحذف الإحداثيات المحفوظة تواصل مع المشرف أو احذف حسابك."
                    : isEn
                    ? "Location coordinates (latitude & longitude) are collected only when you open the Alumni Radar feature and grant location permission, to show nearby alumni. You can revoke location permission in your device settings at any time; to remove coordinates already saved, contact the admin or delete your account."
                    : "Koordinat lokasi (latitude dan longitude) hanya dikumpulkan saat antum membuka fitur Radar Alumni dan memberi izin lokasi, untuk menampilkan alumni terdekat. Izin lokasi bisa dicabut kapan saja dari pengaturan perangkat; untuk menghapus koordinat yang sudah tersimpan, hubungi admin atau hapus akun."}
                </p>
              </div>

              {/* Card 2.4: Perangkat & Push Token */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                }}
              >
                <h3
                  style={{
                    color: "#f8fafc",
                    fontSize: "1.05rem",
                    margin: "0 0 0.5rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <i className="fa-solid fa-bell" style={{ color: "#a855f7" }} />
                  {isAr
                    ? "د. رمز الإشعارات ومعلومات الجهاز"
                    : isEn
                    ? "d. Push Notification Tokens & Technical Telemetry"
                    : "d. Token Notifikasi & Informasi Teknis Perangkat"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8" }}>
                  {isAr
                    ? "رمز جهاز Firebase Cloud Messaging (FCM)، نوع نظام التشغيل (Android / iOS / Web)، ونوع المتصفح لإرسال تنبيهات الأذان، تحديثات الفعاليات، ورسائل المحادثات."
                    : isEn
                    ? "Firebase Cloud Messaging (FCM) tokens, operating system type (Android / iOS / Web), and browser client info used to deliver prayer reminders, event invitations, and peer chat alerts."
                    : "Token Firebase Cloud Messaging (FCM) dan data sistem operasi perangkat (Android / iOS / PWA) digunakan secara ketat untuk pengiriman notifikasi adzan, pengumuman kabar angkatan, lelayu, dan notifikasi pesan masuk."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Tujuan Pengolahan Data */}
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                color: "#f3ba2f",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <i className="fa-solid fa-bullseye" />
              {isAr
                ? "٣. أغراض معالجة البيانات الشخصية"
                : isEn
                ? "3. Purposes of Data Processing"
                : "3. Tujuan Pemrosesan Data Pribadi"}
            </h2>
            <ul
              style={{
                margin: 0,
                paddingInlineStart: "1.25rem",
                display: "grid",
                gap: "0.5rem",
              }}
            >
              <li>
                <strong>Silaturahmi & Direktori:</strong> Menghubungkan sesama alumni
                angkatan 43 dan mempermudah komunikasi keluarga besar pondok.
              </li>
              <li>
                <strong>Otentikasi & Keamanan:</strong> Mencegah akses oleh pihak luar
                yang tidak berhak serta melindungi privasi internal alumni.
              </li>
              <li>
                <strong>Sosial & Filantropi (Baitul Maal):</strong> Pencatatan donasi
                sosial angkatan secara transparan dan akuntabel.
              </li>
              <li>
                <strong>Pengingat Ibadah:</strong> Menghitung jadwal sholat akurat
                sesuai koordinat lokasi berdasarkan kriteria hisab Kementerian Agama RI.
              </li>
              <li>
                <strong>Pencegahan Spam & Keamanan Sistem:</strong> Melindungi API
                dari serangan brute-force, abusive spam, dan eksploitasi data.
              </li>
            </ul>
          </section>

          {/* Section 4: Pihak Ketiga & Infrastruktur */}
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                color: "#f3ba2f",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <i className="fa-solid fa-network-wired" />
              {isAr
                ? "٤. مقدمو الخدمات السحابية ومشاركة البيانات"
                : isEn
                ? "4. Cloud Infrastructure & Sub-processors"
                : "4. Penyedia Infrastruktur & Pihak Ketiga"}
            </h2>
            <p style={{ margin: "0 0 0.75rem 0" }}>
              {isAr
                ? "نحن لا نبيع أو نؤجر أي بيانات شخصية على الإطلاق لأي غرض إعلاني أو تجاري. تتم المعالجة التقنية فقط عبر منصات سحابية معتمدة عالمياً:"
                : isEn
                ? "We never sell, rent, or monetize your personal information under any circumstances. Technical processing occurs strictly through enterprise cloud sub-processors:"
                : "Platform Expedient 43 TIDAK PERNAH memperjualbelikan, menyewakan, atau mengomersialkan data pribadi alumni kepada pihak pengiklan atau pihak ketiga mana pun. Pemrosesan teknis dilakukan secara aman melalui mitra infrastruktur cloud berikut:"}
            </p>
            <ul
              style={{
                margin: 0,
                paddingInlineStart: "1.25rem",
                display: "grid",
                gap: "0.5rem",
              }}
            >
              <li>
                <strong>Supabase Inc.</strong> — Database PostgreSQL, otentikasi, dan
                penyimpanan file (foto profil, galeri, media chat).
              </li>
              <li>
                <strong>Vercel Inc.</strong> — Hosting aplikasi web dan Vercel Analytics
                (statistik kunjungan halaman).
              </li>
              <li>
                <strong>Google LLC (Firebase Cloud Messaging)</strong> — Pengiriman push
                notification Android &amp; iOS.
              </li>
              <li>
                <strong>Google LLC (Gemini API)</strong> — Pemrosesan AI: isi pesan yang
                antum kirim ke bot WhatsApp angkatan, fitur Oracle, dan moderasi titip
                salam dikirim ke Gemini untuk menghasilkan jawaban.
              </li>
              <li>
                <strong>WhatsApp (Meta)</strong> — Bot angkatan mengirim OTP, pengumuman,
                dan ucapan ulang tahun ke nomor WhatsApp yang terdaftar, serta membaca
                pesan di grup angkatan tempat bot menjadi anggota.
              </li>
              <li>
                <strong>Agora.io</strong> — Transmisi audio/video untuk fitur panggilan
                antar alumni.
              </li>
            </ul>
          </section>

          {/* Section 5: Hak Subjek Data & Hapus Akun */}
          <section
            style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              background: "rgba(212, 175, 55, 0.06)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              borderRadius: "14px",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                color: "#f3ba2f",
                margin: "0 0 0.75rem 0",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <i className="fa-solid fa-user-shield" />
              {isAr
                ? "٥. حقوق المستخدم وحذف الحساب بالكامل"
                : isEn
                ? "5. Your Rights & Account Deletion Policy"
                : "5. Hak Pengguna & Prosedur Hapus Akun Mandiri"}
            </h2>
            <p style={{ margin: "0 0 1rem 0" }}>
              {isAr
                ? "بموجب قانون حماية البيانات، يحق لك الوصول إلى بياناتك، تصحيحها، أو طلب محوها نهائياً دون قيد أو شرط في أي وقت."
                : isEn
                ? "Under the UU PDP and Google Play standards, you hold the absolute right to access, rectify, restrict, or permanently erase your data at any time."
                : "Sesuai Pasal 5 sampai Pasal 13 UU PDP No. 27 Tahun 2022 serta regulasi Google Play Developer Policy, setiap pengguna memiliki hak mutlak untuk mengakses, memperbarui, mencabut persetujuan, dan meminta penghapusan seluruh data pribadi miliknya secara permanen."}
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <Link
                href="/delete-account"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  background: "#ef4444",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                }}
              >
                <i className="fa-solid fa-trash-can" />
                {isAr
                  ? "الانتقال إلى صفحة حذف الحساب"
                  : isEn
                  ? "Go to Account Deletion Page"
                  : "Buka Halaman Hapus Akun"}
              </Link>
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                {isAr
                  ? "يتم حذف كافة بيانات الحساب، الصور، وكلمات المرور نهائياً خلال ٧ أيام عمل."
                  : isEn
                  ? "All credentials, biometric hashes, and profile media are permanently purged within 7 business days."
                  : "Seluruh data profil, hash biometrik, media, dan kredensial dihapus permanen maksimal 7x24 jam."}
              </span>
            </div>
          </section>

          {/* Section 6: Keamanan Data & Enkripsi */}
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                color: "#f3ba2f",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <i className="fa-solid fa-lock" />
              {isAr
                ? "٦. الإجراءات الأمنية والتشفير"
                : isEn
                ? "6. Technical Security & Encryption Standards"
                : "6. Standar Keamanan & Perlindungan Teknis"}
            </h2>
            <p style={{ margin: "0 0 0.5rem 0" }}>
              Kami menerapkan standar keamanan pertahanan berlapis (defense-in-depth):
            </p>
            <ul
              style={{
                margin: 0,
                paddingInlineStart: "1.25rem",
                display: "grid",
                gap: "0.5rem",
              }}
            >
              <li>
                <strong>Enkripsi Lalu Lintas:</strong> Seluruh komunikasi client-server
                dilindungi enkripsi TLS 1.3 / HTTPS dan header keamanan ketat (CSP, HSTS,
                X-Content-Type-Options).
              </li>
              <li>
                <strong>Row-Level Security (RLS):</strong> Akses tabel database dibatasi
                secara granular pada level baris database PostgreSQL; user hanya dapat membaca
                dan menyunting data sesuai hak otorisasi yang sah.
              </li>
              <li>
                <strong>HMAC-SHA256 Token:</strong> Sesi administratif diverifikasi dengan
                tanda tangan kriptografis waktu terbatas dan tahan terhadap timing attacks.
              </li>
              <li>
                <strong>Rate Limiting & Sanitasi:</strong> Proteksi terhadap brute force,
                HTML injection (XSS), dan SSRF pada seluruh rute API.
              </li>
            </ul>
          </section>

          {/* Section 7: Narahubung & Kontak DPO */}
          <section
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "1.75rem",
              marginTop: "2.5rem",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontSize: "1.15rem",
                color: "#f3ba2f",
                margin: "0 0 0.5rem 0",
              }}
            >
              {isAr
                ? "التواصل مع مسؤول حماية البيانات (DPO)"
                : isEn
                ? "Data Protection Officer Contact"
                : "Kontak Tim Pengelola & Perlindungan Data"}
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#94a3b8",
                maxWidth: "600px",
                margin: "0 auto 1.25rem auto",
              }}
            >
              Jika antum memiliki pertanyaan, saran, atau kendala terkait privasi dan
              penghapusan data di platform Expedient 43, silakan hubungi tim pengurus melalui:
            </p>
            <div
              style={{
                display: "inline-flex",
                flexWrap: "wrap",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <a
                href="mailto:admin@expedientgeneration.com"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#e2e8f0",
                  textDecoration: "none",
                  fontSize: "0.88rem",
                }}
              >
                <i className="fa-solid fa-envelope" style={{ color: "#f3ba2f" }} />
                admin@expedientgeneration.com
              </a>
              <Link
                href="/panduan"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#e2e8f0",
                  textDecoration: "none",
                  fontSize: "0.88rem",
                }}
              >
                <i className="fa-solid fa-book-open" style={{ color: "#f3ba2f" }} />
                Pusat Bantuan & Panduan
              </Link>
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
                marginTop: "1.5rem",
                marginBottom: 0,
              }}
            >
              © {new Date().getFullYear()} Expedient Generation 43 — Pondok Modern
              Arrisalah Slahung Ponorogo. All rights reserved.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}

