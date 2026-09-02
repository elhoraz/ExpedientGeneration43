"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import "./onboarding.css";

type TourStep = {
  /** CSS selector to find the target element */
  selector: string;
  /** Icon class (FontAwesome) */
  icon: string;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Preferred tooltip position relative to the spotlight */
  position: "right" | "left" | "bottom" | "top";
  /** Optional: ensure sidebar is open before spotlighting sidebar items */
  requireSidebar?: boolean;
};

const TOUR_STEPS: TourStep[] = [
  {
    selector: '#sidebarNav a[href="/beranda"]',
    icon: "fa-solid fa-landmark",
    title: "Beranda — Museum Kenangan",
    description:
      "Halaman utama portal. Di sini kamu bisa lihat logo angkatan interaktif 3D, lorong kenangan foto masa pondok, timeline sejarah angkatan, dan buku tamu alumni.",
    position: "right",
    requireSidebar: true,
  },
  {
    selector: '#sidebarNav a[href="/direktori"]',
    icon: "fa-solid fa-address-book",
    title: "Direktori — Buku Kontak Alumni",
    description:
      "Cari nama kawan lama berdasarkan konsulat, asal daerah, atau profesi. Temukan sahabat yang sudah lama tidak bertemu!",
    position: "right",
    requireSidebar: true,
  },
  {
    selector: '#sidebarNav a[href="/galeri"]',
    icon: "fa-solid fa-film",
    title: "Galeri — Arsip Foto & Video",
    description:
      "Kumpulan foto dan video kenangan masa pondok. Kamu juga bisa upload dan berbagi momen kenanganmu sendiri.",
    position: "right",
    requireSidebar: true,
  },
  {
    selector: '#sidebarNav a[href="/radar"]',
    icon: "fa-solid fa-earth-asia",
    title: "Radar — Peta Persebaran Alumni",
    description:
      "Peta interaktif yang menunjukkan di kota mana saja kawan-kawan seangkatan kita tinggal. Perbarui lokasimu agar teman-teman tahu!",
    position: "right",
    requireSidebar: true,
  },
  {
    selector: '#sidebarNav a[href="/syndicate"]',
    icon: "fa-solid fa-chess-knight",
    title: "Council — Forum Musyawarah",
    description:
      "Ruang diskusi dan musyawarah angkatan. Tempat urun rembug, ngobrol santai, dan merencanakan kegiatan bersama sesama alumni.",
    position: "right",
    requireSidebar: true,
  },
  {
    selector: '#sidebarNav a[href="/fitur"]',
    icon: "fa-solid fa-gem",
    title: "Fitur — Semua Fitur Eksklusif",
    description:
      "Kumpulan fitur lengkap: KTA digital, jejaring bisnis & karir alumni, kas angkatan, jadwal reuni, dan masih banyak lagi.",
    position: "right",
    requireSidebar: true,
  },
  {
    selector: "#btnChatWidget",
    icon: "fa-solid fa-comment-dots",
    title: "Obrolan Alumni",
    description:
      "Ngobrol langsung dengan sesama alumni secara real-time. Ada ruang obrolan bersama (Lounge) dan juga chat pribadi antar kawan.",
    position: "left",
  },
  {
    selector: "#btnNotifWidget",
    icon: "fa-solid fa-bell",
    title: "Notifikasi",
    description:
      "Pemberitahuan penting: pesan baru, ucapan ulang tahun kawan, undangan acara reuni, dan info terbaru seputar angkatan.",
    position: "left",
  },
  {
    selector: "#btnTheme",
    icon: "fa-solid fa-moon",
    title: "Mode Tampilan",
    description:
      "Ganti tampilan ke mode gelap atau terang sesuai kenyamananmu. Pilih yang paling enak di mata!",
    position: "left",
  },
  {
    selector: '#sidebarNav a[href="/profil"]',
    icon: "fa-solid fa-user-astronaut",
    title: "Profil — Data Pribadimu",
    description:
      "Kelola data alumni: foto, bio, nomor kontak, media sosial, dan KTA digitalmu. Pastikan datamu selalu terbaru supaya teman-teman mudah menghubungimu!",
    position: "right",
    requireSidebar: true,
  },
];

const STORAGE_KEY = "expedient_onboarding_tour_done";

