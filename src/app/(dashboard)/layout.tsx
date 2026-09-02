import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { ReactNode } from "react";
import ScrollTopButton from "@/components/ui/ScrollTopButton";
import GlobalCallListener from "@/components/chat/GlobalCallListener";
import OnboardingProvider from "@/components/onboarding/OnboardingProvider";
import CommandPalette from "@/components/layout/CommandPalette";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Sidebar />
      <Navbar />

      <main className="main-wrapper">
        {children}
      </main>

      {/* Global Dashboard UI Elements */}
      
      {/* Scroll to top button */}
      <ScrollTopButton />

      {/* Global incoming call listener (works on ALL dashboard pages) */}
      <GlobalCallListener />

      {/* Guided onboarding tour for new alumni */}
      <OnboardingProvider />

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette />
    </>
  );
}
