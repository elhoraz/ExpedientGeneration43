"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import ThemeToggle from "@/components/layout/ThemeToggle";
import "./celestial.css";

const DEFAULT_CARDS = [
  { numeral: "I", iconClass: "fa-sun", name: "Fajar Cahaya", meaning: "Pencerahan, ketulusan niat, dan kejelasan arah. Segala ikhtiar dimulai dari hati yang jernih." },
  { numeral: "II", iconClass: "fa-moon", name: "Lailatul Hening", meaning: "Muhasabah, ketenangan batin, dan kepekaan nurani dalam membaca tanda kebaikan." },
  { numeral: "III", iconClass: "fa-compass", name: "Qiblat Harapan", meaning: "Harapan, keteguhan arah, dan kedamaian spiritual menuju tujuan yang diridhai." },
  { numeral: "IV", iconClass: "fa-bolt", name: "Azam Perubahan", meaning: "Keberanian memutus kebiasaan lama demi membangun perbaikan yang bermakna." },
  { numeral: "V", iconClass: "fa-shield-halved", name: "Teguh Prinsip", meaning: "Keberanian membela kebenaran serta ketajaman membedakan yang hak dan batil." },
  { numeral: "VI", iconClass: "fa-scale-balanced", name: "Mizan Keadilan", meaning: "Keseimbangan hak dan kewajiban; setiap amal akan menuai akibatnya sendiri." },
  { numeral: "VII", iconClass: "fa-hourglass-half", name: "Sabr & Masa", meaning: "Kesabaran menapaki proses. Hal terbaik tumbuh matang melalui waktu yang tepat." },
  { numeral: "VIII", iconClass: "fa-infinity", name: "Istiqamah", meaning: "Keteguhan langkah dan keluasan potensi diri yang diasah tanpa henti." },
  { numeral: "IX", iconClass: "fa-book-open", name: "Bashirah Ilmu", meaning: "Kebijaksanaan batin dan pandangan jauh ke depan yang bersandar pada ilmu." },
  { numeral: "X", iconClass: "fa-crown", name: "Amanah Khilafah", meaning: "Kepemimpinan yang bertanggung jawab dan pengendalian diri dalam setiap amanah." }
];

