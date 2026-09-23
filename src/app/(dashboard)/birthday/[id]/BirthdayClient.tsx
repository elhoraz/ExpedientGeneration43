"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const palettes = [
    ['#ff6b6b','#feca57','#ff9ff3','#ffffff','#ffffffcc'],
    ['#0abde3','#10ac84','#48dbfb','#ffffff','#ffffffcc'],
    ['#5f27cd','#c44569','#e056a0','#ffffff','#ffffffdd'],
    ['#ff9a76','#ffeaa7','#fdcb6e','#2d3436','#636e72'],
    ['#6c5ce7','#a29bfe','#dfe6e9','#ffffff','#ffffffcc'],
    ['#00b894','#00cec9','#55efc4','#ffffff','#ffffffcc'],
    ['#e17055','#fab1a0','#ffeaa7','#2d3436','#636e72'],
    ['#fd79a8','#e84393','#fdcb6e','#ffffff','#ffffffcc'],
    ['#636e72','#2d3436','#d4af37','#ffffff','#ffffffcc'],
    ['#0984e3','#74b9ff','#dfe6e9','#ffffff','#ffffffcc'],
    ['#d63031','#ff7675','#ffeaa7','#ffffff','#ffffffcc'],
    ['#e84393','#fd79a8','#fab1a0','#ffffff','#ffffffcc'],
    ['#00b894','#55efc4','#81ecec','#2d3436','#636e72'],
    ['#6c5ce7','#fd79a8','#ffeaa7','#ffffff','#ffffffcc'],
    ['#fdcb6e','#f39c12','#e74c3c','#2d3436','#636e72'],
    ['#1abc9c','#16a085','#2ecc71','#ffffff','#ffffffcc'],
    ['#2c3e50','#3498db','#e74c3c','#ffffff','#ffffffcc'],
    ['#8e44ad','#9b59b6','#f1c40f','#ffffff','#ffffffcc'],
    ['#e74c3c','#c0392b','#f39c12','#ffffff','#ffffffcc'],
    ['#1e3799','#0c2461','#f6b93b','#ffffff','#ffffffcc'],
    ['#b8e994','#78e08f','#38ada9','#2d3436','#636e72'],
    ['#f8c291','#e55039','#eb2f06','#ffffff','#ffffffcc'],
    ['#4a69bd','#6a89cc','#f8c291','#ffffff','#ffffffcc'],
    ['#e58e26','#fa983a','#f6b93b','#2d3436','#636e72'],
    ['#d4af37','#f5d76e','#2c3e50','#2c3e50','#34495e'],
];

const fonts = [
    ['Playfair Display','Inter','900'],
    ['Poppins','Lato','800'],
    ['Montserrat','Open Sans','900'],
    ['Pacifico','Nunito','400'],
    ['Bebas Neue','Roboto','400'],
    ['Abril Fatface','Source Sans 3','400'],
    ['DM Serif Display','DM Sans','400'],
    ['Josefin Sans','Work Sans','700'],
    ['Righteous','Quicksand','400'],
    ['Lobster','Mulish','400'],
    ['Raleway','Karla','900'],
    ['Oswald','Merriweather','700'],
];

const layouts = ['center-stack','split-left','split-right','diagonal','frame-overlay','circle-focus','fullbleed','card-float'];
const decos = ['confetti','stars','balloons','sparkles','ribbons','floral'];
const anims = ['cascade','bounce','bloom','burst'];

