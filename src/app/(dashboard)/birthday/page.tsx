import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { getAvatarUrl } from "@/lib/avatar";

import "./birthday.css";

export const metadata = {
  title: "Ulang Tahun Hari Ini - Expedient",
};

export default async function BirthdayListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get current day and month
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate(); // 1-31

  // Fetch users with birthday today
  // PostgreSQL extract function doesn't work directly with Supabase eq on dates easily,
  // we'll fetch all and filter for now (or write a rpc, but let's filter for simplicity since it's < 200 users)
  const { data: allUsers } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, foto_profil, tanggal_lahir")
      .not("tanggal_lahir", "is", null);

  const birthdayUsers = (allUsers || []).filter(u => {
      if (!u.tanggal_lahir) return false;
      const bDate = new Date(u.tanggal_lahir);
      return bDate.getDate() === currentDay && bDate.getMonth() + 1 === currentMonth;
  });

  return (
    <main className="bday-wrapper">
      <div className="bday-header js-reveal">
          <h1>🎂 Ulang Tahun Hari Ini</h1>
          <p>Kirim ucapan terbaik untuk kolega Anda</p>
          <div className="bday-date-badge">
              <i className="fa-regular fa-calendar"></i> {today.toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}
          </div>
      </div>

      {birthdayUsers.length > 0 ? (
          <div className="bday-grid">
              {birthdayUsers.map(u => {
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
                            unoptimized={avatarUrl.startsWith("data:") || avatarUrl.includes("ui-avatars.com") || avatarUrl.includes("supabase.co")}
                          />
                          <div className="bday-name">{u.nama_panggilan || u.nama_lengkap}</div>
                          <div className="bday-fullname">{u.nama_lengkap}</div>
                          
                          <Link href={`/birthday/${u.id}`} className="bday-btn">
                              <i className="fa-solid fa-gift" style={{ marginRight: '8px' }}></i> Kirim Ucapan
                          </Link>
                      </div>
                  );
              })}
          </div>
      ) : (
          <div className="bday-empty js-reveal">
              <i className="fa-regular fa-face-smile"></i>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontFamily: "'Playfair Display', serif" }}>Tidak Ada Ulang Tahun Hari Ini</h3>
              <p>Belum ada kolega yang berulang tahun hari ini. Kembali lagi besok!</p>
              <Link href="/beranda" className="bday-btn" style={{ marginTop: '20px' }}>
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: '8px' }}></i> Kembali
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
