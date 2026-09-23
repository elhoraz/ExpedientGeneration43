"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { getAvatarUrl } from "@/lib/avatar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface BirthdayUser {
  id: string;
  nama_lengkap: string;
  nama_panggilan: string;
  foto_profil: string;
  tanggal_lahir: string;
}

export default function BirthdayListClient({
  birthdayUsers,
}: {
  birthdayUsers: BirthdayUser[];
}) {
  const { t, locale } = useLanguage();
  const today = new Date();

  return (
    <main className="bday-wrapper">
      <div className="bday-header js-reveal">
        <h1>🎂 {locale === "ar" ? "أعياد ميلاد اليوم" : locale === "en" ? "Today's Birthdays" : "Ulang Tahun Hari Ini"}</h1>
        <p>{t.birthday.subtitle}</p>
        <div className="bday-date-badge">
          <i className="fa-regular fa-calendar"></i>{" "}
          {today.toLocaleDateString(locale === "ar" ? "ar-EG" : locale === "en" ? "en-US" : "id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {birthdayUsers.length > 0 ? (
        <div className="bday-grid">
          {birthdayUsers.map((u) => {
            const avatarUrl = getAvatarUrl(u.foto_profil, u.nama_panggilan || u.nama_lengkap || "U");

            return (
              <div key={u.id} className="bday-card js-reveal">
                <div className="bday-confetti">🎉</div>
                <Image
                  src={avatarUrl}
                  width={90}
                  height={90}
                  className="bday-avatar"
                  alt={u.nama_panggilan || u.nama_lengkap || "Foto"}
                  unoptimized={
                    avatarUrl.startsWith("data:") ||
                    avatarUrl.includes("ui-avatars.com") ||
                    avatarUrl.includes("supabase.co")
                  }
                />
                <div className="bday-name">{u.nama_panggilan || u.nama_lengkap}</div>
                <div className="bday-fullname">{u.nama_lengkap}</div>

                <Link href={`/birthday/${u.id}`} className="bday-btn">
                  <i className="fa-solid fa-gift" style={{ marginRight: "8px" }}></i> {t.birthday.send_greeting}
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bday-empty js-reveal">
          <i className="fa-regular fa-face-smile"></i>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "10px", fontFamily: "'Playfair Display', serif" }}>
            {locale === "ar" ? "لا توجد أعياد ميلاد اليوم" : locale === "en" ? "No Birthdays Today" : "Tidak Ada Ulang Tahun Hari Ini"}
          </h3>
          <p>
            {locale === "ar"
              ? "لا يوجد زملاء يحتفلون بأعياد ميلادهم اليوم. تفضل بزيارتنا غداً!"
              : locale === "en"
              ? "No colleagues celebrating today. Check back tomorrow!"
              : "Belum ada kolega yang berulang tahun hari ini. Kembali lagi besok!"}
          </p>
          <Link href="/beranda" className="bday-btn" style={{ marginTop: "20px" }}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: "8px" }}></i> {t.birthday.back_to_home}
          </Link>
        </div>
      )}

      {/* Basic reveal animation */}
      <Script id="bday-reveal" strategy="lazyOnload">
        {`
          setTimeout(() => {
            document.querySelectorAll('.js-reveal').forEach((el, i) => {
                el.animate([
                    { opacity: 0, transform: 'translateY(30px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], { duration: 800, delay: i * 150, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
            });
          }, 100);
        `}
      </Script>
    </main>
  );
}
