"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/layout/AegisConfirm";
import "./baitul-maal.css";

interface Transaction {
  id: string;
  user_id?: string | null;
  amount: number | string;
  transaction_type: "IN" | "OUT";
  description: string;
  created_at: string;
  donor_name?: string;
}

interface CurrentUser {
  id: string;
  name: string;
  role: string;
}

export default function BaitulMaalClient({
  initialTransactions,
  isAdmin,
  currentUser,
}: {
  initialTransactions: Transaction[];
  isAdmin?: boolean;
  currentUser: CurrentUser;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  // CSS Scoping: body class untuk isolasi CSS halaman ini
  useEffect(() => {
    document.body.classList.add('page-baitul-maal');
    return () => { document.body.classList.remove('page-baitul-maal'); };
  }, []);
  
  // Modals & Panels
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isZakatOpen, setIsZakatOpen] = useState(false);
  const [isRecordPanelOpen, setIsRecordPanelOpen] = useState(false);
  
  // Ledger Filters
  const [filterType, setFilterType] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Donation Form States
  const [donateAmount, setDonateAmount] = useState("");
  const [donateProgram, setDonateProgram] = useState("Kas Rutin Angkatan");
  const [donateBank, setDonateBank] = useState("BSI");
  const [donatePrayer, setDonatePrayer] = useState("");
  const [donateAnonim, setDonateAnonim] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const donateInputRef = useRef<HTMLInputElement>(null);

  // Admin Record Form States
  const [adminAmount, setAdminAmount] = useState("");
  const [adminType, setAdminType] = useState<"IN" | "OUT">("IN");
  const [adminDesc, setAdminDesc] = useState("");
  const [adminAnonim, setAdminAnonim] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  // Zakat Calculator States
  const [zakatType, setZakatType] = useState<"profesi" | "maal">("profesi");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [otherIncome, setOtherIncome] = useState("");
  const [monthlyExpense, setMonthlyExpense] = useState("");
  const [goldPrice, setGoldPrice] = useState(1350000); // Rp 1.350.000 / gram emas

  const { showAlert } = useConfirm();

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num).replace(",00", "");
  };

  // Calculations
  const totalIn = useMemo(
    () => transactions.filter(t => t.transaction_type === "IN").reduce((acc, t) => acc + Number(t.amount || 0), 0),
    [transactions]
  );
  const totalOut = useMemo(
    () => transactions.filter(t => t.transaction_type === "OUT").reduce((acc, t) => acc + Number(t.amount || 0), 0),
    [transactions]
  );
  const balance = totalIn - totalOut;

  // Filtered Ledger
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchType = filterType === "ALL" || t.transaction_type === filterType;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !searchQuery ||
        t.description.toLowerCase().includes(q) ||
        (t.donor_name && t.donor_name.toLowerCase().includes(q));
      return matchType && matchQuery;
    });
  }, [transactions, filterType, searchQuery]);

  // Campaign Calculations (Derived from transactions)
  const kasRutinIn = useMemo(() => {
    return transactions
      .filter(t => t.transaction_type === "IN" && (t.description.toLowerCase().includes("kas rutin") || t.description.toLowerCase().includes("kas angkatan")))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const taawunIn = useMemo(() => {
    return transactions
      .filter(t => t.transaction_type === "IN" && (t.description.toLowerCase().includes("ta'awun") || t.description.toLowerCase().includes("taawun") || t.description.toLowerCase().includes("sosial") || t.description.toLowerCase().includes("duka")))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const safariIn = useMemo(() => {
    return transactions
      .filter(t => t.transaction_type === "IN" && (t.description.toLowerCase().includes("safari") || t.description.toLowerCase().includes("dakwah") || t.description.toLowerCase().includes("reuni")))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  // Copy Bank Account
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      await showAlert("Tersalin!", `${label} (${text}) telah disalin ke clipboard.`);
    } catch {
      await showAlert("Info", `Nomor rekening: ${text}`);
    }
  };

  // Submit Member Infaq Confirmation
  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(donateAmount);
    if (!val || val <= 0) {
      await showAlert("Peringatan", "Nominal infaq harus lebih dari Rp 0.");
      return;
    }

    setIsDonating(true);
    try {
      const res = await fetch("/api/baitul-maal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "donate",
          amount: val,
          program: donateProgram,
          bank_target: donateBank,
          prayer_note: donatePrayer,
          anonim: donateAnonim,
        }),
      });

      const json = await res.json();
      if (json.status === "success") {
        await showAlert("Alhamdulillah", "Jazakumullah Khairan! Konfirmasi infaq Anda berhasil dicatat ke Buku Besar.");
        setTransactions(prev => [json.data, ...prev]);
        setIsDonateOpen(false);
        setDonateAmount("");
        setDonatePrayer("");
      } else {
        await showAlert("Gagal", json.message || "Gagal mengirim donasi.");
      }
    } catch (err: any) {
      await showAlert("Error", "Terjadi kesalahan: " + err.message);
    } finally {
      setIsDonating(false);
    }
  };

  // Submit Admin/Bendahara Record Entry
  const handleAdminRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(adminAmount);
    if (!val || val <= 0 || !adminDesc.trim()) {
      await showAlert("Peringatan", "Harap isi nominal dan keterangan transaksi.");
      return;
    }

    setIsAdminSubmitting(true);
    try {
      const res = await fetch("/api/baitul-maal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_entry",
          amount: val,
          type: adminType,
          description: adminDesc.trim(),
          anonim: adminAnonim,
        }),
      });

      const json = await res.json();
      if (json.status === "success") {
        await showAlert("Berhasil", "Entri transaksi kas berhasil disimpan.");
        setTransactions(prev => [json.data, ...prev]);
        setIsRecordPanelOpen(false);
        setAdminAmount("");
        setAdminDesc("");
      } else {
        await showAlert("Gagal", json.message || "Gagal mencatat transaksi.");
      }
    } catch (err: any) {
      await showAlert("Error", "Terjadi kesalahan: " + err.message);
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showAlert("Info", "Belum ada data transaksi untuk diekspor.");
      return;
    }

    const headers = ["ID", "Tanggal", "Tipe", "Nominal (Rp)", "Keterangan", "Penyalur/Donatur"];
    const rows = transactions.map(t => [
      t.id,
      new Date(t.created_at).toLocaleString("id-ID"),
      t.transaction_type === "IN" ? "Pemasukan" : "Pengeluaran",
      t.amount,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      `"${(t.donor_name || "Hamba Allah").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Baitul_Maal_Expedient_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export & Print Official Receipt (Task 11)
  const handlePrintReceipt = (tx: Transaction) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showAlert("Peringatan", "Harap izinkan popup browser untuk mencetak bukti tanda terima donasi.");
      return;
    }
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tanda Terima Infaq — Baitul Maal Expedient 42</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; max-width: 620px; margin: 0 auto; line-height: 1.6; border: 2px solid #b8860b; }
          .header { text-align: center; border-bottom: 2px solid #b8860b; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #b8860b; margin: 0; }
          .subtitle { font-size: 13px; color: #555; margin: 5px 0 0 0; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; border-bottom: 1px dotted #ccc; padding-bottom: 5px; }
          .label { font-weight: bold; font-size: 14px; color: #333; }
          .value { font-size: 14px; color: #111; }
          .amount-box { text-align: center; background: #fdfaf0; border: 1px dashed #b8860b; padding: 15px; margin: 25px 0; font-size: 24px; font-weight: bold; color: #b8860b; }
          .stamp { border: 2px solid #2e7d32; color: #2e7d32; display: inline-block; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 12px; letter-spacing: 1px; transform: rotate(-3deg); margin-top: 15px; text-transform: uppercase; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Baitul Maal Expedient Generation</h1>
          <p class="subtitle">Pondok Modern Arrisalah — Angkatan 42</p>
          <p class="subtitle" style="font-size: 11px; margin-top: 2px;">No. Registrasi: EXP42-BM-${tx.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div class="row"><span class="label">Nama Donatur / Penyalur:</span><span class="value">${tx.donor_name || "Hamba Allah"}</span></div>
        <div class="row"><span class="label">Tanggal Diterima:</span><span class="value">${new Date(tx.created_at).toLocaleString("id-ID")}</span></div>
        <div class="row"><span class="label">Alokasi Program:</span><span class="value">${tx.description || "Infaq & Ta'awun Kas Angkatan"}</span></div>
        <div class="amount-box">${formatRupiah(Number(tx.amount))}</div>
        <div style="text-align: center;">
          <div class="stamp">✓ TERVERIFIKASI BENDAHARA RESMI</div>
        </div>
        <div class="footer">
          <p>Jazakumullah khairan katsiran atas kontribusi infaq dan ta'awun Anda demi kemaslahatan ukhuwah alumni angkatan 42.</p>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 24px; background: #b8860b; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Cetak / Simpan PDF</button>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  // Zakat Calculator Logic
  const nisabTahunan = 85 * goldPrice; // Nisab 85g emas
  const nisabBulanan = nisabTahunan / 12;

  const totalPenghasilanBulanan = (Number(monthlyIncome) || 0) + (Number(otherIncome) || 0) - (Number(monthlyExpense) || 0);
  const isWajibZakat = totalPenghasilanBulanan >= nisabBulanan;
  const nilaiZakatBulanan = isWajibZakat ? Math.round(totalPenghasilanBulanan * 0.025) : 0;

  const handleUseZakatForDonation = () => {
    if (nilaiZakatBulanan > 0) {
      setDonateAmount(nilaiZakatBulanan.toString());
      setDonateProgram("Zakat Maal & Penghasilan");
      setIsZakatOpen(false);
      setIsDonateOpen(true);
    }
  };

  return (
    <div className="maal-page-wrapper">
      <div className="maal-wrapper">
        {/* HEADER */}
        <header className="maal-header">
          <Link href="/fitur" className="btn-back">
            <i className="fa-solid fa-arrow-left-long"></i> Kembali ke Vault
          </Link>
          <div style={{ textAlign: "right" }}>
            <h1 className="page-title">Baitul Maal</h1>
            <p className="page-subtitle">Constellation of Giving & Financial Transparency</p>
          </div>
        </header>

        {/* 3-PILLAR FINANCIAL DASHBOARD */}
        <div className="dashboard-grid" id="financeDashboard">
          <div className="stat-card primary">
            <i className="fa-solid fa-scale-balanced stat-icon"></i>
            <div className="stat-label">Total Saldo Kas Terkini</div>
            <h2 className="stat-value">{formatRupiah(balance)}</h2>
            <div className="stat-footnote">
              <i className="fa-solid fa-shield-halved"></i> Dana umat terkelola secara amanah & transparan
            </div>
          </div>

          <div className="stat-card">
            <i className="fa-solid fa-arrow-turn-down stat-icon" style={{ color: "#00ff88" }}></i>
            <div className="stat-label">Total Pemasukan</div>
            <h2 className="stat-value text-in">{formatRupiah(totalIn)}</h2>
            <div className="stat-sub">
              {transactions.filter(t => t.transaction_type === "IN").length} Transaksi Masuk
            </div>
          </div>

          <div className="stat-card">
            <i className="fa-solid fa-arrow-turn-up stat-icon" style={{ color: "#ff5555" }}></i>
            <div className="stat-label">Total Pengeluaran</div>
            <h2 className="stat-value text-out">{formatRupiah(totalOut)}</h2>
            <div className="stat-sub">
              {transactions.filter(t => t.transaction_type === "OUT").length} Penyaluran Operasional
            </div>
          </div>
        </div>

        {/* QUICK ACTION DOCK */}
        <div className="action-dock-container">
          <button
            type="button"
            className="btn-action-hero btn-donate-pulse"
            onClick={() => setIsDonateOpen(true)}
          >
            <i className="fa-solid fa-hand-holding-heart"></i> Salurkan Infaq / Donasi
          </button>
          <button
            type="button"
            className="btn-action-secondary"
            onClick={() => setIsZakatOpen(true)}
          >
            <i className="fa-solid fa-calculator"></i> Kalkulator Zakat
          </button>
          <button
            type="button"
            className="btn-action-secondary"
            onClick={handleExportCSV}
          >
            <i className="fa-solid fa-file-csv"></i> Unduh Laporan (CSV)
          </button>
          {isAdmin && (
            <button
              type="button"
              className="btn-action-admin"
              onClick={() => setIsRecordPanelOpen(true)}
            >
              <i className="fa-solid fa-file-signature"></i> Catat Entri Kas
            </button>
          )}
        </div>

        {/* CAMPAIGN & TA'AWUN GOALS */}
        <div className="campaign-section">
          <div className="section-heading">
            <h2 className="section-title">
              <i className="fa-solid fa-bullseye-arrow"></i> Program & Alokasi Ta'awun
            </h2>
            <span className="section-desc">Penyaluran terarah untuk kemaslahatan bersama</span>
          </div>

          <div className="campaign-grid">
            {/* Program 1 */}
            <div className="campaign-card">
              <div className="campaign-header">
                <div className="campaign-icon icon-gold">
                  <i className="fa-solid fa-coins"></i>
                </div>
                <div>
                  <h3 className="campaign-name">Kas Rutin & Operasional</h3>
                  <p className="campaign-target">Target: Rp 10.000.000</p>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-gold"
                  style={{ width: `${Math.min(100, Math.round((kasRutinIn / 10000000) * 100))}%` }}
                ></div>
              </div>
              <div className="campaign-meta">
                <span>Terkumpul: <strong>{formatRupiah(kasRutinIn)}</strong></span>
                <span>{Math.min(100, Math.round((kasRutinIn / 10000000) * 100))}%</span>
              </div>
            </div>

            {/* Program 2 */}
            <div className="campaign-card">
              <div className="campaign-header">
                <div className="campaign-icon icon-green">
                  <i className="fa-solid fa-hand-holding-medical"></i>
                </div>
                <div>
                  <h3 className="campaign-name">Dana Ta'awun & Santunan</h3>
                  <p className="campaign-target">Target: Rp 15.000.000</p>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-green"
                  style={{ width: `${Math.min(100, Math.round((taawunIn / 15000000) * 100))}%` }}
                ></div>
              </div>
              <div className="campaign-meta">
                <span>Terkumpul: <strong>{formatRupiah(taawunIn)}</strong></span>
                <span>{Math.min(100, Math.round((taawunIn / 15000000) * 100))}%</span>
              </div>
            </div>

            {/* Program 3 */}
            <div className="campaign-card">
              <div className="campaign-header">
                <div className="campaign-icon icon-blue">
                  <i className="fa-solid fa-mosque"></i>
                </div>
                <div>
                  <h3 className="campaign-name">Safari Dakwah & Reuni</h3>
                  <p className="campaign-target">Target: Rp 20.000.000</p>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-blue"
                  style={{ width: `${Math.min(100, Math.round((safariIn / 20000000) * 100))}%` }}
                ></div>
              </div>
              <div className="campaign-meta">
                <span>Terkumpul: <strong>{formatRupiah(safariIn)}</strong></span>
                <span>{Math.min(100, Math.round((safariIn / 20000000) * 100))}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* THE OPEN LEDGER (Public Transparency) */}
        <div className="ledger-section" id="openLedger">
          <div className="ledger-header">
            <div>
              <h2 className="ledger-title">Buku Besar Kas</h2>
              <div className="ledger-subtitle">Laporan Transparansi Arus Keuangan Terbuka</div>
            </div>
            <div>
              <i className="fa-solid fa-book-open" style={{ color: "var(--gold-main, #d4af37)", fontSize: "2rem", opacity: 0.5 }}></i>
            </div>
          </div>

          {/* FILTER & SEARCH TOOLBAR */}
          <div className="ledger-toolbar">
            <div className="filter-tabs">
              <button
                type="button"
                className={`filter-tab ${filterType === "ALL" ? "active" : ""}`}
                onClick={() => setFilterType("ALL")}
              >
                Semua ({transactions.length})
              </button>
              <button
                type="button"
                className={`filter-tab ${filterType === "IN" ? "active" : ""}`}
                onClick={() => setFilterType("IN")}
              >
                <i className="fa-solid fa-arrow-down" style={{ color: "#00ff88" }}></i> Pemasukan
              </button>
              <button
                type="button"
                className={`filter-tab ${filterType === "OUT" ? "active" : ""}`}
                onClick={() => setFilterType("OUT")}
              >
                <i className="fa-solid fa-arrow-up" style={{ color: "#ff5555" }}></i> Pengeluaran
              </button>
            </div>

            <div className="ledger-search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Cari transaksi atau donatur..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="btn-clear-search" onClick={() => setSearchQuery("")}>
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* TRANSACTION LIST */}
          <div className="ledger-list">
            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-secondary, #8b9ba8)" }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: "3rem", marginBottom: "15px", opacity: 0.3 }}></i>
                <br />
                {searchQuery ? "Tidak ada transaksi yang cocok dengan pencarian." : "Belum ada catatan transaksi di dalam buku besar ini."}
              </div>
            ) : (
              filteredTransactions.map(tx => (
                <div className="tx-item" key={tx.id}>
                  <div className="tx-left">
                    <div className={`tx-type-icon ${tx.transaction_type === "IN" ? "tx-in-bg" : "tx-out-bg"}`}>
                      <i className={`fa-solid ${tx.transaction_type === "IN" ? "fa-arrow-down" : "fa-arrow-up"}`}></i>
                    </div>
                    <div className="tx-details">
                      <div className="tx-title">{tx.description}</div>
                      <div className="tx-meta">
                        <div>
                          <i className="fa-regular fa-user"></i>{" "}
                          <span className="donor-name">{tx.donor_name || "Hamba Allah"}</span>
                        </div>
                        <div>
                          <i className="fa-regular fa-calendar"></i>{" "}
                          {new Date(tx.created_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className={`tx-amount ${tx.transaction_type === "IN" ? "in" : "out"}`}>
                      {tx.transaction_type === "IN" ? "+" : "-"} {formatRupiah(Number(tx.amount))}
                    </div>
                    {tx.transaction_type === "IN" && (
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(tx)}
                        style={{
                          background: "rgba(212, 175, 55, 0.1)",
                          border: "1px solid rgba(212, 175, 55, 0.35)",
                          color: "var(--gold-main, #d4af37)",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                        title="Cetak Bukti Tanda Terima Donasi Resmi"
                      >
                        <i className="fa-solid fa-receipt"></i> Bukti
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SALURKAN INFAQ & INFO REKENING RESMI (FOR ALL USERS) */}
      {/* ========================================================================= */}
      {isDonateOpen && (
        <div className="maal-modal-backdrop" onClick={() => setIsDonateOpen(false)}>
          <div className="maal-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Salurkan Infaq & Ta'awun</h2>
                <p className="modal-subtitle">Pintu amal jariyah & kontribusi kemaslahatan angkatan</p>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setIsDonateOpen(false)}>
                &times;
              </button>
            </div>

            {/* REKENING RESMI CARDS */}
            <div className="bank-accounts-section">
              <div className="bank-card">
                <div className="bank-info">
                  <span className="bank-badge bsi">BSI (Bank Syariah Indonesia)</span>
                  <div className="bank-number">7234 8901 2345</div>
                  <div className="bank-holder">a.n. Baitul Maal Expedient</div>
                </div>
                <button
                  type="button"
                  className="btn-copy-acc"
                  onClick={() => handleCopy("723489012345", "Rekening BSI")}
                >
                  <i className="fa-regular fa-copy"></i> Salin
                </button>
              </div>

              <div className="bank-card">
                <div className="bank-info">
                  <span className="bank-badge bca">BCA</span>
                  <div className="bank-number">8091 2345 67</div>
                  <div className="bank-holder">a.n. Bendahara Kas Angkatan</div>
                </div>
                <button
                  type="button"
                  className="btn-copy-acc"
                  onClick={() => handleCopy("8091234567", "Rekening BCA")}
                >
                  <i className="fa-regular fa-copy"></i> Salin
                </button>
              </div>

              <div className="bank-card">
                <div className="bank-info">
                  <span className="bank-badge mandiri">Mandiri</span>
                  <div className="bank-number">137-00-1234567-8</div>
                  <div className="bank-holder">a.n. Kas Expedient Generation</div>
                </div>
                <button
                  type="button"
                  className="btn-copy-acc"
                  onClick={() => handleCopy("1370012345678", "Rekening Mandiri")}
                >
                  <i className="fa-regular fa-copy"></i> Salin
                </button>
              </div>
            </div>

            {/* FORM KONFIRMASI INFAQ */}
            <form onSubmit={handleDonateSubmit} className="maal-modal-form">
              <h3 className="form-section-title">Konfirmasi Pengiriman Infaq</h3>

              <div className="form-group">
                <label>PILIHAN PROGRAM</label>
                <select
                  value={donateProgram}
                  onChange={e => setDonateProgram(e.target.value)}
                  required
                >
                  <option value="Kas Rutin Angkatan">Kas Rutin Angkatan</option>
                  <option value="Dana Ta'awun Sahabat">Dana Ta'awun & Santunan Sahabat</option>
                  <option value="Infaq & Sedekah Bebas">Infaq & Sedekah Bebas</option>
                  <option value="Zakat Maal & Penghasilan">Zakat Maal / Penghasilan</option>
                  <option value="Safari Dakwah & Reuni">Safari Dakwah & Reuni</option>
                </select>
              </div>

              <div className="form-group">
                <label>BANK TUJUAN PENYALURAN</label>
                <select
                  value={donateBank}
                  onChange={e => setDonateBank(e.target.value)}
                  required
                >
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="QRIS">QRIS / E-Wallet</option>
                </select>
              </div>

              <div className="form-group">
                <label>NOMINAL INFAQ (RUPIAH)</label>
                <div className="preset-amounts">
                  {[25000, 50000, 100000, 250000, 500000, 1000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className={`btn-preset ${Number(donateAmount) === amt ? "active" : ""}`}
                      onClick={() => setDonateAmount(amt.toString())}
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`btn-preset ${donateAmount && ![25000, 50000, 100000, 250000, 500000, 1000000].includes(Number(donateAmount)) ? "active" : ""}`}
                    onClick={() => {
                      donateInputRef.current?.focus();
                      donateInputRef.current?.select();
                    }}
                  >
                    Nominal Lain...
                  </button>
                </div>
                <input
                  ref={donateInputRef}
                  type="number"
                  placeholder="Contoh: 150000"
                  value={donateAmount}
                  onChange={e => setDonateAmount(e.target.value)}
                  required
                  min="1000"
                />
              </div>

              <div className="form-group">
                <label>DOA / PESAN KEBERKAHAN (OPSIONAL)</label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan doa atau harapan untuk angkatan kita..."
                  value={donatePrayer}
                  onChange={e => setDonatePrayer(e.target.value)}
                ></textarea>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={donateAnonim}
                  onChange={e => setDonateAnonim(e.target.checked)}
                />
                <span>Salurkan Sebagai <strong>Hamba Allah (Anonim)</strong></span>
              </label>

              <button
                type="submit"
                className="btn-submit-donate"
                disabled={isDonating}
              >
                <i className="fa-solid fa-heart"></i>{" "}
                {isDonating ? "Memproses..." : "Konfirmasi Penyaluran Infaq (+25 Prestise)"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KALKULATOR ZAKAT INTERAKTIF */}
      {/* ========================================================================= */}
      {isZakatOpen && (
        <div className="maal-modal-backdrop" onClick={() => setIsZakatOpen(false)}>
          <div className="maal-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Kalkulator Zakat & Nisab</h2>
                <p className="modal-subtitle">Hitung kewajiban zakat maal dan profesi sesuai kaidah syariah</p>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setIsZakatOpen(false)}>
                &times;
              </button>
            </div>

            <div className="zakat-tabs">
              <button
                type="button"
                className={`zakat-tab ${zakatType === "profesi" ? "active" : ""}`}
                onClick={() => setZakatType("profesi")}
              >
                Zakat Penghasilan (Profesi)
              </button>
              <button
                type="button"
                className={`zakat-tab ${zakatType === "maal" ? "active" : ""}`}
                onClick={() => setZakatType("maal")}
              >
                Zakat Maal (Tabungan/Emas)
              </button>
            </div>

            <div className="zakat-form">
              <div className="form-group">
                <label>
                  {zakatType === "profesi" ? "PENGHASILAN UTAMA PER BULAN (RP)" : "TOTAL TABUNGAN / DEPOSITO / EMAS (RP)"}
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 10000000"
                  value={monthlyIncome}
                  onChange={e => setMonthlyIncome(e.target.value)}
                />
              </div>

              {zakatType === "profesi" && (
                <>
                  <div className="form-group">
                    <label>PENGHASILAN TAMBAHAN LAINNYA (RP)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 2000000"
                      value={otherIncome}
                      onChange={e => setOtherIncome(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>PENGELUARAN POKOK / HUTANG JATUH TEMPO (RP)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 3000000"
                      value={monthlyExpense}
                      onChange={e => setMonthlyExpense(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="nisab-info-box">
                <div className="nisab-row">
                  <span>Standar Nisab (85g Emas):</span>
                  <strong>{formatRupiah(nisabBulanan)} / bulan ({formatRupiah(nisabTahunan)} / tahun)</strong>
                </div>
                <div className="nisab-row">
                  <span>Total Bersih Dihitung:</span>
                  <strong>{formatRupiah(Math.max(0, totalPenghasilanBulanan))}</strong>
                </div>
              </div>

              <div className={`zakat-result-card ${isWajibZakat ? "wajib" : "belum"}`}>
                <div className="result-header">
                  <span className="result-badge">
                    {isWajibZakat ? "WAJIB ZAKAT (2.5%)" : "BELUM MENCAPAI NISAB"}
                  </span>
                  <div className="result-value">
                    {isWajibZakat ? formatRupiah(nilaiZakatBulanan) : "Rp 0"}
                  </div>
                </div>
                <p className="result-explanation">
                  {isWajibZakat
                    ? "Alhamdulillah, total harta/penghasilan Anda telah memenuhi syarat nisab. Zakat 2.5% dapat disalurkan melalui Baitul Maal."
                    : "Penghasilan belum melampaui batas nisab 85g emas. Namun, Anda tetap dianjurkan menyalurkan infaq & sedekah sukarela."}
                </p>
              </div>

              {isWajibZakat && (
                <button
                  type="button"
                  className="btn-submit-donate"
                  onClick={handleUseZakatForDonation}
                >
                  <i className="fa-solid fa-paper-plane"></i> Salurkan Zakat Ini ({formatRupiah(nilaiZakatBulanan)})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE PANEL: PENCATATAN TRANSAKSI OLEH ADMIN / BENDAHARA */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className={`transactions-panel ${isRecordPanelOpen ? "open" : ""}`}>
          <button
            type="button"
            className="btn-close-panel"
            onClick={() => setIsRecordPanelOpen(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <div className="panel-title">Otorisasi Entri Kas</div>

          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary, #8b9ba8)", marginBottom: "20px", lineHeight: 1.5 }}>
            Anda login sebagai <strong>{currentUser.role.toUpperCase()}</strong>. Pastikan data mutasi kas dimasukkan dengan teliti untuk menjaga integritas Buku Besar.
          </div>

          <form onSubmit={handleAdminRecordSubmit} className="maal-form">
            <label>JENIS TRANSAKSI</label>
            <select
              value={adminType}
              onChange={e => setAdminType(e.target.value as "IN" | "OUT")}
              required
            >
              <option value="IN">Pemasukan (Khidmah / Infaq / Hibah)</option>
              <option value="OUT">Pengeluaran (Operasional / Santunan / Konsumsi)</option>
            </select>

            <label>NOMINAL (RUPIAH)</label>
            <input
              type="number"
              placeholder="Contoh: 500000"
              value={adminAmount}
              onChange={e => setAdminAmount(e.target.value)}
              required
              min="1"
            />

            <label>KETERANGAN / TUJUAN</label>
            <textarea
              rows={3}
              placeholder="Deskripsi detail transaksi kas..."
              value={adminDesc}
              onChange={e => setAdminDesc(e.target.value)}
              required
            ></textarea>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", flexDirection: "row", cursor: "pointer", marginBottom: "25px" }}>
              <input
                type="checkbox"
                checked={adminAnonim}
                onChange={e => setAdminAnonim(e.target.checked)}
                style={{ width: "auto", margin: 0 }}
              />
              <span style={{ color: "var(--text-primary, #fff)", fontSize: "0.9rem" }}>Catat Sebagai Hamba Allah (Anonim)</span>
            </label>

            <button
              type="submit"
              className="btn-submit-maal"
              disabled={isAdminSubmitting}
            >
              <i className="fa-solid fa-file-signature"></i>{" "}
              {isAdminSubmitting ? "Menyimpan Entri..." : "Otorisasi Entri Buku Besar"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

