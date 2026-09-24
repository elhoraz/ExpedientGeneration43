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
  no_whatsapp?: string;
  daysLeft?: number;
}

interface UpcomingUser extends BirthdayUser {
  birthMonth: number;
  birthDay: number;
  daysLeft: number;
}

export default function BirthdayListClient({
  birthdayUsers = [],
  upcomingUsers = [],
}: {
  birthdayUsers: BirthdayUser[];
  upcomingUsers?: UpcomingUser[];
}) {
  const { t, locale } = useLanguage();
  const today = new Date();

  return (
    <main className="bday-wrapper">
      <div className="bday-header js-reveal">
        <h1>🎂 {locale === "ar" ? "أعياد ميلاد الدفعة" : locale === "en" ? "Cohort Birthdays" : "Ulang Tahun Sahabat"}</h1>
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

      {/* SECTION 1: TODAY'S BIRTHDAYS */}
      {birthdayUsers.length > 0 ? (
        <section className="bday-section-today js-reveal">
          <div className="bday-section-title" style={{ textAlign: "center", marginBottom: "25px" }}>
            <span style={{ 
              display: "inline-block", 
              padding: "6px 18px", 
              borderRadius: "30px", 
              background: "rgba(212, 175, 55, 0.2)", 
              border: "1px solid var(--gold-premium, #d4af37)",
              color: "var(--gold-premium, #d4af37)",
              fontSize: "0.82rem",
              fontWeight: 700,
              letterSpacing: "1px"
            }}>
              {locale === "ar" ? "احتفال اليوم 🎉" : locale === "en" ? "Celebrating Today 🎉" : "Merayakan Hari Ini 🎉"}
            </span>
          </div>
          <div className="bday-grid">
            {birthdayUsers.map((u) => {
              const displayName = (u.nama_panggilan || u.nama_lengkap || "Kawan").trim();
              const avatarUrl = getAvatarUrl(u.foto_profil, displayName);

              return (
                <div key={u.id} className="bday-card js-reveal">
                  <div className="bday-confetti">🎉</div>
                  <Image
                    src={avatarUrl}
                    width={90}
                    height={90}
                    className="bday-avatar"
                    alt={displayName}
                    unoptimized={
                      avatarUrl.startsWith("data:") ||
                      avatarUrl.includes("ui-avatars.com") ||
                      avatarUrl.includes("supabase.co")
                    }
                  />
                  <div className="bday-name">{displayName}</div>
                  <div className="bday-fullname">{u.nama_lengkap}</div>

                  <Link href={`/birthday/${u.id}`} className="bday-btn">
                    <i className="fa-solid fa-gift" style={{ marginRight: "8px" }}></i> {t.birthday.send_greeting}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="bday-empty js-reveal" style={{ padding: "40px 20px" }}>
          <i className="fa-regular fa-face-smile" style={{ fontSize: "3.5rem" }}></i>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "8px", fontFamily: "'Playfair Display', serif" }}>
            {locale === "ar" ? "لا توجد أعياد ميلاد اليوم" : locale === "en" ? "No Birthdays Today" : "Hari Ini Belum Ada yang Berulang Tahun"}
          </h3>
          <p style={{ maxWidth: "450px", margin: "0 auto", fontSize: "0.88rem" }}>
            {locale === "ar"
              ? "لا يوجد زملاء يحتفلون بأعياد ميلادهم اليوم. تفقد قائمة أعيad ميلاد القادمة أدناه!"
              : locale === "en"
              ? "No colleagues celebrating their birthday today. Check out the upcoming celebrations below!"
              : "Belum ada sahabat yang berulang tahun hari ini. Lihat daftar milad yang akan datang di bawah ini!"}
          </p>
        </div>
      )}

      {/* SECTION 2: UPCOMING BIRTHDAYS (SOON) */}
      {upcomingUsers.length > 0 && (
        <section className="bday-upcoming-section js-reveal" style={{ marginTop: "60px" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2 style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: "1.4rem", 
              color: "var(--text-primary)", 
              letterSpacing: "1px",
              marginBottom: "6px"
            }}>
              {locale === "ar" ? "أعياد ميلاد قادمة" : locale === "en" ? "Upcoming Milad Celebrations" : "Milad Sahabat Mendatang"}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
              {locale === "ar" ? "استعد لتقديم التهاني والدعاء لرفاق الدفعة" : locale === "en" ? "Get ready to send prayers and warm wishes" : "Siapkan doa dan ucapan hangat untuk sahabat yang segera milad"}
            </p>
          </div>

          <div className="bday-grid">
            {upcomingUsers.map((u) => {
              const displayName = (u.nama_panggilan || u.nama_lengkap || "Kawan").trim();
              const avatarUrl = getAvatarUrl(u.foto_profil, displayName);

              // Date formatting for upcoming
              const dateObj = new Date(today.getFullYear(), u.birthMonth - 1, u.birthDay);
              const formattedDate = dateObj.toLocaleDateString(locale === "ar" ? "ar-EG" : locale === "en" ? "en-US" : "id-ID", {
                day: "numeric",
                month: "short",
              });

              return (
                <div key={u.id} className="bday-card js-reveal" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <div style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    background: u.daysLeft <= 7 ? "rgba(212, 175, 55, 0.25)" : "rgba(255,255,255,0.08)",
                    border: u.daysLeft <= 7 ? "1px solid var(--gold-premium, #d4af37)" : "1px solid rgba(255,255,255,0.12)",
                    color: u.daysLeft <= 7 ? "var(--gold-premium, #d4af37)" : "var(--text-secondary)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}>
                    {u.daysLeft === 1 
                      ? (locale === "ar" ? "غداً!" : locale === "en" ? "Tomorrow!" : "Besok!")
                      : (locale === "ar" ? `بعد ${u.daysLeft} يوم` : locale === "en" ? `In ${u.daysLeft} days` : `H-${u.daysLeft}`)}
                  </div>

                  <Image
                    src={avatarUrl}
                    width={80}
                    height={80}
                    className="bday-avatar"
                    alt={displayName}
                    style={{ width: "80px", height: "80px" }}
                    unoptimized={
                      avatarUrl.startsWith("data:") ||
                      avatarUrl.includes("ui-avatars.com") ||
                      avatarUrl.includes("supabase.co")
                    }
                  />
                  <div className="bday-name" style={{ fontSize: "1.15rem" }}>{displayName}</div>
                  <div className="bday-fullname" style={{ marginBottom: "8px" }}>{u.nama_lengkap}</div>
                  
                  <div style={{ color: "var(--gold-premium, #d4af37)", fontSize: "0.8rem", fontWeight: 600, marginBottom: "15px" }}>
                    <i className="fa-regular fa-calendar-check" style={{ marginRight: "6px" }}></i>
                    {formattedDate}
                  </div>

                  <Link href={`/birthday/${u.id}`} className="bday-btn" style={{ padding: "8px 20px", fontSize: "0.8rem" }}>
                    <i className="fa-solid fa-gift" style={{ marginRight: "6px" }}></i> {locale === "ar" ? "معاينة البطاقة" : locale === "en" ? "Preview Card" : "Lihat Kartu"}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Link href="/beranda" className="bday-btn" style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--glass-border)" }}>
          <i className="fa-solid fa-arrow-left" style={{ marginRight: "8px" }}></i> {t.birthday.back_to_home}
        </Link>
      </div>

      {/* Reveal animation */}
      <Script id="bday-reveal" strategy="lazyOnload">
        {`
          setTimeout(() => {
            document.querySelectorAll('.js-reveal').forEach((el, i) => {
                el.animate([
                    { opacity: 0, transform: 'translateY(25px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], { duration: 700, delay: i * 80, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
            });
          }, 60);
        `}
      </Script>
    </main>
  );
}
