import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { ReactNode } from "react";
import ScrollTopButton from "@/components/ui/ScrollTopButton";
import GlobalCallListener from "@/components/chat/GlobalCallListener";
import OnboardingProvider from "@/components/onboarding/OnboardingProvider";
import CommandPalette from "@/components/layout/CommandPalette";
import HelpButtonTrigger from "@/components/guide/HelpButtonTrigger";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-root">
      <Sidebar />
      <div className="dashboard-content-area">
        <Navbar />
        <main className="main-wrapper">
          {children}
        </main>
      </div>

      {/* Global Dashboard UI Elements */}
      <HelpButtonTrigger />
      <ScrollTopButton />
      <GlobalCallListener />
      <OnboardingProvider />
      <CommandPalette />
    </div>
  );
}
