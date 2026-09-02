"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import ThemeToggle from "@/components/layout/ThemeToggle";
import "./divine.css";

const DEFAULT_VERSES = [
  {
    arabic: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
    latin: "Wa qāla rabbukumud'ūnī astajib lakum",
    meaning: "Dan Tuhanmu berfirman: 'Berdoalah kepada-Ku, niscaya akan Kuperkenankan bagimu.'",
    source: "QS. Ghafir: 60"
  },
  {
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    latin: "Fa inna ma'al 'usri yusrā",
    meaning: "Maka sesungguhnya bersama kesulitan ada kemudahan.",
    source: "QS. Al-Insyirah: 5"
  },
  {
    arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    latin: "Lā yukallifullāhu nafsan illā wus'ahā",
    meaning: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.",
    source: "QS. Al-Baqarah: 286"
  },
  {
    arabic: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
    latin: "Wa huwa ma'akum ayna mā kuntum",
    meaning: "Dan Dia bersama kamu di mana saja kamu berada.",
    source: "QS. Al-Hadid: 4"
  },
  {
    arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ",
    latin: "Fażkurūnī ażkurkum",
    meaning: "Maka ingatlah kepada-Ku, Aku pun akan ingat kepadamu.",
    source: "QS. Al-Baqarah: 152"
  }
];

const surahMap: Record<string, number> = {
    'Al-Fatihah': 1, 'Al-Baqarah': 2, 'Ali Imran': 3, 'An-Nisa': 4, 'Al-Ma\'idah': 5, 'Al-An\'am': 6, 'Al-A\'raf': 7, 'Al-Anfal': 8, 'At-Taubah': 9, 'Yunus': 10,
    'Hud': 11, 'Yusuf': 12, 'Ar-Ra\'d': 13, 'Ibrahim': 14, 'Al-Hijr': 15, 'An-Nahl': 16, 'Al-Isra': 17, 'Al-Kahf': 18, 'Maryam': 19, 'Taha': 20,
    'Al-Anbiya': 21, 'Al-Hajj': 22, 'Al-Mu\'minun': 23, 'An-Nur': 24, 'Al-Furqan': 25, 'Asy-Syu\'ara': 26, 'An-Naml': 27, 'Al-Qasas': 28, 'Al-\'Ankabut': 29, 'Ar-Rum': 30,
    'Luqman': 31, 'As-Sajdah': 32, 'Al-Ahzab': 33, 'Saba': 34, 'Fatir': 35, 'Yasin': 36, 'As-Saffat': 37, 'Sad': 38, 'Az-Zumar': 39, 'Ghafir': 40,
    'Fussilat': 41, 'Asy-Syura': 42, 'Az-Zukhruf': 43, 'Ad-Dukhan': 44, 'Al-Jasiyah': 45, 'Al-Ahqaf': 46, 'Muhammad': 47, 'Al-Fath': 48, 'Al-Hujurat': 49, 'Qaf': 50,
    'Az-Zariyat': 51, 'At-Tur': 52, 'An-Najm': 53, 'Al-Qamar': 54, 'Ar-Rahman': 55, 'Al-Waqi\'ah': 56, 'Al-Hadid': 57, 'Al-Mujadilah': 58, 'Al-Hasyr': 59, 'Al-Mumtahanah': 60,
    'As-Saff': 61, 'Al-Jumu\'ah': 62, 'Al-Munafiqun': 63, 'At-Tagabun': 64, 'At-Talaq': 65, 'At-Tahrim': 66, 'Al-Mulk': 67, 'Al-Qalam': 68, 'Al-Haqqah': 69, 'Al-Ma\'arij': 70,
    'Nuh': 71, 'Al-Jinn': 72, 'Al-Muzzammil': 73, 'Al-Muddassir': 74, 'Al-Qiyamah': 75, 'Al-Insan': 76, 'Al-Mursalat': 77, 'An-Naba': 78, 'An-Nazi\'at': 79, '\'Abasa': 80,
    'At-Takwir': 81, 'Al-Infitar': 82, 'Al-Mutaffifin': 83, 'Al-Insyiqaq': 84, 'Al-Buruj': 85, 'At-Tariq': 86, 'Al-A\'la': 87, 'Al-Gasyiyah': 88, 'Al-Fajr': 89, 'Al-Balad': 90,
    'Asy-Syams': 91, 'Al-Lail': 92, 'Ad-Duha': 93, 'Al-Insyirah': 94, 'At-Tin': 95, 'Al-\'Alaq': 96, 'Al-Qadr': 97, 'Al-Bayyinah': 98, 'Az-Zalzalah': 99, 'Al-\'Adiyat': 100,
    'Al-Qari\'ah': 101, 'At-Takasur': 102, 'Al-\'Asr': 103, 'Al-Humazah': 104, 'Al-Fil': 105, 'Quraisy': 106, 'Al-Ma\'un': 107, 'Al-Kausar': 108, 'Al-Kafirun': 109, 'An-Nasr': 110,
    'Al-Lahab': 111, 'Al-Ikhlas': 112, 'Al-Falaq': 113, 'An-Nas': 114
};

