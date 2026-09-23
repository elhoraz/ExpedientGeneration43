"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function OfflineClient() {
  const { t } = useLanguage();

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", 
      justifyContent: "center", minHeight: "100vh", padding: "40px 20px", 
      textAlign: "center", background: "#060b14", color: "#fff",
      position: "relative"
    }}>
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <LanguageSwitcher variant="pill" />
      </div>

      <i className="fa-solid fa-wifi" style={{ fontSize: "4rem", color: "#888", marginBottom: "20px", opacity: 0.5 }}></i>
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#d4af37", marginBottom: "15px", fontSize: "2.5rem" }}>
        {t.offline.title}
      </h1>
      <div style={{ color: "#d4af37", fontSize: "0.95rem", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px", fontWeight: 600 }}>
        {t.offline.subtitle}
      </div>
      <p style={{ color: "#aaa", maxWidth: "500px", lineHeight: 1.6, marginBottom: "30px" }}>
        {t.offline.desc}
      </p>
      
      <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" style={{
          background: "linear-gradient(135deg, #d4af37, #aa8529)", border: "none", color: "#060b14",
          padding: "12px 30px", borderRadius: "30px", fontSize: "0.9rem", fontWeight: 600,
          letterSpacing: "1px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none"
        }}>
          <i className="fa-solid fa-rotate-right"></i> {t.offline.try_again}
        </Link>
        <Link href="/beranda" style={{
          background: "transparent", border: "1px solid #d4af37", color: "#d4af37", textDecoration: "none",
          padding: "12px 30px", borderRadius: "30px", fontSize: "0.9rem", fontWeight: 600,
          letterSpacing: "1px", display: "flex", alignItems: "center", gap: "10px"
        }}>
          {t.offline.back_home}
        </Link>
      </div>
    </div>
  );
}