function getZodiak(dateStr: string, locale: string = "id") {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;

    let key = "pisces";
    let icon = "♓";

    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) { key = "aries"; icon = "♈"; }
    else if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) { key = "taurus"; icon = "♉"; }
    else if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) { key = "gemini"; icon = "♊"; }
    else if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) { key = "cancer"; icon = "♋"; }
    else if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) { key = "leo"; icon = "♌"; }
    else if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) { key = "virgo"; icon = "♍"; }
    else if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) { key = "libra"; icon = "♎"; }
    else if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) { key = "scorpio"; icon = "♏"; }
    else if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) { key = "sagittarius"; icon = "♐"; }
    else if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) { key = "capricorn"; icon = "♑"; }
    else if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) { key = "aquarius"; icon = "♒"; }

    const names: Record<string, { id: string; en: string; ar: string }> = {
      aries: { id: "Aries", en: "Aries", ar: "برج الحمل" },
      taurus: { id: "Taurus", en: "Taurus", ar: "برج الثور" },
      gemini: { id: "Gemini", en: "Gemini", ar: "برج الجوزاء" },
      cancer: { id: "Cancer", en: "Cancer", ar: "برج السرطان" },
      leo: { id: "Leo", en: "Leo", ar: "برج الأسد" },
      virgo: { id: "Virgo", en: "Virgo", ar: "برج العذراء" },
      libra: { id: "Libra", en: "Libra", ar: "برج الميزان" },
      scorpio: { id: "Scorpio", en: "Scorpio", ar: "برج العقرب" },
      sagittarius: { id: "Sagittarius", en: "Sagittarius", ar: "برج القوس" },
      capricorn: { id: "Capricorn", en: "Capricorn", ar: "برج الجدي" },
      aquarius: { id: "Aquarius", en: "Aquarius", ar: "برج الدلو" },
      pisces: { id: "Pisces", en: "Pisces", ar: "برج الحوت" },
    };

    const trans = names[key];
    const nama = locale === "ar" ? trans.ar : locale === "en" ? trans.en : trans.id;
    return { nama, icon };
}

