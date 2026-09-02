"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { useCms } from "@/components/layout/CmsProvider";
import "../admin.css";
import AdminLockBtn from "../../AdminLockBtn";

export default function ExportClient() {
  useEffect(() => {
    document.body.classList.add("page-admin");
    return () => {
      document.body.classList.remove("page-admin");
    };
  }, []);

  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState("profiles");
  const supabase = createClient();
  const { showAlert } = useConfirm();
  const { t } = useCms();

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    try {
      let dataToExport = [];
      
      if (exportType === "profiles") {
          const { data, error } = await supabase.from("profiles").select("*");
          if (error) throw error;
          dataToExport = data || [];
      } else if (exportType === "transactions") {
          const { data, error } = await supabase.from("baitul_maal_transactions").select("*");
          if (error) throw error;
          dataToExport = data || [];
      } else if (exportType === "events") {
          const { data, error } = await supabase.from("event_tickets").select("*, events(title), profiles(nama_panggilan, nama_lengkap)");
          if (error) throw error;
          dataToExport = data || [];
      }

      if (dataToExport.length === 0) {
          await showAlert("Info", "Data kosong atau belum tersedia untuk diekspor.");
          setIsExporting(false);
          return;
      }

      // Format Nested Objects (e.g. events, profiles) into flat columns for CSV
      const formattedData = dataToExport.map((obj: any) => {
          const flatObj: any = {};
          for (const key in obj) {
              if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                  // Flatten one level deep
                  for (const subKey in obj[key]) {
                      flatObj[`${key}_${subKey}`] = obj[key][subKey];
                  }
              } else {
                  flatObj[key] = obj[key];
              }
          }
          return flatObj;
      });

      // Convert JSON to CSV
      const headers = Object.keys(formattedData[0]).join(",");
      const rows = formattedData.map((obj: any) => 
          Object.values(obj).map(val => {
              if (val === null || val === undefined) return '""';
              if (typeof val === 'object') return '"' + JSON.stringify(val).replace(/"/g, '""').replace(/\r?\n/g, " ") + '"';
              return '"' + String(val).replace(/"/g, '""').replace(/\r?\n/g, " ") + '"';
          }).join(",")
      );
      
      const csvContent = headers + "\n" + rows.join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `export_${exportType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      await showAlert("Berhasil", `Data ${exportType} berhasil diekspor ke format CSV!`);

    } catch (err: any) {
        await showAlert("Gagal", "Gagal melakukan export: " + err.message);
    }
    setIsExporting(false);
  };

  return (
    <div className="admin-wrapper" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      
      <div className="admin-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 300px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(0,255,136,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", color: "#00ff88", flexShrink: 0 }}>
                <i className="fa-solid fa-file-csv"></i>
            </div>
            <div>
                <h1 className="admin-title" style={{ marginBottom: "0", fontSize: "1.5rem" }}>{t('export_title', 'Data Exporter')}</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "4px 0 0 0", letterSpacing: "1px", textTransform: "uppercase" }}>{t('export_subtitle', 'Tarik raw data ke CSV')}</p>
            </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <AdminLockBtn />
        </div>
        
        <nav className="admin-nav" style={{ width: "100%", marginTop: "5px" }}>
          <Link href="/admin">{t('nav_dashboard', 'Dashboard')}</Link>
          <Link href="/admin/users">{t('nav_users', 'Users')}</Link>
          <Link href="/admin/export" className="active">{t('nav_export', 'Export Data')}</Link>
        </nav>
      </div>

      <div className="form-panel" style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 32px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px 0", textAlign: "center" }}>
          {t('export_form_title', 'Pilih Sumber Data')}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center", margin: "0 0 30px 0" }}>
          {t('export_form_desc', 'Pilih tabel dari database Supabase yang ingin Anda unduh untuk keperluan analisis eksternal atau pelaporan.')}
        </p>
        
        <form onSubmit={handleExport}>
            <div style={{ marginBottom: "30px" }}>
                <select 
                    value={exportType} 
                    onChange={e => setExportType(e.target.value)}
                    style={{ 
                        width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,255,136,0.3)", color: "var(--text-primary)", 
                        padding: "16px", borderRadius: "12px", fontSize: "1rem", outline: "none", cursor: "pointer", transition: "all 0.3s",
                        boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)"
                    }}
                >
                    <option value="profiles">{t('export_opt_profiles', 'Tabel: Anggota & Profil Lengkap')}</option>
                    <option value="transactions">{t('export_opt_transactions', 'Tabel: Riwayat Baitul Maal')}</option>
                    <option value="events">{t('export_opt_events', 'Tabel: Daftar Tiket / Kehadiran Acara')}</option>
                </select>
            </div>

            <button type="submit" disabled={isExporting} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #00ff88, #00b35f)", border: "none", color: "#000", borderRadius: "12px", fontSize: "1rem", fontWeight: 800, cursor: isExporting ? "not-allowed" : "pointer", letterSpacing: "1px", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", opacity: isExporting ? 0.7 : 1, boxShadow: "0 10px 25px rgba(0,255,136,0.3)" }} className="hover-trigger">
                {isExporting ? <><i className="fa-solid fa-spinner fa-spin"></i> {t('export_btn_processing', 'MEMPROSES DATA...')}</> : <><i className="fa-solid fa-download"></i> {t('export_btn_submit', 'EXPORT KE CSV')}</>}
            </button>
        </form>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px", marginTop: "30px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
               <i className="fa-solid fa-circle-info" style={{ color: "#00ff88" }}></i> {t('export_info_title', 'Format Ekspor')}
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }} dangerouslySetInnerHTML={{__html: t('export_info_desc', 'Sistem akan memformat seluruh <em>nested JSON objects</em> (seperti detail profil di dalam tabel kehadiran) menjadi kolom tunggal agar mudah dibaca di Microsoft Excel atau Google Sheets. Kolom yang berelasi otomatis akan digabungkan.')}}>
            </p>
        </div>
      </div>

    </div>
  );
}
