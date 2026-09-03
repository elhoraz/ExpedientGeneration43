"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

function getZodiak(dateStr: string) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;

    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return { nama: 'Aries', icon: '♈' };
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return { nama: 'Taurus', icon: '♉' };
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return { nama: 'Gemini', icon: '♊' };
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return { nama: 'Cancer', icon: '♋' };
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return { nama: 'Leo', icon: '♌' };
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return { nama: 'Virgo', icon: '♍' };
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return { nama: 'Libra', icon: '♎' };
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return { nama: 'Scorpio', icon: '♏' };
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return { nama: 'Sagittarius', icon: '♐' };
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return { nama: 'Capricorn', icon: '♑' };
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return { nama: 'Aquarius', icon: '♒' };
    return { nama: 'Pisces', icon: '♓' };
}

export default function BirthdayClient({ userProfile, age, seed }: { userProfile: any, age: number, seed: number }) {
  const [particles, setParticles] = useState<any[]>([]);

  const p = palettes[seed % 25];
  const f = fonts[seed % 12];
  const layout = layouts[seed % 8];
  const deco = decos[seed % 6];
  const anim = anims[seed % 4];

  const fontUrl = `https://fonts.googleapis.com/css2?family=${f[0].replace(/ /g, '+')}:wght@${f[2]}&family=${f[1].replace(/ /g, '+')}:wght@400;600&display=swap`;
  const zodiak = getZodiak(userProfile.tanggal_lahir);

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

  const avatarUrl = userProfile.foto_profil 
    ? `/uploads/profiles/${userProfile.foto_profil}` 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.nama_panggilan)}&background=0D0D0D&color=D4AF37&bold=true`;

  const shareUrl = `https://wa.me/?text=🎂 Selamat Ulang Tahun ${encodeURIComponent(userProfile.nama_panggilan)}! Lihat ucapannya di: ${encodeURIComponent(typeof window !== "undefined" ? window.location.href : '')}`;

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
                  <img src={avatarUrl} alt={userProfile.nama_panggilan} />
              </div>
          </div>

          <div className="bday-pretitle bday-body bday-sub bday-anim-el">Selamat Ulang Tahun</div>

          <h1 className="bday-name bday-heading bday-text bday-anim-el">{userProfile.nama_panggilan}</h1>

          <div className="bday-age bday-body bday-text bday-anim-el">
              Ke-<strong style={{ fontSize: "1.4em" }}>{age}</strong> Tahun
          </div>

          <div className="bday-zodiak bday-body bday-text bday-anim-el">
              <span style={{ fontSize: "1.3em" }}>{zodiak.icon}</span> {zodiak.nama}
          </div>

          <div className="bday-anim-el">
              <div className="bday-date-badge bday-body bday-text">
                  {new Date(userProfile.tanggal_lahir).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
          </div>

          <p className="bday-wishes bday-body bday-sub bday-anim-el">
              Semoga Allah SWT senantiasa melimpahkan keberkahan, kesehatan, dan kebahagiaan di setiap langkahmu. Barakallahu fiik! 🤲
          </p>

          <div className="bday-anim-el">
              <a href={shareUrl} target="_blank" className="bday-share-btn bday-body">
                  <i className="fa-brands fa-whatsapp"></i> Kirim Ucapan
              </a>
          </div>
        </div>

        <div className="bday-watermark bday-body bday-text">Expedient Generation — 43rd Arrisalah</div>
      </div>
    </>
  );
}
