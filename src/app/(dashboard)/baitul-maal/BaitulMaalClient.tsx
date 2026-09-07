"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/layout/AegisConfirm";
import "./baitul-maal.css";

export interface BankAccount {
  bank: string;
  account_number: string;
  account_name: string;
}

export interface BendaharaContact {
  name: string;
  phone: string;
  note?: string;
}

export interface Transaction {
  id: string;
  user_id?: string | null;
  amount: number | string;
  transaction_type: "IN" | "OUT";
  description: string;
  created_at: string;
  donor_name?: string;
  status?: "pending" | "completed" | "rejected";
  proof_url?: string | null;
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
  initialBankAccounts = [],
  bendaharaContact = null,
}: {
  initialTransactions: Transaction[];
  isAdmin?: boolean;
  currentUser: CurrentUser;
  initialBankAccounts?: BankAccount[];
  bendaharaContact?: BendaharaContact | null;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [contactInfo, setContactInfo] = useState<BendaharaContact | null>(bendaharaContact);

  // CSS Scoping: body class untuk isolasi CSS halaman ini
  useEffect(() => {
    document.body.classList.add("page-baitul-maal");
    return () => {
      document.body.classList.remove("page-baitul-maal");
    };
  }, []);

  // Modals & Panels
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isZakatOpen, setIsZakatOpen] = useState(false);
  const [isRecordPanelOpen, setIsRecordPanelOpen] = useState(false);
  const [isManageBankOpen, setIsManageBankOpen] = useState(false);

  // Bank Management Form States (Bendahara/Admin)
  const [editAccounts, setEditAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [newBank, setNewBank] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [contactName, setContactName] = useState(bendaharaContact?.name || "");
  const [contactPhone, setContactPhone] = useState(bendaharaContact?.phone || "");
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Ledger Filters
  const [filterType, setFilterType] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterChange = (type: "ALL" | "IN" | "OUT") => {
    if (type === filterType) return;
    setIsFilterLoading(true);
    setFilterType(type);
    setTimeout(() => setIsFilterLoading(false), 220);
  };

  // Donation Form States
  const [donateAmount, setDonateAmount] = useState("");
  const [donateProgram, setDonateProgram] = useState("Kas Rutin Angkatan");
  const [donateBank, setDonateBank] = useState(
    initialBankAccounts.length > 0 ? initialBankAccounts[0].bank : "BSI"
  );
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

  const { showAlert, showConfirm } = useConfirm();
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num).replace(",00", "");
  };

  // Completed Transactions (for verified financial calculation)
  const completedTransactions = useMemo(
    () => transactions.filter((t) => t.status === "completed" || !t.status),
    [transactions]
  );

  // Verified Financial Balance Calculations
  const totalIn = useMemo(
    () =>
      completedTransactions
        .filter((t) => t.transaction_type === "IN")
        .reduce((acc, t) => acc + Number(t.amount || 0), 0),
    [completedTransactions]
  );

  const totalOut = useMemo(
    () =>
      completedTransactions
        .filter((t) => t.transaction_type === "OUT")
        .reduce((acc, t) => acc + Number(t.amount || 0), 0),
    [completedTransactions]
  );

  const balance = totalIn - totalOut;

  // Filtered Ledger (includes pending for current user / admin)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = filterType === "ALL" || t.transaction_type === filterType;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !searchQuery ||
        t.description.toLowerCase().includes(q) ||
        (t.donor_name && t.donor_name.toLowerCase().includes(q));
      return matchType && matchQuery;
    });
  }, [transactions, filterType, searchQuery]);

  // Campaign Allocations (Derived from genuine completed transactions)
  const kasRutinIn = useMemo(() => {
    return completedTransactions
      .filter(
        (t) =>
          t.transaction_type === "IN" &&
          (t.description.toLowerCase().includes("kas rutin") ||
            t.description.toLowerCase().includes("kas angkatan") ||
            (!t.description.toLowerCase().includes("ta'awun") &&
              !t.description.toLowerCase().includes("santunan") &&
              !t.description.toLowerCase().includes("safari") &&
              !t.description.toLowerCase().includes("dakwah")))
      )
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [completedTransactions]);

  const taawunIn = useMemo(() => {
    return completedTransactions
      .filter(
        (t) =>
          t.transaction_type === "IN" &&
          (t.description.toLowerCase().includes("ta'awun") ||
            t.description.toLowerCase().includes("taawun") ||
            t.description.toLowerCase().includes("santunan") ||
            t.description.toLowerCase().includes("sosial") ||
            t.description.toLowerCase().includes("duka"))
      )
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [completedTransactions]);

  const safariIn = useMemo(() => {
    return completedTransactions
      .filter(
        (t) =>
          t.transaction_type === "IN" &&
          (t.description.toLowerCase().includes("safari") ||
            t.description.toLowerCase().includes("dakwah") ||
            t.description.toLowerCase().includes("reuni") ||
            t.description.toLowerCase().includes("khusus"))
      )
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [completedTransactions]);

  // Copy Bank Account Number
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      await showAlert("Tersalin!", `${label} (${text}) telah disalin ke clipboard.`);
    } catch {
      await showAlert("Nomor Rekening", text);
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
        setTransactions((prev) => [json.data, ...prev]);
        setIsDonateOpen(false);
        setDonateAmount("");
        setDonatePrayer("");

        // Offer WhatsApp Confirmation to Bendahara
        const waNumber = contactInfo?.phone
          ? contactInfo.phone.replace(/^0/, "62").replace(/[^0-9]/g, "")
          : null;

        if (waNumber) {
          const waText = encodeURIComponent(
            `Assalamu'alaikum ${contactInfo?.name || "Bendahara Kas Baitul Maal"},\n\nSaya telah menyalurkan konfirmasi infaq melalui portal website:\n- Program: ${donateProgram}\n- Nominal: ${formatRupiah(val)}\n- Bank: ${donateBank}\n${donateAnonim ? "- Donatur: Hamba Allah (Anonim)" : `- Donatur: ${currentUser.name}`}\n\nMohon diverifikasi ke dalam Buku Besar Kas. Jazakallahu khairan.`
          );
          const confirmWA = await showConfirm(
            "Alhamdulillah, Infaq Tercatat!",
            "Konfirmasi infaq Anda berhasil disimpan (menunggu verifikasi Bendahara).\n\nApakah Anda ingin membuka WhatsApp untuk mengirim bukti transfer langsung ke Bendahara?"
          );
          if (confirmWA) {
            window.open(`https://wa.me/${waNumber}?text=${waText}`, "_blank");
          }
        } else {
          await showAlert(
            "Alhamdulillah",
            json.message ||
              "Jazakumullah Khairan! Konfirmasi infaq Anda telah tersimpan dan sedang diverifikasi oleh Bendahara."
          );
        }
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
        await showAlert("Berhasil", "Entri transaksi kas berhasil disimpan ke Buku Besar.");
        setTransactions((prev) => [json.data, ...prev]);
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

  // Verify Donation (Admin/Bendahara)
  const handleVerifyTx = async (id: string, approved: boolean) => {
    const actionText = approved ? "menyetujui & memvalidasi" : "menolak";
    const confirmed = await showConfirm(
      "Konfirmasi Verifikasi Donasi",
      `Apakah Anda yakin ingin ${actionText} transaksi infaq ini?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/baitul-maal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_donation",
          transaction_id: id,
          approved,
        }),
      });

      const json = await res.json();
      if (json.status === "success") {
        await showAlert("Berhasil", json.message);
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: approved ? "completed" : "rejected",
                  description: approved
                    ? t.description.replace(/^\[PENDING VERIFIKASI\]\s*/i, "")
                    : `[DITOLAK] ${t.description.replace(/^\[PENDING VERIFIKASI\]\s*/i, "")}`,
                }
              : t
          )
        );
      } else {
        await showAlert("Gagal", json.message || "Gagal memproses verifikasi.");
      }
    } catch (err: any) {
      await showAlert("Error", "Terjadi kesalahan: " + err.message);
    }
  };

  // Save Official Bank Accounts (Admin/Bendahara)
  const handleSaveBankConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);

    const contactPayload =
      contactPhone.trim() || contactName.trim()
        ? {
            name: contactName.trim() || "Bendahara",
            phone: contactPhone.trim(),
          }
        : null;

    try {
      const res = await fetch("/api/baitul-maal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_bank_accounts",
          accounts: editAccounts,
          contact: contactPayload,
        }),
      });

      const json = await res.json();
      if (json.status === "success") {
        await showAlert("Berhasil", "Pengaturan rekening resmi kas Baitul Maal berhasil disimpan!");
        setBankAccounts(editAccounts);
        if (contactPayload) setContactInfo(contactPayload);
        setIsManageBankOpen(false);
      } else {
        await showAlert("Gagal", json.message || "Gagal menyimpan rekening.");
      }
    } catch (err: any) {
      await showAlert("Error", "Terjadi kesalahan: " + err.message);
    } finally {
      setIsSavingBank(false);
    }
  };

  // Add Account to Edit List
  const handleAddAccountToEdit = () => {
    if (!newBank.trim() || !newNumber.trim() || !newName.trim()) {
      showAlert("Peringatan", "Harap lengkapi nama bank, nomor rekening, dan atas nama.");
      return;
    }
    setEditAccounts((prev) => [
      ...prev,
      {
        bank: newBank.trim().toUpperCase(),
        account_number: newNumber.trim(),
        account_name: newName.trim(),
      },
    ]);
    setNewBank("");
    setNewNumber("");
    setNewName("");
  };

  // Remove Account from Edit List
  const handleRemoveAccountFromEdit = (index: number) => {
    setEditAccounts((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Export CSV
  const handleExportCSV = () => {
    if (completedTransactions.length === 0) {
      showAlert("Info", "Belum ada data transaksi kas yang terverifikasi untuk diekspor.");
      return;
    }

    const headers = ["ID", "Tanggal", "Tipe", "Nominal (Rp)", "Keterangan", "Penyalur/Donatur", "Status"];
    const rows = completedTransactions.map((t) => [
      t.id,
      new Date(t.created_at).toLocaleString("id-ID"),
      t.transaction_type === "IN" ? "Pemasukan" : "Pengeluaran",
      t.amount,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      `"${(t.donor_name || "Hamba Allah").replace(/"/g, '""')}"`,
      t.status || "completed",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Baitul_Maal_Expedient_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export & Print Official Receipt
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
        <title>Tanda Terima Infaq — Baitul Maal Expedient 43</title>
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
          <p class="subtitle">Pondok Modern Arrisalah — Angkatan 43</p>
          <p class="subtitle" style="font-size: 11px; margin-top: 2px;">No. Registrasi: EXP43-BM-${tx.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div class="row"><span class="label">Nama Donatur / Penyalur:</span><span class="value">${tx.donor_name || "Hamba Allah"}</span></div>
        <div class="row"><span class="label">Tanggal Diterima:</span><span class="value">${new Date(tx.created_at).toLocaleString("id-ID")}</span></div>
        <div class="row"><span class="label">Alokasi Program:</span><span class="value">${tx.description || "Infaq & Ta'awun Kas Angkatan"}</span></div>
        <div class="amount-box">${formatRupiah(Number(tx.amount))}</div>
        <div style="text-align: center;">
          <div class="stamp">✓ TERVERIFIKASI BENDAHARA RESMI</div>
        </div>
        <div class="footer">
          <p>Jazakumullah khairan katsiran atas kontribusi infaq dan ta'awun Anda demi kemaslahatan ukhuwah alumni angkatan 43.</p>
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

  // Formal Certificate of Appreciation / Piagam Penghargaan Donatur
  const handlePrintCertificate = (tx: Transaction) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showAlert("Peringatan", "Harap izinkan popup browser untuk mencetak piagam penghargaan donatur.");
      return;
    }
    const certHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Piagam Penghargaan Donatur — ${tx.donor_name || "Hamba Allah"}</title>
        <style>
          @page { size: landscape; margin: 12mm; }
          body {
            font-family: 'Times New Roman', Georgia, serif;
            margin: 0;
            padding: 30px;
            background: #fffdf9;
            color: #1a1a1a;
            box-sizing: border-box;
          }
          .cert-frame {
            border: 8px double #b8860b;
            outline: 2px solid #855800;
            outline-offset: -16px;
            padding: 40px 45px;
            text-align: center;
            background: radial-gradient(circle at center, #ffffff 60%, #faf5ea 100%);
            position: relative;
            box-shadow: inset 0 0 30px rgba(184, 134, 11, 0.1);
          }
          .cert-header {
            font-size: 13px;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #855800;
            font-family: 'Courier New', monospace;
            margin-bottom: 8px;
            font-weight: bold;
          }
          .cert-title {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: 3px;
            color: #855800;
            margin: 0 0 8px;
            text-transform: uppercase;
          }
          .cert-subtitle {
            font-size: 13px;
            font-style: italic;
            color: #555;
            margin: 0 auto 20px;
            max-width: 600px;
          }
          .recipient-name {
            font-size: 30px;
            font-weight: bold;
            color: #111;
            border-bottom: 2px solid #b8860b;
            display: inline-block;
            padding: 0 35px 6px;
            margin: 12px 0 16px;
            font-family: 'Times New Roman', serif;
            letter-spacing: 1px;
          }
          .cert-desc {
            font-size: 14px;
            line-height: 1.8;
            max-width: 720px;
            margin: 0 auto 20px;
            color: #333;
          }
          .amount-highlight {
            font-size: 20px;
            font-weight: bold;
            color: #855800;
            background: rgba(184, 134, 11, 0.08);
            padding: 4px 16px;
            border-radius: 4px;
            border: 1px dashed #b8860b;
            display: inline-block;
            margin: 5px 0;
          }
          .cert-footer {
            display: flex;
            justify-content: space-around;
            align-items: flex-end;
            margin-top: 35px;
            padding: 0 40px;
          }
          .sig-box {
            text-align: center;
            width: 220px;
          }
          .sig-line {
            border-top: 1px solid #777;
            margin-top: 45px;
            padding-top: 6px;
            font-weight: bold;
            font-size: 13px;
          }
          .sig-role {
            font-size: 11px;
            color: #666;
            font-family: sans-serif;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .seal-box {
            width: 86px;
            height: 86px;
            border: 3px double #b8860b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: #b8860b;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 0 10px rgba(184, 134, 11, 0.2);
            background: #fffdf5;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="cert-frame">
          <div class="cert-header">BAITUL MAAL EXPEDIENT GENERATION 43</div>
          <h1 class="cert-title">Piagam Apresiasi Donatur</h1>
          <p class="cert-subtitle">Nomor Registrasi: CERT/BM43/${tx.id.slice(0, 8).toUpperCase()}/${new Date().getFullYear()}</p>
          
          <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Dianugerahkan Dengan Penuh Takzim Kepada:</div>
          <div class="recipient-name">${tx.donor_name || "Hamba Allah"}</div>
          
          <p class="cert-desc">
            Atas ketulusan, keikhlasan, dan komitmen ta'awun infaq senilai<br/>
            <span class="amount-highlight">${formatRupiah(Number(tx.amount))}</span><br/>
            untuk dialokasikan pada program <strong>${tx.description || "Kas Rutin & Operasional Ukhuwah"}</strong>.<br/>
            Semoga Allah Subhanahu Wa Ta'ala melipatgandakan pahala kebaikan, memperluas pintu rezeki, dan menjadikannya amal jariyah abadi bagi antum sekeluarga. Aamiin.
          </p>

          <div class="cert-footer">
            <div class="sig-box">
              <div class="sig-line">Ketua Angkatan 43</div>
              <div class="sig-role">Expedient Generation</div>
            </div>

            <div class="seal-box">
              <span>★ RESMI ★</span>
              <span>BAITUL MAAL</span>
              <span>ANGKATAN 43</span>
            </div>

            <div class="sig-box">
              <div class="sig-line">Bendahara Baitul Maal</div>
              <div class="sig-role">Verifikasi Kas Terpercaya</div>
            </div>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 25px;">
          <button onclick="window.print()" style="padding: 12px 30px; background: #b8860b; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            Cetak / Simpan PDF (Landscape)
          </button>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(certHtml);
    printWindow.document.close();
  };

  // Trigger monthly infaq reminder via WhatsApp Queue
  const handleTriggerInfaqReminder = async () => {
    const isConfirmed = await showConfirm(
      "Kirim Pengingat Infaq Bulanan",
      "Apakah Anda yakin ingin memicu pesan pengingat kas rutin bulanan via WhatsApp ke seluruh alumni yang mengaktifkan notifikasi?"
    );
    if (!isConfirmed) return;

    setIsSendingReminder(true);
    try {
      const res = await fetch("/api/cron/run?run_infaq_reminder=true");
      await res.text();
      await showAlert("Berhasil", "Pesan pengingat infaq kas rutin bulanan berhasil dimasukkan ke antrean WhatsApp!");
    } catch (e: any) {
      await showAlert("Gagal", "Gagal memproses pengingat: " + e.message);
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Zakat Calculator Logic
  const nisabTahunan = 85 * goldPrice; // Nisab 85g emas
  const nisabBulanan = nisabTahunan / 12;

  const totalPenghasilanBulanan =
    (Number(monthlyIncome) || 0) + (Number(otherIncome) || 0) - (Number(monthlyExpense) || 0);
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
            <div className="stat-label">Total Pemasukan Kas</div>
            <h2 className="stat-value text-in">{formatRupiah(totalIn)}</h2>
            <div className="stat-sub">
              {completedTransactions.filter((t) => t.transaction_type === "IN").length} Transaksi Terverifikasi
            </div>
          </div>

          <div className="stat-card">
            <i className="fa-solid fa-arrow-turn-up stat-icon" style={{ color: "#ff5555" }}></i>
            <div className="stat-label">Total Penyaluran Kas</div>
            <h2 className="stat-value text-out">{formatRupiah(totalOut)}</h2>
            <div className="stat-sub">
              {completedTransactions.filter((t) => t.transaction_type === "OUT").length} Penyaluran Operasional
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
            <>
              <button
                type="button"
                className="btn-action-admin"
                onClick={() => setIsRecordPanelOpen(true)}
              >
                <i className="fa-solid fa-file-signature"></i> Catat Entri Kas
              </button>
              <button
                type="button"
                className="btn-action-admin"
                style={{
                  background: "rgba(212, 175, 55, 0.15)",
                  borderColor: "var(--gold-main, #d4af37)",
                  color: "var(--gold-main, #d4af37)",
                }}
                onClick={() => {
                  setEditAccounts(bankAccounts);
                  setContactName(contactInfo?.name || "");
                  setContactPhone(contactInfo?.phone || "");
                  setIsManageBankOpen(true);
                }}
              >
                <i className="fa-solid fa-building-columns"></i> Kelola Rekening Kas
              </button>
              <button
                type="button"
                className="btn-action-admin"
                style={{ background: "rgba(37,211,102,0.15)", borderColor: "#25d366", color: "#25d366" }}
                disabled={isSendingReminder}
                onClick={handleTriggerInfaqReminder}
                title="Pemicu broadcast pengingat infaq bulanan via WA"
              >
                <i className="fa-brands fa-whatsapp"></i>{" "}
                {isSendingReminder ? "Memproses..." : "Pengingat Kas (WA)"}
              </button>
            </>
          )}
        </div>

        {/* CAMPAIGN & TA'AWUN ALLOCATIONS (100% REAL DATA) */}
        <div className="campaign-section">
          <div className="section-heading">
            <h2 className="section-title">
              <i className="fa-solid fa-bullseye-arrow"></i> Program & Alokasi Penyaluran
            </h2>
            <span className="section-desc">Distribusi dana umat terhimpun untuk kemaslahatan bersama</span>
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
                  <p className="campaign-target">Dana Khidmah & Operasional Angkatan</p>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-gold"
                  style={{
                    width: `${totalIn > 0 ? Math.min(100, Math.round((kasRutinIn / totalIn) * 100)) : 0}%`,
                  }}
                ></div>
              </div>
              <div className="campaign-meta">
                <span>
                  Terkumpul: <strong>{formatRupiah(kasRutinIn)}</strong>
                </span>
                <span>{totalIn > 0 ? Math.round((kasRutinIn / totalIn) * 100) : 0}% Alokasi</span>
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
                  <p className="campaign-target">Bantuan Solidaritas & Kemanusiaan</p>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-green"
                  style={{
                    width: `${totalIn > 0 ? Math.min(100, Math.round((taawunIn / totalIn) * 100)) : 0}%`,
                  }}
                ></div>
              </div>
              <div className="campaign-meta">
                <span>
                  Terkumpul: <strong>{formatRupiah(taawunIn)}</strong>
                </span>
                <span>{totalIn > 0 ? Math.round((taawunIn / totalIn) * 100) : 0}% Alokasi</span>
              </div>
            </div>

            {/* Program 3 */}
            <div className="campaign-card">
              <div className="campaign-header">
                <div className="campaign-icon icon-blue">
                  <i className="fa-solid fa-mosque"></i>
                </div>
                <div>
                  <h3 className="campaign-name">Safari Dakwah & Silaturahmi</h3>
                  <p className="campaign-target">Program Ukhuwah & Agenda Angkatan</p>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-blue"
                  style={{
                    width: `${totalIn > 0 ? Math.min(100, Math.round((safariIn / totalIn) * 100)) : 0}%`,
                  }}
                ></div>
              </div>
              <div className="campaign-meta">
                <span>
                  Terkumpul: <strong>{formatRupiah(safariIn)}</strong>
                </span>
                <span>{totalIn > 0 ? Math.round((safariIn / totalIn) * 100) : 0}% Alokasi</span>
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
              <i
                className="fa-solid fa-book-open"
                style={{ color: "var(--gold-main, #d4af37)", fontSize: "2rem", opacity: 0.5 }}
              ></i>
            </div>
          </div>

          {/* FILTER & SEARCH TOOLBAR */}
          <div className="ledger-toolbar">
            <div className="filter-tabs">
              <button
                type="button"
                className={`filter-tab ${filterType === "ALL" ? "active" : ""}`}
                onClick={() => handleFilterChange("ALL")}
              >
                Semua ({transactions.length})
              </button>
              <button
                type="button"
                className={`filter-tab ${filterType === "IN" ? "active" : ""}`}
                onClick={() => handleFilterChange("IN")}
              >
                <i className="fa-solid fa-arrow-down" style={{ color: "#00ff88" }}></i> Pemasukan
              </button>
              <button
                type="button"
                className={`filter-tab ${filterType === "OUT" ? "active" : ""}`}
                onClick={() => handleFilterChange("OUT")}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
            {isFilterLoading ? (
              [1, 2, 3].map((i) => (
                <div className="tx-item" key={i} style={{ opacity: 0.9 }}>
                  <div className="tx-left">
                    <div className="skeleton-shimmer skeleton-circle" style={{ width: 44, height: 44, flexShrink: 0 }} />
                    <div className="tx-details" style={{ width: "100%" }}>
                      <div className="skeleton-shimmer" style={{ width: "55%", height: 16, borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <div className="skeleton-shimmer" style={{ width: 110, height: 12, borderRadius: 4 }} />
                        <div className="skeleton-shimmer" style={{ width: 130, height: 12, borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="skeleton-shimmer skeleton-pill" style={{ width: 110, height: 26 }} />
                    <div className="skeleton-shimmer skeleton-pill hide-mobile" style={{ width: 70, height: 28 }} />
                  </div>
                </div>
              ))
            ) : filteredTransactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-secondary, #8b9ba8)" }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: "3rem", marginBottom: "15px", opacity: 0.3 }}></i>
                <br />
                {searchQuery
                  ? "Tidak ada transaksi yang cocok dengan pencarian."
                  : "Belum ada catatan transaksi di dalam buku besar ini."}
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div className="tx-item" key={tx.id}>
                  <div className="tx-left">
                    <div className={`tx-type-icon ${tx.transaction_type === "IN" ? "tx-in-bg" : "tx-out-bg"}`}>
                      <i className={`fa-solid ${tx.transaction_type === "IN" ? "fa-arrow-down" : "fa-arrow-up"}`}></i>
                    </div>
                    <div className="tx-details">
                      <div className="tx-title">
                        {tx.description}
                        {tx.status === "pending" && (
                          <span
                            style={{
                              marginLeft: "8px",
                              background: "rgba(255, 170, 0, 0.15)",
                              border: "1px solid rgba(255, 170, 0, 0.4)",
                              color: "#ffaa00",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <i className="fa-solid fa-clock"></i> Verifikasi
                          </span>
                        )}
                        {tx.status === "rejected" && (
                          <span
                            style={{
                              marginLeft: "8px",
                              background: "rgba(255, 85, 85, 0.15)",
                              border: "1px solid rgba(255, 85, 85, 0.4)",
                              color: "#ff5555",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                            }}
                          >
                            Ditolak
                          </span>
                        )}
                      </div>
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <div className={`tx-amount ${tx.transaction_type === "IN" ? "in" : "out"}`}>
                      {tx.transaction_type === "IN" ? "+" : "-"} {formatRupiah(Number(tx.amount))}
                    </div>

                    {/* Admin Verification Actions */}
                    {isAdmin && tx.status === "pending" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleVerifyTx(tx.id, true)}
                          style={{
                            background: "rgba(0, 255, 136, 0.15)",
                            border: "1px solid #00ff88",
                            color: "#00ff88",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Validasi & Masukkan ke Buku Kas"
                        >
                          <i className="fa-solid fa-check"></i> Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyTx(tx.id, false)}
                          style={{
                            background: "rgba(255, 85, 85, 0.15)",
                            border: "1px solid #ff5555",
                            color: "#ff5555",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                          title="Tolak entri donasi ini"
                        >
                          <i className="fa-solid fa-xmark"></i> Tolak
                        </button>
                      </div>
                    )}

                    {/* Receipt & Certificate Buttons (Completed IN Only) */}
                    {tx.transaction_type === "IN" && (!tx.status || tx.status === "completed") && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
                            gap: "5px",
                          }}
                          title="Cetak Bukti Tanda Terima Donasi Resmi"
                        >
                          <i className="fa-solid fa-receipt"></i> Bukti
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintCertificate(tx)}
                          style={{
                            background: "rgba(212, 175, 55, 0.18)",
                            border: "1px solid #d4af37",
                            color: "#f3e5ab",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                          title="Cetak Piagam Penghargaan Apresiasi Donatur (Landscape)"
                        >
                          <i className="fa-solid fa-award"></i> Piagam
                        </button>
                      </div>
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
          <div className="maal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Salurkan Infaq & Ta'awun</h2>
                <p className="modal-subtitle">Pintu amal jariyah & kontribusi kemaslahatan angkatan</p>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setIsDonateOpen(false)}>
                &times;
              </button>
            </div>

            {/* DYNAMIC REKENING RESMI CARDS */}
            {bankAccounts.length > 0 ? (
              <div className="bank-accounts-section">
                {bankAccounts.map((acc, idx) => (
                  <div className="bank-card" key={idx}>
                    <div className="bank-info">
                      <span className={`bank-badge ${acc.bank.toLowerCase().replace(/[^a-z0-9]/g, "")}`}>
                        {acc.bank}
                      </span>
                      <div className="bank-number">{acc.account_number}</div>
                      <div className="bank-holder">a.n. {acc.account_name}</div>
                    </div>
                    <button
                      type="button"
                      className="btn-copy-acc"
                      onClick={() => handleCopy(acc.account_number.replace(/\s/g, ""), `Rekening ${acc.bank}`)}
                    >
                      <i className="fa-regular fa-copy"></i> Salin
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "20px",
                  background: "rgba(212, 175, 55, 0.08)",
                  border: "1px dashed rgba(212, 175, 55, 0.35)",
                  borderRadius: "12px",
                  marginBottom: "15px",
                  textAlign: "center",
                }}
              >
                <i
                  className="fa-solid fa-building-columns"
                  style={{ fontSize: "2rem", color: "var(--gold-main, #d4af37)", marginBottom: "10px" }}
                ></i>
                <h4 style={{ margin: "0 0 6px", color: "var(--gold-main, #d4af37)", fontSize: "1rem" }}>
                  Rekening Kas Resmi Sedang Disiapkan
                </h4>
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary, #8b9ba8)",
                    lineHeight: 1.5,
                  }}
                >
                  Untuk mendapatkan nomor rekening resmi tujuan transfer atau konfirmasi infaq, silakan hubungi
                  Bendahara Angkatan secara langsung.
                </p>
                {contactInfo?.phone ? (
                  <a
                    href={`https://wa.me/${contactInfo.phone.replace(/^0/, "62").replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Assalamu'alaikum Bendahara Baitul Maal Expedient, saya ingin menanyakan nomor rekening resmi untuk penyaluran infaq/donasi.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#25d366",
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      textDecoration: "none",
                    }}
                  >
                    <i className="fa-brands fa-whatsapp"></i> Hubungi Bendahara ({contactInfo.name || "Bendahara"})
                  </a>
                ) : null}
                {isAdmin && (
                  <div style={{ marginTop: "12px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDonateOpen(false);
                        setEditAccounts(bankAccounts);
                        setContactName(contactInfo?.name || "");
                        setContactPhone(contactInfo?.phone || "");
                        setIsManageBankOpen(true);
                      }}
                      style={{
                        background: "rgba(212, 175, 55, 0.2)",
                        border: "1px solid var(--gold-main, #d4af37)",
                        color: "var(--gold-main, #d4af37)",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      <i className="fa-solid fa-gear"></i> Kelola Rekening Kas Sekarang (Bendahara)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* FORM KONFIRMASI INFAQ */}
            <form onSubmit={handleDonateSubmit} className="maal-modal-form">
              <h3 className="form-section-title">Konfirmasi Pengiriman Infaq</h3>

              <div className="form-group">
                <label>PILIHAN PROGRAM</label>
                <select value={donateProgram} onChange={(e) => setDonateProgram(e.target.value)} required>
                  <option value="Kas Rutin Angkatan">Kas Rutin Angkatan</option>
                  <option value="Dana Ta'awun Sahabat">Dana Ta'awun & Santunan Sahabat</option>
                  <option value="Infaq & Sedekah Bebas">Infaq & Sedekah Bebas</option>
                  <option value="Zakat Maal & Penghasilan">Zakat Maal / Penghasilan</option>
                  <option value="Safari Dakwah & Reuni">Safari Dakwah & Reuni</option>
                </select>
              </div>

              <div className="form-group">
                <label>BANK TUJUAN PENYALURAN</label>
                <select value={donateBank} onChange={(e) => setDonateBank(e.target.value)} required>
                  {bankAccounts.length > 0 ? (
                    bankAccounts.map((acc, idx) => (
                      <option key={idx} value={acc.bank}>
                        {acc.bank} ({acc.account_number})
                      </option>
                    ))
                  ) : (
                    <option value="Rekening Bendahara">Rekening Resmi Bendahara Kas</option>
                  )}
                  <option value="QRIS / E-Wallet">QRIS / E-Wallet Lainnya</option>
                </select>
              </div>

              <div className="form-group">
                <label>NOMINAL INFAQ (RUPIAH)</label>
                <div className="preset-amounts">
                  {[25000, 50000, 100000, 250000, 500000, 1000000].map((amt) => (
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
                  onChange={(e) => setDonateAmount(e.target.value)}
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
                  onChange={(e) => setDonatePrayer(e.target.value)}
                ></textarea>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={donateAnonim}
                  onChange={(e) => setDonateAnonim(e.target.checked)}
                />
                <span>
                  Salurkan Sebagai <strong>Hamba Allah (Anonim)</strong>
                </span>
              </label>

              <button type="submit" className="btn-submit-donate" disabled={isDonating}>
                <i className="fa-solid fa-heart"></i>{" "}
                {isDonating ? "Memproses..." : "Konfirmasi Penyaluran Infaq"}
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
          <div className="maal-modal-card" onClick={(e) => e.stopPropagation()}>
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
                  {zakatType === "profesi"
                    ? "PENGHASILAN UTAMA PER BULAN (RP)"
                    : "TOTAL TABUNGAN / DEPOSITO / EMAS (RP)"}
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 10000000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
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
                      onChange={(e) => setOtherIncome(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>PENGELUARAN POKOK / HUTANG JATUH TEMPO (RP)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 3000000"
                      value={monthlyExpense}
                      onChange={(e) => setMonthlyExpense(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="nisab-info-box">
                <div className="nisab-row">
                  <span>Standar Nisab (85g Emas):</span>
                  <strong>
                    {formatRupiah(nisabBulanan)} / bulan ({formatRupiah(nisabTahunan)} / tahun)
                  </strong>
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
      {/* MODAL 3: KELOLA REKENING KAS RESMI (ADMIN / BENDAHARA ONLY) */}
      {/* ========================================================================= */}
      {isAdmin && isManageBankOpen && (
        <div className="maal-modal-backdrop" onClick={() => setIsManageBankOpen(false)}>
          <div
            className="maal-modal-card"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Kelola Rekening Kas Resmi</h2>
                <p className="modal-subtitle">Pengaturan rekening perbankan & kontak bendahara resmi</p>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsManageBankOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBankConfig} className="maal-modal-form">
              {/* DAFTAR REKENING AKTIF */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--gold-main, #d4af37)", letterSpacing: "1px" }}>
                  DAFTAR REKENING AKTIF ({editAccounts.length})
                </label>
                {editAccounts.length === 0 ? (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary, #8b9ba8)",
                      margin: "8px 0",
                      textAlign: "center",
                    }}
                  >
                    Belum ada rekening yang ditambahkan.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "10px 0" }}>
                    {editAccounts.map((acc, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: "var(--text-primary, #fff)" }}>
                            {acc.bank} — <span style={{ fontFamily: "monospace" }}>{acc.account_number}</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #8b9ba8)" }}>
                            a.n. {acc.account_name}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAccountFromEdit(idx)}
                          style={{
                            background: "rgba(255,85,85,0.15)",
                            border: "1px solid #ff5555",
                            color: "#ff5555",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                          title="Hapus Rekening"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FORM TAMBAH REKENING */}
              <div
                style={{
                  background: "rgba(212, 175, 55, 0.05)",
                  border: "1px solid rgba(212, 175, 55, 0.2)",
                  padding: "14px",
                  borderRadius: "10px",
                  marginTop: "6px",
                }}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gold-main, #d4af37)", marginBottom: "10px" }}>
                  + Tambah Rekening Baru
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem" }}>NAMA BANK</label>
                    <input
                      type="text"
                      placeholder="Contoh: BSI / BCA / Mandiri"
                      value={newBank}
                      onChange={(e) => setNewBank(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem" }}>NOMOR REKENING</label>
                    <input
                      type="text"
                      placeholder="Contoh: 7234890123"
                      value={newNumber}
                      onChange={(e) => setNewNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label style={{ fontSize: "0.75rem" }}>ATAS NAMA PEMILIK</label>
                  <input
                    type="text"
                    placeholder="Contoh: Baitul Maal Expedient"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAccountToEdit}
                  style={{
                    background: "rgba(212, 175, 55, 0.15)",
                    border: "1px solid var(--gold-main, #d4af37)",
                    color: "var(--gold-main, #d4af37)",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    width: "100%",
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Tambahkan ke Daftar
                </button>
              </div>

              {/* KONTAK BENDAHARA */}
              <div style={{ marginTop: "10px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--gold-main, #d4af37)", letterSpacing: "1px" }}>
                  KONTAK WHATSAPP BENDAHARA (UNTUK KONFIRMASI ANGGOTA)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "6px" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem" }}>NAMA BENDAHARA</label>
                    <input
                      type="text"
                      placeholder="Contoh: Akhina Bendahara"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem" }}>NO. WHATSAPP</label>
                    <input
                      type="text"
                      placeholder="Contoh: 081234567890"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-submit-donate"
                style={{ marginTop: "15px" }}
                disabled={isSavingBank}
              >
                <i className="fa-solid fa-check"></i>{" "}
                {isSavingBank ? "Menyimpan Konfigurasi..." : "Simpan Perubahan Rekening & Kontak"}
              </button>
            </form>
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

          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary, #8b9ba8)",
              marginBottom: "20px",
              lineHeight: 1.5,
            }}
          >
            Anda login sebagai <strong>{currentUser.role.toUpperCase()}</strong>. Pastikan data mutasi kas dimasukkan
            dengan teliti untuk menjaga integritas Buku Besar.
          </div>

          <form onSubmit={handleAdminRecordSubmit} className="maal-form">
            <label>JENIS TRANSAKSI</label>
            <select
              value={adminType}
              onChange={(e) => setAdminType(e.target.value as "IN" | "OUT")}
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
              onChange={(e) => setAdminAmount(e.target.value)}
              required
              min="1"
            />

            <label>KETERANGAN / TUJUAN</label>
            <textarea
              rows={3}
              placeholder="Deskripsi detail transaksi kas..."
              value={adminDesc}
              onChange={(e) => setAdminDesc(e.target.value)}
              required
            ></textarea>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexDirection: "row",
                cursor: "pointer",
                marginBottom: "25px",
              }}
            >
              <input
                type="checkbox"
                checked={adminAnonim}
                onChange={(e) => setAdminAnonim(e.target.checked)}
                style={{ width: "auto", margin: 0 }}
              />
              <span style={{ color: "var(--text-primary, #fff)", fontSize: "0.9rem" }}>
                Catat Sebagai Hamba Allah (Anonim)
              </span>
            </label>

            <button type="submit" className="btn-submit-maal" disabled={isAdminSubmitting}>
              <i className="fa-solid fa-file-signature"></i>{" "}
              {isAdminSubmitting ? "Menyimpan Entri..." : "Otorisasi Entri Buku Besar"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
