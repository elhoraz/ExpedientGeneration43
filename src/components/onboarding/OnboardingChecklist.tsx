"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "./onboarding.css";

type QuestItem = {
  id: string;
  icon: string;
  label: string;
  href: string;
  actionText: string;
  storageKey: string;
  /** Pages that count as "visited" for this quest */
  trackPaths: string[];
};

const QUESTS: QuestItem[] = [
  {
    id: "login",
    icon: "fa-solid fa-right-to-bracket",
    label: "Login ke portal alumni",
    href: "#",
    actionText: "Selesai ✓",
    storageKey: "expedient_quest_login",
    trackPaths: [], // Always completed
  },
  {
    id: "profile",
    icon: "fa-solid fa-user-pen",
    label: "Lengkapi foto & data profil",
    href: "/profil",
    actionText: "Buka Profil →",
    storageKey: "expedient_quest_profile",
    trackPaths: ["/profil"],
  },
  {
    id: "radar",
    icon: "fa-solid fa-map-location-dot",
    label: "Perbarui lokasi tinggalmu di peta",
    href: "/radar",
    actionText: "Buka Radar →",
    storageKey: "expedient_quest_radar",
    trackPaths: ["/radar"],
  },
  {
    id: "directory",
    icon: "fa-solid fa-address-book",
    label: "Cari & sapa kawan lama",
    href: "/direktori",
    actionText: "Buka Direktori →",
    storageKey: "expedient_quest_directory",
    trackPaths: ["/direktori"],
  },
];

const WIDGET_DISMISSED_KEY = "expedient_quest_dismissed";

export default function OnboardingChecklist() {
  const [isOpen, setIsOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isDismissed, setIsDismissed] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const pathname = usePathname();

  const reloadQuests = useCallback(async () => {
    if (typeof window === "undefined") return;
    const done = new Set<string>();
    done.add("login");
    localStorage.setItem("expedient_quest_login", "true");

    QUESTS.forEach((q) => {
      if (localStorage.getItem(q.storageKey) === "true") {
        done.add(q.id);
      }
    });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("foto_profil, no_whatsapp, no_hp, lat, lng, motivasi_hidup")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          const hasGps = profile.lat !== null && profile.lng !== null && Number(profile.lat) !== 0 && Number(profile.lng) !== 0;
          if (hasGps) {
            done.add("radar");
            localStorage.setItem("expedient_quest_radar", "true");
          }
          const hasCustomPhoto = profile.foto_profil && !profile.foto_profil.includes("ui-avatars.com");
          const hasPhone = profile.no_whatsapp || profile.no_hp;
          if (hasCustomPhoto || (hasPhone && profile.motivasi_hidup)) {
            done.add("profile");
            localStorage.setItem("expedient_quest_profile", "true");
          }
        }
      }
    } catch {
      // ignore
    }

    setCompletedIds(new Set(done));
  }, []);

  // Check auth & initialize quest state
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;
      setIsLoggedIn(true);

      const dismissed = localStorage.getItem(WIDGET_DISMISSED_KEY) === "true";
      setIsDismissed(dismissed);

      await reloadQuests();
    };

    init();

    const handleUpdate = () => reloadQuests();
    window.addEventListener("expedient-quest-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("expedient-quest-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [reloadQuests]);

  // Track page visits reactively when pathname changes
  useEffect(() => {
    if (!pathname || !isLoggedIn) return;

    let changed = false;
    QUESTS.forEach((q) => {
      if (q.trackPaths.length > 0 && q.trackPaths.some((p) => pathname.startsWith(p))) {
        if (localStorage.getItem(q.storageKey) !== "true") {
          localStorage.setItem(q.storageKey, "true");
          changed = true;
        }
      }
    });

    if (changed) {
      reloadQuests();
      window.dispatchEvent(new CustomEvent("expedient-quest-updated"));
    }
  }, [pathname, isLoggedIn, reloadQuests]);

  // Bounce animation on first render to draw attention
  useEffect(() => {
    if (isLoggedIn && !isDismissed && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, isDismissed, hasAnimated]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsOpen(false);
    localStorage.setItem(WIDGET_DISMISSED_KEY, "true");
  };

  const completedCount = completedIds.size;
  const totalCount = QUESTS.length;
  const allDone = completedCount >= totalCount;
  const progressPercent = (completedCount / totalCount) * 100;

  // Don't render for guests, dismissed state, or if all quests done
  if (!isLoggedIn || isDismissed || allDone) return null;

  const remainingCount = totalCount - completedCount;

  return (
    <>
      {/* Floating quest button */}
      <button
        className={`quest-fab ${!hasAnimated ? "quest-fab-bounce" : ""}`}
        id="btnQuestWidget"
        onClick={() => setIsOpen(!isOpen)}
        title="Misi Alumni Baru"
      >
        <div className="quest-fab-inner">
          <i className="fa-solid fa-scroll"></i>
          {remainingCount > 0 && (
            <span className="quest-fab-badge">{remainingCount}</span>
          )}
        </div>
      </button>

      {/* Quest panel dropdown */}
      {isOpen && (
        <div className="quest-panel">
          <div className="quest-panel-header">
            <div className="quest-panel-title-row">
              <i className="fa-solid fa-scroll" style={{ color: "var(--gold-main, #d4af37)" }}></i>
              <h3 className="quest-panel-title">Misi Alumni Baru</h3>
            </div>
            <div className="quest-panel-actions">
              <button
                className="quest-panel-close"
                onClick={() => setIsOpen(false)}
                title="Tutup"
              >
                <i className="fa-solid fa-chevron-down"></i>
              </button>
            </div>
          </div>

          <div className="quest-progress-section">
            <div className="quest-progress-text">
              <span>{completedCount}/{totalCount} selesai</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="quest-progress-bar">
              <div
                className="quest-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="quest-items">
            {QUESTS.map((quest) => {
              const isCompleted = completedIds.has(quest.id);
              return (
                <Link
                  key={quest.id}
                  href={quest.href}
                  className={`quest-item ${isCompleted ? "completed" : ""}`}
                  onClick={(e) => {
                    if (quest.href === "#") e.preventDefault();
                    else setIsOpen(false);
                  }}
                >
                  <div className="quest-item-icon">
                    {isCompleted ? (
                      <i className="fa-solid fa-circle-check"></i>
                    ) : (
                      <i className={quest.icon}></i>
                    )}
                  </div>
                  <div className="quest-item-content">
                    <span className="quest-item-label">{quest.label}</span>
                    {!isCompleted && (
                      <span className="quest-item-action">{quest.actionText}</span>
                    )}
                  </div>
                  {isCompleted && (
                    <span className="quest-item-done">✓</span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="quest-panel-footer">
              <button
                className="quest-footer-btn"
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent('expedient-restart-tour'));
                }}
              >
                <i className="fa-solid fa-compass"></i>
                Ulangi Tur Portal
              </button>
            <button
              className="quest-footer-btn quest-dismiss-btn"
              onClick={handleDismiss}
            >
              <i className="fa-solid fa-xmark"></i>
              Sembunyikan Misi
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div className="quest-backdrop" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
