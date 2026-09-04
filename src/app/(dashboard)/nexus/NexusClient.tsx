"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { getAvatarUrl } from "@/lib/avatar";
import "./nexus.css";

export default function NexusClient({ currentUser, otherProfiles }: { currentUser: any, otherProfiles: any[] }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    document.body.classList.add("page-nexus");
    const cached = sessionStorage.getItem('nexus_results_cache');
    if (cached) {
        setMatches(JSON.parse(cached));
        setHasResults(true);
    } else {
        gsap.from(".nexus-header", { y: 30, opacity: 0, duration: 1, ease: "power2.out" });
        gsap.from(".nexus-sphere", { scale: 0.8, opacity: 0, duration: 1.5, ease: "elastic.out(1, 0.5)", delay: 0.3 });
    }

    return () => {
      document.body.classList.remove("page-nexus");
    };
  }, []);

  const startAnalysis = () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setHasResults(false);

    gsap.to(".nexus-sphere", { scale: 1.1, duration: 0.5 });
    gsap.set(".scanning-line", { opacity: 1 });
    const scanAnim = gsap.to(".scanning-line", { top: "100%", duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut" });

    const statuses = [
        "Mengekstraksi jejak linguistik...",
        "Membandingkan matriks kategori...",
        "Mengkalkulasi irisan visi & cita-cita...",
        "Menyinkronisasi konstelasi eksekutif..."
    ];

    let i = 0;
    const statusInterval = setInterval(() => {
        setStatusText(statuses[i % statuses.length]);
        i++;
    }, 800);

    // Simulate AI analysis delay
    setTimeout(() => {
        clearInterval(statusInterval);
        scanAnim.kill();
        gsap.to(".scanning-line", { opacity: 0, duration: 0.3 });
        gsap.to(".nexus-sphere", { scale: 1, duration: 0.5, ease: "power2.out" });
        setStatusText("Sinkronisasi Berhasil. Memuat Hasil.");
        
        // Generate matches based on CI4 Jaccard Index logic
        const calculateSimilarity = (target: any, candidate: any) => {
            let score = 0;
            
            const getCat = (prof: any) => {
                if (!prof || !prof.syndicate) return null;
                if (Array.isArray(prof.syndicate)) return prof.syndicate[0]?.kategori;
                return prof.syndicate.kategori;
            };
            
            const targetCat = getCat(target);
            const candCat = getCat(candidate);
            
            if (targetCat && candCat && targetCat.toLowerCase() === candCat.toLowerCase()) {
                score += 40;
            }
            
            const tokenize = (text: string) => {
                if (!text) return [];
                const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
                const stopwords = ['dan', 'yang', 'untuk', 'di', 'ke', 'dari', 'dalam', 'akan', 'ini', 'itu', 'dengan', 'saya', 'aku', 'menjadi', 'sebagai', 'pada', 'atau', 'ingin'];
                const tokens = words.filter(w => w.length > 3 && !stopwords.includes(w));
                return Array.from(new Set(tokens));
            };
            
            const targetTokens = tokenize((target?.cita_cita || '') + ' ' + (target?.motivasi_hidup || ''));
            const candTokens = tokenize((candidate?.cita_cita || '') + ' ' + (candidate?.motivasi_hidup || ''));
            
            if (targetTokens.length > 0 && candTokens.length > 0) {
                const intersection = targetTokens.filter(t => candTokens.includes(t));
                const union = new Set([...targetTokens, ...candTokens]);
                const jaccard = intersection.length / union.size;
                score += Math.round(jaccard * 60);
            } else {
                score += Math.floor(Math.random() * 11) + 5; // 5 to 15
            }
            
            return Math.min(score, 99);
        };

        const simulatedMatches = otherProfiles
            .map(p => ({
                ...p,
                match_score: calculateSimilarity(currentUser, p)
            }))
            .filter(p => p.match_score > 0)
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, 3);
            
        sessionStorage.setItem('nexus_results_cache', JSON.stringify(simulatedMatches));
        
        setTimeout(() => {
            setMatches(simulatedMatches);
            setHasResults(true);
            setIsAnalyzing(false);
            
            setTimeout(() => {
                gsap.fromTo('.match-card', 
                    { y: 50, opacity: 0 }, 
                    { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "back.out(1.2)" }
                );
            }, 100);
        }, 800);
        
    }, 3500);
  };

  const forceReanalyze = () => {
    sessionStorage.removeItem('nexus_results_cache');
    setHasResults(false);
    startAnalysis();
  };

  return (
    <div className="nexus-page-wrapper">
      <div className="nexus-wrapper">

      <Link href="/fitur" className="btn-back">
        <i className="fa-solid fa-arrow-left"></i> Kembali
      </Link>

      <div className="nexus-header">
        <h1 className="nexus-title">The Nexus</h1>
        <p className="nexus-subtitle">Algoritma Analitik Menghubungkan Visi, Merajut Jaringan Bisnis Eksekutif Masa Depan Anda.</p>
      </div>

      {!hasResults && (
        <div className="nexus-sphere-container">
            <div className="nexus-sphere" onClick={startAnalysis}>
                <div className="scanning-line"></div>
                <div className="nexus-core-text">{isAnalyzing ? 'MENGANALISIS...' : <>AKTIVASI<br/>ANALISIS</>}</div>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '0.85rem', marginTop: '20px', minHeight: '20px' }}>
                {statusText}
            </div>
        </div>
      )}

      {hasResults && (
        <div style={{ width: '100%', animation: 'fadeIn 1s' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)", fontSize: "1.8rem", fontWeight: "normal", marginBottom: "15px" }}>Kolega Strategis Anda</h3>
            <div style={{ width: "60px", height: "3px", background: "var(--gold-main, #d4af37)", margin: "0 auto", borderRadius: "3px", boxShadow: "0 0 10px rgba(212,175,55,0.5)" }}></div>
            
            {matches.length === 0 ? (
                <div style={{ color: "var(--text-secondary)", width: "100%", padding: "40px", border: "1px solid var(--glass-border)", borderRadius: "15px", background: "var(--glass-bg)", textAlign: "center" }}>
                    Belum ada data kolega yang memadai untuk analisis saat ini.
                </div>
            ) : (
                <div className="match-grid">
                    {matches.map(m => {
                        const avatarUrl = getAvatarUrl(m.foto_profil, m.nama_panggilan || m.nama_lengkap || 'A');
                        return (
                            <div key={m.id} className="match-card">
                                <div className="match-percentage">{m.match_score}<span>%</span></div>
                                <Image 
                                    src={avatarUrl} 
                                    width={100} 
                                    height={100} 
                                    className="match-avatar" 
                                    alt={m.nama_panggilan || m.nama_lengkap || "Avatar"} 
                                    loading="lazy"
                                    unoptimized={avatarUrl.startsWith("data:") || avatarUrl.includes("ui-avatars.com") || avatarUrl.includes("supabase.co")}
                                />
                                <div className="match-name">{m.nama_panggilan || m.nama_lengkap}</div>
                                <div className="match-category">
                                    {m.syndicate ? (Array.isArray(m.syndicate) ? m.syndicate[0]?.kategori : m.syndicate.kategori) || 'Independen' : 'Independen'}
                                </div>
                                <Link href={`/dossier/${m.id}`} className="btn-connect">Lihat Profil</Link>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <button className="btn-reanalyze" onClick={forceReanalyze}>
                <i className="fa-solid fa-rotate"></i> Analisis Ulang
            </button>
        </div>
      )}
    </div>
  </div>
  );
}
