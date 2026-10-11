"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
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

function BirthdayAvatar({ src, name, size = 90 }: { src: string; name: string; size?: number }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <Image
      src={imgSrc}
      width={size}
      height={size}
      className="bday-avatar"
      alt={name}
      style={{ width: `${size}px`, height: `${size}px` }}
      onError={() => setImgSrc(getAvatarFallback(name))}
      unoptimized={
        imgSrc.startsWith("data:") ||
        imgSrc.includes("ui-avatars.com") ||
        imgSrc.includes("supabase.co")
      }
    />
  );
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
      <div className="bday-header bday-fade-in">
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
        <section className="bday-section-today bday-fade-in" style={{ animationDelay: "100ms" }}>
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
            {birthdayUsers.map((u, i) => {
              const displayName = (u.nama_panggilan || u.nama_lengkap || "Kawan").trim();
              const showFullName = Boolean(
                u.nama_panggilan && 
                u.nama_lengkap && 
                u.nama_panggilan.trim().toLowerCase() !== u.nama_lengkap.trim().toLowerCase()
              );
              const avatarUrl = getAvatarUrl(u.foto_profil, displayName);

              return (
                <div key={u.id} className="bday-card bday-fade-in" style={{ animationDelay: `${(i + 2) * 80}ms` }}>
                  <div className="bday-confetti">🎉</div>
                  <BirthdayAvatar src={avatarUrl} name={displayName} size={90} />
                  <div className="bday-name">{displayName}</div>
                  {showFullName && <div className="bday-fullname">{u.nama_lengkap}</div>}

                  <Link href={`/birthday/${u.id}`} className="bday-btn" style={{ marginTop: showFullName ? "0" : "12px" }}>
                    <i className="fa-solid fa-gift" style={{ marginRight: "8px" }}></i> {t.birthday.send_greeting}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="bday-empty bday-fade-in" style={{ padding: "40px 20px" }}>
          <i className="fa-regular fa-face-smile" style={{ fontSize: "3.5rem" }}></i>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "8px", fontFamily: "'Playfair Display', serif" }}>
            {locale === "ar" ? "لا توجد أعياد ميلاد اليوم" : locale === "en" ? "No Birthdays Today" : "Hari Ini Belum Ada yang Berulang Tahun"}
          </h3>
          <p style={{ maxWidth: "450px", margin: "0 auto", fontSize: "0.88rem" }}>
            {locale === "ar"
              ? "لا يوجد زملاء يحتفلون بأعياد ميلادهم اليوم. تفقد قائمة أعياد ميلاد القادمة أدناه!"
              : locale === "en"
              ? "No colleagues celebrating their birthday today. Check out the upcoming celebrations below!"
              : "Belum ada sahabat yang berulang tahun hari ini. Lihat daftar milad yang akan datang di bawah ini!"}
          </p>
        </div>
      )}

      {/* SECTION 2: UPCOMING BIRTHDAYS (SOON) */}
      {upcomingUsers.length > 0 && (
        <section className="bday-upcoming-section bday-fade-in" style={{ marginTop: "60px", animationDelay: "200ms" }}>
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
            {upcomingUsers.map((u, i) => {
              const displayName = (u.nama_panggilan || u.nama_lengkap || "Kawan").trim();
              const showFullName = Boolean(
                u.nama_panggilan && 
                u.nama_lengkap && 
                u.nama_panggilan.trim().toLowerCase() !== u.nama_lengkap.trim().toLowerCase()
              );
              const avatarUrl = getAvatarUrl(u.foto_profil, displayName);

              // Date formatting for upcoming
              const dateObj = new Date(today.getFullYear(), u.birthMonth - 1, u.birthDay);
              const formattedDate = dateObj.toLocaleDateString(locale === "ar" ? "ar-EG" : locale === "en" ? "en-US" : "id-ID", {
                day: "numeric",
                month: "short",
              });

              return (
                <div key={u.id} className="bday-card bday-fade-in" style={{ borderColor: "rgba(255,255,255,0.08)", animationDelay: `${(i + 3) * 60}ms` }}>
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

                  <BirthdayAvatar src={avatarUrl} name={displayName} size={80} />
                  <div className="bday-name" style={{ fontSize: "1.15rem" }}>{displayName}</div>
                  {showFullName && <div className="bday-fullname" style={{ marginBottom: "8px" }}>{u.nama_lengkap}</div>}
                  
                  <div style={{ 
                    color: "var(--gold-premium, #d4af37)", 
                    fontSize: "0.8rem", 
                    fontWeight: 600, 
                    marginBottom: "15px",
                    marginTop: showFullName ? "0" : "8px"
                  }}>
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
    </main>
  );
}