export default function OnboardingTour({
  isActive,
  onComplete,
}: {
  isActive: boolean;
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [arrowDir, setArrowDir] = useState<"left" | "right" | "top" | "bottom">("left");
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStep];

  // Open sidebar if needed
  const ensureSidebarOpen = useCallback(() => {
    const sidebarEl = document.getElementById("sidebarNav");
    if (sidebarEl && !sidebarEl.classList.contains("active")) {
      const openBtn = document.getElementById("btnMenuOpen");
      if (openBtn) openBtn.click();
    }
  }, []);

  // Position the spotlight and tooltip based on the current step's target element
  const positionElements = useCallback(() => {
    if (!step) return;

    if (step.requireSidebar) {
      ensureSidebarOpen();
    }

    // Small delay to let sidebar animation complete
    const delay = step.requireSidebar ? 350 : 50;
    setTimeout(() => {
      const el = document.querySelector(step.selector) as HTMLElement;
      if (!el) {
        // If element not found, skip step
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          handleFinish();
        }
        return;
      }

      const rect = el.getBoundingClientRect();
      const padding = 8;
      setSpotlightRect(
        new DOMRect(
          rect.left - padding,
          rect.top - padding,
          rect.width + padding * 2,
          rect.height + padding * 2
        )
      );

      // Calculate tooltip position
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 768;
      const tooltipWidth = isMobile ? Math.min(340, vw - 24) : 380;
      const tooltipHeight = isMobile ? 220 : 260;
      let top = 0;
      let left = 0;
      let arrow: "left" | "right" | "top" | "bottom" = "left";

      if (isMobile) {
        left = Math.max(12, (vw - tooltipWidth) / 2);
        // If spotlight is in lower half of viewport (e.g. sidebar), place tooltip above it
        if (rect.top > vh / 2) {
          top = Math.max(20, rect.top - tooltipHeight - 16);
          arrow = "bottom";
        } else {
          // If spotlight is in upper half (e.g. widgets), place tooltip below it
          top = Math.min(vh - tooltipHeight - 20, rect.bottom + 16);
          arrow = "top";
        }
      } else {
        switch (step.position) {
          case "right":
            top = rect.top - 10;
            left = rect.right + 20;
            arrow = "left";
            if (left + tooltipWidth > vw - 20) {
              left = rect.left - tooltipWidth - 20;
              arrow = "right";
            }
            break;
          case "left":
            top = rect.top - 10;
            left = rect.left - tooltipWidth - 20;
            arrow = "right";
            if (left < 20) {
              left = rect.right + 20;
              arrow = "left";
            }
            break;
          case "bottom":
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            arrow = "top";
            break;
          case "top":
            top = rect.top - tooltipHeight - 20;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            arrow = "bottom";
            break;
        }

        // Clamp within viewport
        top = Math.max(20, Math.min(top, vh - tooltipHeight - 20));
        left = Math.max(20, Math.min(left, vw - tooltipWidth - 20));
      }

      setTooltipPos({ top, left });
      setArrowDir(arrow);
      setIsVisible(true);
    }, delay);
  }, [step, currentStep, ensureSidebarOpen]);

  useEffect(() => {
    if (isActive) {
      positionElements();
    }
  }, [isActive, currentStep, positionElements]);

  // Handle window resize
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => positionElements();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, positionElements]);

  const handleNext = () => {
    setIsVisible(false);
    if (currentStep < TOUR_STEPS.length - 1) {
      setTimeout(() => setCurrentStep((prev) => prev + 1), 200);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsVisible(false);
      setTimeout(() => setCurrentStep((prev) => prev - 1), 200);
    }
  };

  const handleFinish = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
    onComplete();
  };

  if (!isActive || !spotlightRect) return null;

  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className={`onboarding-overlay ${isVisible ? "active" : ""}`}>
      {/* Spotlight cutout */}
      <div
        className="onboarding-spotlight"
        style={{
          top: spotlightRect.top,
          left: spotlightRect.left,
          width: spotlightRect.width,
          height: spotlightRect.height,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`onboarding-tooltip arrow-${arrowDir}`}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          opacity: isVisible ? 1 : 0,
        }}
      >
        <span className="onboarding-tooltip-step">
          Langkah {currentStep + 1} dari {TOUR_STEPS.length}
        </span>

        <div className="onboarding-tooltip-icon">
          <i className={step.icon}></i>
        </div>

        <h3 className="onboarding-tooltip-title">{step.title}</h3>
        <p className="onboarding-tooltip-desc">{step.description}</p>

        <div className="onboarding-tooltip-footer">
          {currentStep > 0 ? (
            <button className="onboarding-btn onboarding-btn-prev" onClick={handlePrev}>
              <i className="fa-solid fa-arrow-left"></i>
            </button>
          ) : (
            <button className="onboarding-btn onboarding-btn-skip" onClick={handleFinish}>
              Lewati
            </button>
          )}

          <div className="onboarding-dots">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`onboarding-dot ${i === currentStep ? "active" : ""}`} />
            ))}
          </div>

          <button className="onboarding-btn onboarding-btn-next" onClick={handleNext}>
            {isLast ? (
              <>
                Selesai <i className="fa-solid fa-check"></i>
              </>
            ) : (
              <>
                Lanjut <i className="fa-solid fa-arrow-right"></i>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