export default function DivineClient() {
  const [activeVerse, setActiveVerse] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const pf = document.getElementById('particleField');
    if (pf) {
        for (let i = 0; i < 25; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random()*100+'vw';
            p.style.animationDuration = (Math.random()*8+6)+'s';
            p.style.animationDelay = (Math.random()*10)+'s';
            pf.appendChild(p);
        }
    }

    const tl = gsap.timeline();
    tl.to('#pageTitle', { opacity:1, y:0, duration:1, ease:"power3.out" }, 0.3)
      .to('#pageSub', { opacity:1, y:0, duration:1, ease:"power3.out" }, 0.6)
      .to('#verseCard', { opacity:1, y:0, scale:1, duration:1, ease:"power3.out" }, 0.8)
      .to('#btnReveal', { opacity:1, y:0, duration:0.8, ease:"power3.out" }, 1.2);

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };
  }, []);

  const revealVerse = () => {
    const v = DEFAULT_VERSES[Math.floor(Math.random() * DEFAULT_VERSES.length)];
    setActiveVerse(v);
    setShowResult(true);

    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

    const reveal = gsap.timeline();
    reveal.to('#bismillah', { opacity:1, duration:1, ease:"power3.out" }, 0)
          .to('#ayatArabic', { opacity:1, y:0, duration:1.2, ease:"power3.out" }, 0.5)
          .to('#divider', { opacity:1, width:60, duration:0.8, ease:"power3.out" }, 1.2)
          .to('#ayatLatin', { opacity:1, y:0, duration:0.8, ease:"power3.out" }, 1.5)
          .to('#ayatMeaning', { opacity:1, y:0, duration:0.8, ease:"power3.out" }, 1.8)
          .to('#ayatSource', { opacity:1, duration:0.6, ease:"power3.out" }, 2.2)
          .then(() => {
              gsap.fromTo('#btnNew', { opacity:0, y:10, display:'inline-block' }, { opacity: 1, y: 0, duration: 0.5 });
          });

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    
    const match = v.source.match(/QS\.\s+(.+?):\s+(\d+)/);
    if (match) {
        const surahName = match[1];
        const ayahNum = parseInt(match[2], 10);
        const surahNum = surahMap[surahName];
        
        if (surahNum) {
            const s = String(surahNum).padStart(3, '0');
            const a = String(ayahNum).padStart(3, '0');
            const audioUrl = `https://audio.qurancdn.com/Alafasy/mp3/${s}${a}.mp3`;
            
            audioRef.current = new Audio(audioUrl);
            audioRef.current.play().catch(e => {
                console.log("Audio autoplay blocked by browser: " + e);
            });
        }
    }
  };

  const resetVerse = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }

    gsap.set(['#bismillah','#ayatArabic','#divider','#ayatLatin','#ayatMeaning','#ayatSource'], { opacity:0 });
    gsap.set(['#ayatArabic','#ayatLatin','#ayatMeaning'], { y:15 });
    gsap.set('#divider', { width:0 });
    gsap.set('#btnNew', { display: 'none' });
    
    setShowResult(false);
    setTimeout(() => revealVerse(), 100);
  };

  return (
    <div className="divine-wrapper">
      <div style={{ position: 'absolute', top: 30, right: 30, zIndex: 200 }}>
          <ThemeToggle />
      </div>

      <div className="geo-bg">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="isl" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <polygon points="10,0 20,5 20,15 10,20 0,15 0,5" fill="none" stroke="rgba(212,175,55,0.5)" strokeWidth="0.3"/>
                <circle cx="10" cy="10" r="2" fill="none" stroke="rgba(27,94,32,0.5)" strokeWidth="0.2"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#isl)"/>
        </svg>
      </div>
      <div className="ambient"></div>
      <div id="particleField"></div>

      <Link href="/fitur" className="btn-back"><i className="fa-solid fa-chevron-left"></i> Kembali</Link>

      <div className="divine-content">
        <h1 className="page-title" id="pageTitle">Kalam Ilahi</h1>
        <p className="page-sub" id="pageSub">Terima pesan suci yang ditakdirkan untuk Anda hari ini</p>

        <div className="verse-card" id="verseCard">
            <div className="bismillah" id="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
            <div className="ayat-arabic" id="ayatArabic">{activeVerse?.arabic}</div>
            <div className="divider" id="divider"></div>
            <div className="ayat-latin" id="ayatLatin">{activeVerse ? `"${activeVerse.latin}"` : ""}</div>
            <div className="ayat-meaning" id="ayatMeaning">{activeVerse?.meaning}</div>
            <div className="ayat-source" id="ayatSource">{activeVerse?.source}</div>
        </div>

        <button className="btn-reveal" id="btnReveal" style={{ display: showResult ? 'none' : 'inline-block' }} onClick={revealVerse}>
          <i className="fa-solid fa-star-and-crescent"></i>&nbsp; Terima Kalam
        </button>
        
        <button className="btn-new" id="btnNew" onClick={resetVerse}>Terima Kalam Lain</button>
      </div>
    </div>
  );
}