export default function CelestialClient() {
  const [drawnCards, setDrawnCards] = useState<any[]>([]);
  const [flippedCount, setFlippedCount] = useState(0);
  const [canReset, setCanReset] = useState(false);
  const [subtitle, setSubtitle] = useState("Tarik tiga kartu untuk mengungkap takdir Anda hari ini");
  const [subtitleColor, setSubtitleColor] = useState("var(--text-secondary, #7b8e9b)");
  const [isDrawing, setIsDrawing] = useState(false);

  const burstContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const particleField = document.getElementById('particleField');
    if (particleField && !reducedMotion) {
        for (let i = 0; i < 24; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.animationDuration = (Math.random() * 8 + 6) + 's';
            p.style.animationDelay = (Math.random() * 10) + 's';
            p.style.width = (Math.random() * 3 + 1) + 'px';
            p.style.height = p.style.width;
            particleField.appendChild(p);
        }
    }

    if (reducedMotion) {
      gsap.set('#codexTitle, #codexSubtitle, .tarot-card, #btnDraw', { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline();
    tl.to('#codexTitle', { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.2)
      .to('#codexSubtitle', { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.4)
      .to('.tarot-card', { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "back.out(1.4)" }, 0.5)
      .to('#btnDraw', { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.9);
  }, []);

  const handleDraw = () => {
    const shuffled = [...DEFAULT_CARDS].sort(() => Math.random() - 0.5);
    setDrawnCards(shuffled.slice(0, 3));
    setIsDrawing(true);
    setSubtitle("Sentuh setiap kartu untuk mengungkap takdir Anda");
    setSubtitleColor("var(--text-secondary, #7b8e9b)");
    
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleFlip = (index: number) => {
    if (drawnCards.length === 0) return;
    
    const cardEl = document.getElementById(`card${index}`);
    if (cardEl && !cardEl.classList.contains('flipped')) {
        cardEl.classList.add('flipped');
        setFlippedCount(prev => prev + 1);

        if (navigator.vibrate) navigator.vibrate([30, 50, 80]);
        if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
          createBurst(cardEl);
        }
    }
  };

  useEffect(() => {
    if (flippedCount >= 3) {
        setTimeout(() => {
            setSubtitle(`"Takdir telah berbicara. Simpan kebijaksanaannya."`);
            setSubtitleColor("var(--gold-main, #d4af37)");
            setCanReset(true);
            if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
              gsap.set('#btnReset', { opacity: 1, y: 0, display: 'inline-flex' });
            } else {
              gsap.fromTo('#btnReset', { opacity: 0, y: 10, display: 'inline-flex' }, { opacity: 1, y: 0, duration: 0.5 });
            }
        }, 1000);
    }
  }, [flippedCount]);

  const handleReset = () => {
    setFlippedCount(0);
    setDrawnCards([]);
    setCanReset(false);
    
    document.querySelectorAll('.tarot-card').forEach(card => {
        card.classList.remove('flipped');
    });

    setSubtitle("Tarik tiga kartu untuk mengungkap takdir Anda hari ini");
    setSubtitleColor("var(--text-secondary, #7b8e9b)");
    
    setTimeout(() => {
        setIsDrawing(false);
    }, 600);
  };

  const createBurst = (cardEl: HTMLElement) => {
    if (!burstContainerRef.current) return;
    const rect = cardEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const container = burstContainerRef.current;

    for (let i = 0; i < 16; i++) {
        const p = document.createElement('div');
        p.className = 'burst-particle';
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        container.appendChild(p);

        const angle = (Math.PI * 2 / 16) * i;
        const dist = 60 + Math.random() * 80;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        gsap.to(p, {
            x: tx,
            y: ty,
            opacity: 0,
            scale: 0,
            duration: 0.7 + Math.random() * 0.3,
            ease: "power2.out",
            onComplete: () => p.remove()
        });
    }
  };

  return (
    <div className="celestial-wrapper">
      <div className="celestial-top-nav">
        <Link href="/fitur" className="btn-back">
          <i className="fa-solid fa-chevron-left"></i> Exit Codex
        </Link>
        <ThemeToggle />
      </div>

      <div className="ambient"></div>
      <div id="particleField"></div>

      <div className="codex-wrapper">
        <h1 className="codex-title" id="codexTitle">The Celestial Codex</h1>
        <p className="codex-subtitle" id="codexSubtitle" style={{ color: subtitleColor }}>{subtitle}</p>

        <div className="card-stage" id="cardStage">
            {[0, 1, 2].map((i) => (
                <button
                    key={i}
                    type="button"
                    className="tarot-card"
                    id={`card${i}`}
                    disabled={!isDrawing}
                    style={{ cursor: isDrawing ? 'pointer' : 'default', background: 'transparent', border: 'none', padding: 0, textAlign: 'inherit' }}
                    onClick={() => isDrawing && handleFlip(i)}
                    aria-label={drawnCards[i] ? `${drawnCards[i].name}: ${drawnCards[i].meaning}` : `Card ${i + 1}`}
                >
                    <div className="card-inner">
                        <div className="card-face card-back">
                            <div className="card-back-design"><Image src="/images/logo-utuh.webp" alt="" aria-hidden="true" width={100} height={100} priority style={{ width: "50%", height: "auto" }} /></div>
                        </div>
                        <div className="card-face card-front">
                            {drawnCards[i] && (
                                <>
                                    <div className="card-numeral">{drawnCards[i].numeral}</div>
                                    <div className="card-symbol" aria-hidden="true">
                                      <i className={`fa-solid ${drawnCards[i].iconClass}`}></i>
                                    </div>
                                    <div className="card-line" aria-hidden="true"></div>
                                    <div className="card-name">{drawnCards[i].name}</div>
                                    <div className="card-line" aria-hidden="true"></div>
                                    <div className="card-meaning">{drawnCards[i].meaning}</div>
                                </>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>

        {!isDrawing && <button type="button" className="btn-draw" id="btnDraw" onClick={handleDraw}>Tarik Kartu Takdir</button>}
        <button type="button" className="btn-reset" id="btnReset" onClick={handleReset} style={{ display: canReset ? 'inline-flex' : 'none', alignItems: 'center', justifyContent: 'center' }}>Tarik Ulang</button>
      </div>

      <div className="burst-container" id="burstContainer" ref={burstContainerRef}></div>
    </div>
  );
}
