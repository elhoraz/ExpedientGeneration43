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

  // Check auth & initialize quest state
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;
      setIsLoggedIn(true);

      const dismissed = localStorage.getItem(WIDGET_DISMISSED_KEY) === "true";
      setIsDismissed(dismissed);

      // Load completed quests
      const done = new Set<string>();
      done.add("login"); // Always done if logged in
      localStorage.setItem("expedient_quest_login", "true");

      QUESTS.forEach((q) => {
        if (localStorage.getItem(q.storageKey) === "true") {
          done.add(q.id);
        }
      });
      setCompletedIds(done);
    };

    init();
  }, []);

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
      // Re-evaluate completion
      const done = new Set<string>();
      done.add("login");
      QUESTS.forEach((q) => {
        if (localStorage.getItem(q.storageKey) === "true") {
          done.add(q.id);
        }
      });
      setCompletedIds(done);
    }
  }, [pathname, isLoggedIn]);

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
