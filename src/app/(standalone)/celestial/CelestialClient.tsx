"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import ThemeToggle from "@/components/layout/ThemeToggle";
import "./celestial.css";

const DEFAULT_CARDS = [
  { numeral: "I", symbol: "☀", name: "The Sun", meaning: "Pencerahan, kesuksesan yang gemilang, dan vitalitas. Segala hal akan menjadi jelas." },
  { numeral: "II", symbol: "☾", name: "The Moon", meaning: "Intuisi, ilusi, dan ketidaksadaran. Perhatikan mimpimu dan pesan tersirat." },
  { numeral: "III", symbol: "★", name: "The Star", meaning: "Harapan, inspirasi, dan kedamaian spiritual. Masa depan membawa janji cerah." },
  { numeral: "IV", symbol: "⚡", name: "The Tower", meaning: "Perubahan mendadak dan runtuhnya struktur lama untuk membangun yang baru." },
  { numeral: "V", symbol: "⚔", name: "The Sword", meaning: "Keberanian, kebenaran, dan kemampuan untuk memotong segala kebingungan." },
  { numeral: "VI", symbol: "⚖", name: "Justice", meaning: "Keadilan, keseimbangan, dan hukum karma. Setiap tindakan memiliki konsekuensi." },
  { numeral: "VII", symbol: "⏳", name: "Time", meaning: "Kesabaran dan siklus alami. Beberapa hal membutuhkan waktu untuk mekar." },
  { numeral: "VIII", symbol: "∞", name: "Infinity", meaning: "Potensi tak terbatas dan kekuatan batin yang tak terukur." },
  { numeral: "IX", symbol: "👁", name: "The Oracle", meaning: "Kebijaksanaan batin dan pandangan jauh ke depan. Percayai insting Anda." },
  { numeral: "X", symbol: "♚", name: "The Sovereign", meaning: "Otoritas, kepemimpinan, dan kendali mutlak atas takdir sendiri." }
];

export default function CelestialClient() {
  const [drawnCards, setDrawnCards] = useState<any[]>([]);
  const [flippedCount, setFlippedCount] = useState(0);
  const [canReset, setCanReset] = useState(false);
  const [subtitle, setSubtitle] = useState("Tarik tiga kartu untuk mengungkap takdir Anda hari ini");
  const [subtitleColor, setSubtitleColor] = useState("#7b8e9b");
  const [isDrawing, setIsDrawing] = useState(false);

  const burstContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const particleField = document.getElementById('particleField');
    if (particleField) {
        for (let i = 0; i < 30; i++) {
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

    const tl = gsap.timeline();
    tl.to('#codexTitle', { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 0.3)
      .to('#codexSubtitle', { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 0.6)
      .to('.tarot-card', { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "back.out(1.5)" }, 0.8)
      .to('#btnDraw', { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 1.4);
  }, []);

  const handleDraw = () => {
    const shuffled = [...DEFAULT_CARDS].sort(() => Math.random() - 0.5);
    setDrawnCards(shuffled.slice(0, 3));
    setIsDrawing(true);
    setSubtitle("Sentuh setiap kartu untuk mengungkap takdir Anda");
    setSubtitleColor("#7b8e9b");
    
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleFlip = (index: number) => {
    if (drawnCards.length === 0) return;
    
    const cardEl = document.getElementById(`card${index}`);
    if (cardEl && !cardEl.classList.contains('flipped')) {
        cardEl.classList.add('flipped');
        setFlippedCount(prev => prev + 1);

        if (navigator.vibrate) navigator.vibrate([30, 50, 80]);
        createBurst(cardEl);
    }
  };

  useEffect(() => {
    if (flippedCount >= 3) {
        setTimeout(() => {
            setSubtitle(`"Takdir telah berbicara. Simpan kebijaksanaannya."`);
            setSubtitleColor("#d4af37");
            setCanReset(true);
            gsap.fromTo('#btnReset', { opacity: 0, y: 10, display: 'inline-block' }, { opacity: 1, y: 0, duration: 0.5 });
        }, 1200);
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
    setSubtitleColor("#7b8e9b");
    
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

    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'burst-particle';
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        container.appendChild(p);

        const angle = (Math.PI * 2 / 20) * i;
        const dist = 60 + Math.random() * 80;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        gsap.to(p, {
            x: tx,
            y: ty,
            opacity: 0,
            scale: 0,
            duration: 0.8 + Math.random() * 0.4,
            ease: "power2.out",
            onComplete: () => p.remove()
        });
    }
  };

  return (
    <div className="celestial-wrapper">
      <div style={{ position: 'absolute', top: 30, right: 30, zIndex: 200 }}>
          <ThemeToggle />
      </div>

      <div className="ambient"></div>
      <div id="particleField"></div>

      <Link href="/fitur" className="btn-back">
        <i className="fa-solid fa-chevron-left"></i> Exit Codex
      </Link>

      <div className="codex-wrapper">
        <h1 className="codex-title" id="codexTitle">The Celestial Codex</h1>
        <p className="codex-subtitle" id="codexSubtitle" style={{ color: subtitleColor }}>{subtitle}</p>

        <div className="card-stage" id="cardStage">
            {[0, 1, 2].map((i) => (
                <div key={i} className="tarot-card" id={`card${i}`} style={{ cursor: isDrawing ? 'pointer' : 'default' }} onClick={() => isDrawing && handleFlip(i)}>
                    <div className="card-inner">
                        <div className="card-face card-back">
                            <div className="card-back-design"><Image src="/images/logo-utuh.webp" alt="Codex" width={100} height={100} priority style={{ width: "50%", height: "auto" }} /></div>
                        </div>
                        <div className="card-face card-front">
                            {drawnCards[i] && (
                                <>
                                    <div className="card-numeral">{drawnCards[i].numeral}</div>
                                    <div className="card-symbol">{drawnCards[i].symbol}</div>
                                    <div className="card-line"></div>
                                    <div className="card-name">{drawnCards[i].name}</div>
                                    <div className="card-line"></div>
                                    <div className="card-meaning">{drawnCards[i].meaning}</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {!isDrawing && <button className="btn-draw" id="btnDraw" onClick={handleDraw}>Tarik Kartu Takdir</button>}
        <button className="btn-reset" id="btnReset" onClick={handleReset} style={{ display: canReset ? 'inline-block' : 'none' }}>Tarik Ulang</button>
      </div>

      <div className="burst-container" id="burstContainer" ref={burstContainerRef}></div>
    </div>
  );
}
