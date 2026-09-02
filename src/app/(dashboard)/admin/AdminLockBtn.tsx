"use client";

import { useRouter } from "next/navigation";
import { useCms } from "@/components/layout/CmsProvider";

export default function AdminLockBtn() {
  const router = useRouter();
  const { t } = useCms();

  const handleLock = async () => {
    try {
      const res = await fetch("/api/admin/lock", { method: "POST" });
      if (res.ok) {
        window.location.href = "/admin/unlock";
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button onClick={handleLock} className="hover-trigger" style={{ 
        display: "inline-flex", alignItems: "center", gap: "8px", 
        background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", 
        color: "#ff3366", padding: "10px 20px", borderRadius: "30px", 
        textTransform: "uppercase", letterSpacing: "1.5px", fontSize: "0.75rem", 
        fontWeight: 800, cursor: "pointer", transition: "all 0.3s",
        boxShadow: "0 4px 15px rgba(255,51,102,0.2)",
        whiteSpace: "nowrap", flexShrink: 0
    }}>
      <i className="fa-solid fa-lock" style={{ fontSize: "0.9rem" }}></i> {t('admin_btn_lock', 'Kunci Panel')}
    </button>
  );
}
