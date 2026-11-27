"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDialogEscape } from "@/hooks/useDialogEscape";
import "./onboarding.css";

type QuestItem = {
  id: string;
  icon: string;
  label: string;
  href: string;
  actionText: string;
  storageKey: string;
  trackPaths: string[];
};

const WIDGET_DISMISSED_KEY = "expedient_quest_dismissed";

export default function OnboardingChecklist() {
  const { t, locale, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isDismissed, setIsDismissed] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const pathname = usePathname();

  useDialogEscape(isOpen, () => setIsOpen(false));

  const quests: QuestItem[] = useMemo(
    () => [
      {
        id: "login",
        icon: "fa-solid fa-right-to-bracket",
        label: t.notification_quests?.quest_login || "Masuk ke portal alumni",
        href: "#",
        actionText: t.notification_quests?.action_done || "Selesai",
        storageKey: "expedient_quest_login",
        trackPaths: [],
      },
      {
        id: "profile",
        icon: "fa-solid fa-user-pen",
        label: t.notification_quests?.quest_profile || "Lengkapi foto & data profil",
        href: "/profil",
        actionText: t.notification_quests?.action_open_profile || "Buka Profil",
        storageKey: "expedient_quest_profile",
        trackPaths: ["/profil"],
      },
      {
        id: "radar",
        icon: "fa-solid fa-map-location-dot",
        label: t.notification_quests?.quest_radar || "Perbarui lokasi domisili di peta",
        href: "/radar",
        actionText: t.notification_quests?.action_open_radar || "Buka Radar",
        storageKey: "expedient_quest_radar",
        trackPaths: ["/radar"],
      },
      {
        id: "directory",
        icon: "fa-solid fa-address-book",
        label: t.notification_quests?.quest_directory || "Cari & sapa kawan lama",
        href: "/direktori",
        actionText: t.notification_quests?.action_open_directory || "Buka Direktori",
        storageKey: "expedient_quest_directory",
        trackPaths: ["/direktori"],
      },
    ],
    [t]
  );

  const reloadQuests = useCallback(async () => {
    if (typeof window === "undefined") return;
    const done = new Set<string>();
    done.add("login");
    localStorage.setItem("expedient_quest_login", "true");

    quests.forEach((q) => {
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
          .select("foto_profil, no_whatsapp, lat, lng, motivasi_hidup")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          const hasGps = profile.lat !== null && profile.lng !== null && Number(profile.lat) !== 0 && Number(profile.lng) !== 0;
          if (hasGps) {
            done.add("radar");
            localStorage.setItem("expedient_quest_radar", "true");
          }
          const hasCustomPhoto = profile.foto_profil && !profile.foto_profil.includes("ui-avatars.com");
          const hasPhone = profile.no_whatsapp;
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
  }, [quests]);

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
    quests.forEach((q) => {
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
  }, [pathname, isLoggedIn, reloadQuests, quests]);

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
  const totalCount = quests.length;
  const allDone = completedCount >= totalCount;
  const progressPercent = (completedCount / totalCount) * 100;

  if (!isLoggedIn || isDismissed || allDone) return null;

  const remainingCount = totalCount - completedCount;
  const panelTitle =
    t.notification_quests?.tab_quests ||
    (locale === "ar" ? "مهام الخطوات الأولى" : locale === "en" ? "Starter Missions" : "Misi Langkah Awal");

  return (
    <>
      <button
        type="button"
        className={`quest-fab ${!hasAnimated ? "quest-fab-bounce" : ""}`}
        id="btnQuestWidget"
        onClick={() => setIsOpen(!isOpen)}
        title={panelTitle}
        aria-label={panelTitle}
        aria-expanded={isOpen}
        aria-controls="questPanelDrawer"
      >
        <div className="quest-fab-inner">
          <i className="fa-solid fa-scroll" aria-hidden="true"></i>
          {remainingCount > 0 && (
            <span className="quest-fab-badge">{remainingCount}</span>
          )}
        </div>
      </button>

      {isOpen && (
        <div
          id="questPanelDrawer"
          className="quest-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quest-panel-title"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="quest-panel-header">
            <div className="quest-panel-title-row">
              <i className="fa-solid fa-scroll" aria-hidden="true" style={{ color: "var(--gold-main, #d4af37)" }}></i>
              <h3 id="quest-panel-title" className="quest-panel-title">{panelTitle}</h3>
            </div>
            <div className="quest-panel-actions">
              <button
                type="button"
                className="quest-panel-close"
                onClick={() => setIsOpen(false)}
                title={t.common.close}
                aria-label={t.common.close}
              >
                <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div className="quest-progress-section">
            <div className="quest-progress-text">
              <span>
                {locale === "ar"
                  ? `${completedCount}/${totalCount} مكتمل`
                  : locale === "en"
                  ? `${completedCount}/${totalCount} completed`
                  : `${completedCount}/${totalCount} selesai`}
              </span>
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
            {quests.map((quest) => {
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
                  <div className="quest-item-icon" aria-hidden="true">
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
                    <span className="quest-item-done" aria-hidden="true">
                      <i className="fa-solid fa-check"></i>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="quest-panel-footer">
            <button
              type="button"
              className="quest-footer-btn"
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent("expedient-restart-tour"));
              }}
            >
              <i className="fa-solid fa-compass" aria-hidden="true"></i>
              {locale === "ar" ? "إعادة جولة البوابة" : locale === "en" ? "Restart Portal Tour" : "Ulangi Tur Portal"}
            </button>
            <button
              type="button"
              className="quest-footer-btn quest-dismiss-btn"
              onClick={handleDismiss}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              {locale === "ar" ? "إخفاء المهام" : locale === "en" ? "Hide Quests" : "Sembunyikan Misi"}
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="quest-backdrop" aria-hidden="true" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
