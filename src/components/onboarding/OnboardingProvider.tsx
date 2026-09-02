"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import WelcomeModal from "./WelcomeModal";
import OnboardingTour from "./OnboardingTour";

const WELCOME_KEY = "expedient_onboarding_welcome_done";
const TOUR_KEY = "expedient_onboarding_tour_done";

/**
 * OnboardingProvider — orchestrates the Welcome Modal → Guided Tour flow.
 * Only shows for logged-in users who haven't completed the onboarding yet.
 * Renders nothing for guests or returning users.
 */
export default function OnboardingProvider() {
  const [phase, setPhase] = useState<"idle" | "welcome" | "tour">("idle");
  const [userName, setUserName] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkOnboarding = async () => {
      // Check localStorage first
      const welcomeDone = localStorage.getItem(WELCOME_KEY) === "true";
      const tourDone = localStorage.getItem(TOUR_KEY) === "true";

      if (welcomeDone && tourDone) return; // Already completed everything

      // Check if user is logged in
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return; // Guest — don't show onboarding

      // Fetch user name for welcome modal
      const { data: profile } = await supabase
        .from("profiles")
        .select("nama_panggilan, nama_lengkap")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.nama_panggilan || profile.nama_lengkap || "");
      }

      if (!welcomeDone) {
        setPhase("welcome");
      } else if (!tourDone) {
        setPhase("tour");
      }
    };

    // Small delay to let the dashboard fully render before starting tour
    const timer = setTimeout(checkOnboarding, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Listen for restart-tour event from the checklist widget
  useEffect(() => {
    const handleRestart = () => {
      localStorage.removeItem(TOUR_KEY);
      setPhase("tour");
    };
    window.addEventListener("expedient-restart-tour", handleRestart);
    return () => window.removeEventListener("expedient-restart-tour", handleRestart);
  }, []);

  const handleStartTour = () => {
    localStorage.setItem(WELCOME_KEY, "true");
    setPhase("tour");
  };

  const handleSkipWelcome = () => {
    localStorage.setItem(WELCOME_KEY, "true");
    localStorage.setItem(TOUR_KEY, "true");
    setPhase("idle");
  };

  const handleTourComplete = () => {
    localStorage.setItem(TOUR_KEY, "true");
    setPhase("idle");
  };

  if (!mounted) return null;

  return (
    <>
      {phase === "welcome" && (
        <WelcomeModal
          userName={userName}
          onStartTour={handleStartTour}
          onSkip={handleSkipWelcome}
        />
      )}

      <OnboardingTour isActive={phase === "tour"} onComplete={handleTourComplete} />
    </>
  );
}
