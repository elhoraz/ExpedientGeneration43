"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("expedient_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("expedient_theme", nextTheme);
  };

  return (
    <button 
      className="theme-widget hover-trigger" 
      id="btnTheme" 
      title="Ganti Mode" 
      onClick={toggleTheme}
      suppressHydrationWarning
    >
      <div className="icon-orb">
        <i className={`fa-solid ${theme === "dark" ? "fa-moon" : "fa-sun"}`} id="toggleIcon"></i>
      </div>
      <span className="widget-text" id="themeText">{theme === "dark" ? "Malam" : "Siang"}</span>
    </button>
  );
}