export default function BirthdayClient({ userProfile, age, seed }: { userProfile: any, age: number, seed: number }) {
  const { t, locale } = useLanguage();
  const [particles, setParticles] = useState<any[]>([]);

  const p = palettes[seed % 25];
  const f = fonts[seed % 12];
  const layout = layouts[seed % 8];
  const deco = decos[seed % 6];
  const anim = anims[seed % 4];

  const fontUrl = `https://fonts.googleapis.com/css2?family=${f[0].replace(/ /g, '+')}:wght@${f[2]}&family=${f[1].replace(/ /g, '+')}:wght@400;600&display=swap`;
  const zodiak = getZodiak(userProfile.tanggal_lahir, locale);

  useEffect(() => {
    const colors = [p[0], p[1], p[2], '#fff', '#ffd700', '#ff6b6b', '#48dbfb', '#55efc4'];
    const count = deco === 'stars' ? 50 : deco === 'sparkles' ? 35 : 25;
    const newParticles = [];

    for (let i = 0; i < count; i++) {
      let bg = "transparent";
      let br = "0";
      let w = "10px";
      let h = "10px";

      if (deco === 'confetti') {
        bg = colors[Math.floor(Math.random() * colors.length)];
        br = Math.random() > 0.5 ? '50%' : '2px';
        w = (Math.random() * 8 + 6) + 'px';
        h = w;
      } else if (deco === 'balloons') {
        bg = colors[Math.floor(Math.random() * colors.length)];
      } else if (deco === 'ribbons') {
        bg = colors[Math.floor(Math.random() * colors.length)];
        h = (Math.random() * 30 + 20) + 'px';
      }

      newParticles.push({
        id: i,
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animDuration: (Math.random() * 5 + 3) + 's',
        animDelay: (Math.random() * 3) + 's',
        bg, br, w, h
      });
    }
    setParticles(newParticles);
  }, [deco, p]);

  const [avatarSrc, setAvatarSrc] = useState(() => 
    getAvatarUrl(userProfile.foto_profil, userProfile.nama_panggilan || userProfile.nama_lengkap)
  );

  let cleanWa = (userProfile.no_whatsapp || "").replace(/\D/g, "");
  if (cleanWa.startsWith("0")) cleanWa = "62" + cleanWa.substring(1);
  else if (cleanWa && !cleanWa.startsWith("62")) cleanWa = "62" + cleanWa;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const directWishUrl = cleanWa
    ? `https://wa.me/${cleanWa}?text=${encodeURIComponent(`Assalamu'alaikum ${userProfile.nama_panggilan || 'Kawan'}! 🎉\nBarakallahu fii umrik! Selamat ulang tahun ya, semoga senantiasa diberikan keberkahan, kesehatan, dan kelancaran dalam segala hal. Aamiin! 🤲\n\nLihat kartu ucapan angkatan untukmu di sini:\n${currentUrl}`)}`
    : null;

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`🎂 Hari ini sahabat kita *${userProfile.nama_panggilan || userProfile.nama_lengkap}* sedang berulang tahun! Mari kirim doa dan ucapan terbaik untuknya:\n${currentUrl}`)}`;

  useEffect(() => {
    document.body.classList.add("page-birthday");
    const link = document.createElement("link");
    link.href = fontUrl;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.body.classList.remove("page-birthday");
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [fontUrl]);

  return (
    <>
      <Link href="/direktori" className="bday-back"><i className="fa-solid fa-arrow-left"></i></Link>

      <div className={`bday-universe layout-${layout} deco-${deco} anim-${anim}`} style={{
        "--p0": p[0],
        "--p1": p[1],
        "--p2": p[2],
        "--p3": p[3],
        "--p4": p[4],
        "--f0": `'${f[0]}', serif`,
        "--f1": `'${f[1]}', sans-serif`,
        "--f2": f[2]
      } as any}>
        
        {particles.map(pt => (
          <div key={pt.id} className="deco-particle" style={{
            left: pt.left, top: pt.top, animationDuration: pt.animDuration, animationDelay: pt.animDelay,
            background: pt.bg, borderRadius: pt.br, width: pt.w, height: pt.h
          }}></div>
        ))}

        <div className="bday-card-content">
          <div className="bday-anim-el">
              <div className="bday-photo-wrap">
                  <Image 
                    src={avatarSrc} 
                    width={160} 
                    height={160} 
                    alt={userProfile.nama_panggilan || "Foto"} 
                    priority
                    onError={() => setAvatarSrc(getAvatarFallback(userProfile.nama_panggilan))}
                    unoptimized={avatarSrc.startsWith("data:") || avatarSrc.includes("ui-avatars.com")} 
                  />
              </div>
          </div>

          <div className="bday-pretitle bday-body bday-sub bday-anim-el">{t.birthday.title}</div>

          <h1 className="bday-name bday-heading bday-text bday-anim-el">{userProfile.nama_panggilan}</h1>

          {age > 0 && (
            <div className="bday-age bday-body bday-text bday-anim-el">
                {locale === "ar" ? <>العام الـ<strong style={{ fontSize: "1.4em" }}>{age}</strong></> : locale === "en" ? <>Age <strong style={{ fontSize: "1.4em" }}>{age}</strong></> : <>Ke-<strong style={{ fontSize: "1.4em" }}>{age}</strong> Tahun</>}
            </div>
          )}

          <div className="bday-zodiak bday-body bday-text bday-anim-el">
              <span style={{ fontSize: "1.3em" }}>{zodiak.icon}</span> {zodiak.nama}
          </div>

          <div className="bday-anim-el">
              <div className="bday-date-badge bday-body bday-text">
                  {new Date(userProfile.tanggal_lahir).toLocaleDateString(locale === "ar" ? "ar-EG" : locale === "en" ? "en-US" : "id-ID", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
          </div>

          <p className="bday-wishes bday-body bday-sub bday-anim-el">
              {locale === "ar"
                ? "نسأل الله تعالى أن يبارك في عمرك، وأن يديم عليك نعمة الصحة والعافية والتوفيق في كل خطواتك. بارك الله فيك! 🤲"
                : locale === "en"
                ? "May Allah SWT continuously bestow barakah, health, and happiness upon every step of your journey. Barakallahu feek! 🤲"
                : "Semoga Allah SWT senantiasa melimpahkan keberkahan, kesehatan, dan kebahagiaan di setiap langkahmu. Barakallahu fiik! 🤲"}
          </p>

          <div className="bday-anim-el" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", width: "100%", maxWidth: "340px", margin: "0 auto" }}>
              {directWishUrl && (
                <a href={directWishUrl} target="_blank" rel="noopener noreferrer" className="bday-share-btn bday-body" style={{ width: "100%", justifyContent: "center" }}>
                    <i className="fa-brands fa-whatsapp"></i> {t.birthday.send_greeting} ({userProfile.nama_panggilan})
                </a>
              )}
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="bday-share-btn bday-body" style={{ width: "100%", justifyContent: "center", background: directWishUrl ? "rgba(255,255,255,0.15)" : undefined, borderColor: directWishUrl ? "var(--glass-border)" : undefined }}>
                  <i className="fa-solid fa-share-nodes"></i> {t.common.share}
              </a>
          </div>
        </div>

        <div className="bday-watermark bday-body bday-text">Expedient Generation — 43rd Arrisalah</div>
      </div>
    </>
  );
}
