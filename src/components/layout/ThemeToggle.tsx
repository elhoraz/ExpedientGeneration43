"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { executeThemeTransition } from "@/lib/theme/executeThemeTransition";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSpinning, setIsSpinning] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const savedTheme = (localStorage.getItem("expedient_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 550);

    executeThemeTransition(nextTheme, e);
  };

  return (
    <button 
      className={`theme-widget hover-trigger ${isSpinning ? "theme-spinning" : ""}`}
      id="btnTheme" 
      title={t.common.theme_toggle} 
      onClick={toggleTheme}
      aria-label={t.common.theme_toggle}
      suppressHydrationWarning
    >
      <div className="icon-orb">
        <i className={`fa-solid ${theme === "dark" ? "fa-moon" : "fa-sun"}`} id="toggleIcon"></i>
      </div>
      <span className="widget-text" id="themeText">
        {theme === "dark" ? t.common.theme_dark : t.common.theme_light}
      </span>
    </button>
  );
}
