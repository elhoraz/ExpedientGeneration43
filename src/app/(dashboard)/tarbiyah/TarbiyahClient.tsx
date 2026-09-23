"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { getAvatarUrl } from "@/lib/avatar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "./tarbiyah.css";

interface Mentor {
  id: string;
  nama_panggilan?: string;
  nama_lengkap?: string;
  foto_profil?: string;
  motivasi_hidup?: string;
  role?: string;
  pekerjaan?: string;
  alamat_sekarang?: string;
}

interface Tender {
  id: string;
  nama_bisnis: string;
  kategori?: string;
  deskripsi?: string;
  logo_url?: string;
  user_id?: string;
  kontak?: string;
}

interface RequestItem {
  id: string;
  user_id: string;
  target_id: string;
  type: "Mentor" | "Tender";
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
  target_name?: string;
  target_subtitle?: string;
  target_avatar?: string;
  requester_name?: string;
  requester_role?: string;
  requester_avatar?: string;
}

interface Materi {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  status: "upcoming" | "completed";
  created_at?: string;
}

interface CurrentUser {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export default function TarbiyahClient({
  currentUser,
  mentors,
  tenders,
  sentRequests,
  incomingRequests,
  initialMateri,
}: {
  currentUser: CurrentUser;
  mentors: Mentor[];
  tenders: Tender[];
  sentRequests: RequestItem[];
  incomingRequests: RequestItem[];
  initialMateri: Materi[];
}) {
  const { t, locale } = useLanguage();
  // CSS Scoping: body class untuk isolasi CSS halaman ini
  useEffect(() => {
    document.body.classList.add('page-tarbiyah');
    return () => { document.body.classList.remove('page-tarbiyah'); };
  }, []);

  // Navigation
  const [activeTab, setActiveTab] = useState<"mentor" | "tender" | "materi" | "my_requests" | "inbox">("mentor");
  
  // Data States
  const [localSentRequests, setLocalSentRequests] = useState<RequestItem[]>(sentRequests);
  const [localIncomingRequests, setLocalIncomingRequests] = useState<RequestItem[]>(incomingRequests);
  const [materiList, setMateriList] = useState<Materi[]>(initialMateri);

  // Search & Filter States
  const [mentorSearch, setMentorSearch] = useState("");
  const [tenderSearch, setTenderSearch] = useState("");
  const [selectedTenderCat, setSelectedTenderCat] = useState("Semua");

  // Proposal Modal State
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalTarget, setProposalTarget] = useState<{ id: string; name: string; type: "Mentor" | "Tender"; subtitle?: string; avatar?: string } | null>(null);
  const [proposalSubject, setProposalSubject] = useState("");
  const [proposalMessage, setProposalMessage] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Admin Add Materi Modal State
  const [isAddMateriOpen, setIsAddMateriOpen] = useState(false);
  const [newMateriTitle, setNewMateriTitle] = useState("");
  const [newMateriDesc, setNewMateriDesc] = useState("");
  const [newMateriDate, setNewMateriDate] = useState("");
  const [newMateriStatus, setNewMateriStatus] = useState<"upcoming" | "completed">("upcoming");
  const [isSubmittingMateri, setIsSubmittingMateri] = useState(false);

  const { showConfirm, showAlert } = useConfirm();

  // Filtered Mentors
  const filteredMentors = useMemo(() => {
    return mentors.filter(m => {
      const q = mentorSearch.toLowerCase();
      const name = (m.nama_panggilan || m.nama_lengkap || "").toLowerCase();
      const job = (m.pekerjaan || "").toLowerCase();
      const desc = (m.motivasi_hidup || "").toLowerCase();
      return !mentorSearch || name.includes(q) || job.includes(q) || desc.includes(q);
    });
  }, [mentors, mentorSearch]);

  // Unique Tender Categories
  const tenderCategories = useMemo(() => {
    const cats = new Set<string>();
    tenders.forEach(t => {
      if (t.kategori) cats.add(t.kategori);
    });
    return ["Semua", ...Array.from(cats)];
  }, [tenders]);

  // Filtered Tenders
  const filteredTenders = useMemo(() => {
    return tenders.filter(t => {
      const matchCat = selectedTenderCat === "Semua" || t.kategori === selectedTenderCat;
      const q = tenderSearch.toLowerCase();
      const name = (t.nama_bisnis || "").toLowerCase();
      const desc = (t.deskripsi || "").toLowerCase();
      const matchSearch = !tenderSearch || name.includes(q) || desc.includes(q);
      return matchCat && matchSearch;
    });
  }, [tenders, selectedTenderCat, tenderSearch]);

  const getSentRequestStatus = (targetId: string) => {
    return localSentRequests.find(r => r.target_id === targetId)?.status;
  };

  const getSyndicateLogoUrl = (logoPath?: string, defaultName: string = "B") => {
    if (!logoPath) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultName)}&background=222&color=fff`;
    }
    if (logoPath.startsWith("http") || logoPath.startsWith("/")) return logoPath;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bisnis/${logoPath}`;
  };

  const formatDate = (dateString: string) => {
    const dLocale = locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "id-ID";
    return new Date(dateString).toLocaleDateString(dLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Open Proposal Modal for specific target
  const handleOpenProposal = (target: { id: string; name: string; type: "Mentor" | "Tender"; subtitle?: string; avatar?: string }) => {
    setProposalTarget(target);
    setProposalSubject(target.type === "Mentor" ? "Permohonan Mentoring & Konsultasi" : "Pengajuan Kerjasama B2B / Tender");
    setProposalMessage("");
    setIsProposalModalOpen(true);
  };

  // Open General Proposal from toolbar
  const handleOpenGeneralProposal = (type: "Mentor" | "Tender") => {
    if (type === "Mentor") {
      const first = mentors[0];
      setProposalTarget({
        id: first?.id || "",
        name: first ? (first.nama_panggilan || first.nama_lengkap || "Mentor") : "Pilih Mentor",
        type: "Mentor",
        subtitle: first?.pekerjaan || "Mentor Profesional",
        avatar: first?.foto_profil,
      });
      setProposalSubject("Permohonan Mentoring & Bimbingan Karir");
    } else {
      const first = tenders[0];
      setProposalTarget({
        id: first?.id || "",
        name: first ? first.nama_bisnis : "Pilih Bisnis Syndicate",
        type: "Tender",
        subtitle: first?.kategori || "B2B Syndicate",
        avatar: first?.logo_url,
      });
      setProposalSubject("Pengajuan Kerjasama Bisnis / Tender");
    }
    setProposalMessage("");
    setIsProposalModalOpen(true);
  };

  // Submit Proposal with Wax Seal
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTarget || !proposalTarget.id) {
      await showAlert(
        locale === "ar" ? "تنبيه" : locale === "en" ? "Warning" : "Peringatan",
        locale === "ar" ? "يرجى تحديد المرشد أو جهة العمل أولاً." : locale === "en" ? "Please select a mentor or business target first." : "Silakan pilih target mentor atau bisnis terlebih dahulu."
      );
      return;
    }

    setIsSubmittingProposal(true);
    try {
      const res = await fetch("/api/tarbiyah/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_request",
          targetId: proposalTarget.id,
          type: proposalTarget.type,
          subject: proposalSubject,
          message: proposalMessage,
        }),
      });

      const json = await res.json();
      if (json.status === "success" || json.success) {
        const newReq: RequestItem = {
          id: json.data?.id || Math.random().toString(),
          user_id: currentUser.id,
          target_id: proposalTarget.id,
          type: proposalTarget.type,
          status: "Pending",
          created_at: new Date().toISOString(),
          target_name: proposalTarget.name,
          target_subtitle: proposalTarget.subtitle,
          target_avatar: proposalTarget.avatar,
        };
        setLocalSentRequests(prev => [newReq, ...prev.filter(r => r.target_id !== proposalTarget.id)]);
        await showAlert(
          locale === "ar" ? "تم التوثيق والختم" : locale === "en" ? "Officially Sealed" : "Disegel Resmi",
          locale === "ar" ? `تم إرسال طلب ${proposalTarget.type === "Mentor" ? "الإرشاد" : "المناقصة"} بنجاح إلى ${proposalTarget.name}.` : locale === "en" ? `${proposalTarget.type} proposal successfully sent to ${proposalTarget.name}.` : `Permohonan ${proposalTarget.type} telah berhasil dikirimkan kepada ${proposalTarget.name}.`
        );
        setIsProposalModalOpen(false);
      } else {
        await showAlert(
          locale === "ar" ? "فشل" : locale === "en" ? "Failed" : "Gagal",
          json.message || json.error || (locale === "ar" ? "فشل إرسال الطلب." : locale === "en" ? "Failed to send request." : "Gagal mengirimkan permohonan.")
        );
      }
    } catch (err: any) {
      await showAlert(
        locale === "ar" ? "خطأ" : locale === "en" ? "Error" : "Error",
        (locale === "ar" ? "حدث خطأ: " : locale === "en" ? "An error occurred: " : "Terjadi kesalahan: ") + err.message
      );
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Handle Response on Incoming Request (Approve / Reject)
  const handleIncomingResponse = async (requestId: string, newStatus: "Approved" | "Rejected", requesterName: string) => {
    const isApproved = newStatus === "Approved";
    const confirmTitle = isApproved
      ? (locale === "ar" ? "الموافقة على الطلب" : locale === "en" ? "Approve Request" : "Setujui Permohonan")
      : (locale === "ar" ? "رفض الطلب" : locale === "en" ? "Reject Request" : "Tolak Permohonan");
    const confirmMsg = isApproved
      ? (locale === "ar" ? `هل أنت متأكد من رغبتك في الموافقة على طلب ${requesterName}؟` : locale === "en" ? `Are you sure you want to approve the request from ${requesterName}?` : `Apakah Anda yakin ingin menyetujui permohonan dari ${requesterName}?`)
      : (locale === "ar" ? `هل أنت متأكد من رغبتك في رفض طلب ${requesterName}؟` : locale === "en" ? `Are you sure you want to reject the request from ${requesterName}?` : `Apakah Anda yakin ingin menolak permohonan dari ${requesterName}?`);
    
    const confirmed = await showConfirm(confirmTitle, confirmMsg);
    if (!confirmed) return;

    try {
      const res = await fetch("/api/tarbiyah/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          requestId,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (json.status === "success" || json.success) {
        setLocalIncomingRequests(prev =>
          prev.map(r => (r.id === requestId ? { ...r, status: newStatus } : r))
        );
        await showAlert(
          locale === "ar" ? "تم بنجاح" : locale === "en" ? "Success" : "Berhasil",
          isApproved
            ? (locale === "ar" ? "تمت الموافقة على الطلب (+20 نقاط)." : locale === "en" ? "Request approved (+20 Prestige)." : "Permohonan telah disetujui (+20 Prestise).")
            : (locale === "ar" ? "تم رفض الطلب." : locale === "en" ? "Request rejected." : "Permohonan telah ditolak.")
        );
      } else {
        await showAlert(
          locale === "ar" ? "فشل" : locale === "en" ? "Failed" : "Gagal",
          json.message || json.error || (locale === "ar" ? "فشل تحديث حالة الطلب." : locale === "en" ? "Failed to update request status." : "Gagal memperbarui status permohonan.")
        );
      }
    } catch (err: any) {
      await showAlert(
        locale === "ar" ? "خطأ" : locale === "en" ? "Error" : "Error",
        (locale === "ar" ? "حدث خطأ: " : locale === "en" ? "An error occurred: " : "Terjadi kesalahan: ") + err.message
      );
    }
  };

  // Submit Admin Add Materi
  const handleAddMateriSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMateriTitle.trim()) {
      await showAlert(
        locale === "ar" ? "تنبيه" : locale === "en" ? "Warning" : "Peringatan",
        locale === "ar" ? "عنوان المادة العلمية مطلوب." : locale === "en" ? "Study material title is required." : "Judul materi kajian wajib diisi."
      );
      return;
    }

    setIsSubmittingMateri(true);
    try {
      const res = await fetch("/api/tarbiyah/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_materi",
          title: newMateriTitle.trim(),
          description: newMateriDesc.trim(),
          event_date: newMateriDate || new Date().toISOString(),
          status: newMateriStatus,
        }),
      });

      const json = await res.json();
      if (json.status === "success") {
        setMateriList(prev => [json.data, ...prev]);
        await showAlert(
          locale === "ar" ? "تم بنجاح" : locale === "en" ? "Success" : "Berhasil",
          locale === "ar" ? "تمت إضافة المادة العلمية بنجاح." : locale === "en" ? "New study material added successfully." : "Materi kajian baru berhasil ditambahkan."
        );
        setIsAddMateriOpen(false);
        setNewMateriTitle("");
        setNewMateriDesc("");
        setNewMateriDate("");
      } else {
        await showAlert(
          locale === "ar" ? "فشل" : locale === "en" ? "Failed" : "Gagal",
          json.message || (locale === "ar" ? "فشل إضافة المادة." : locale === "en" ? "Failed to add material." : "Gagal menambahkan materi.")
        );
      }
    } catch (err: any) {
      await showAlert(
        locale === "ar" ? "خطأ" : locale === "en" ? "Error" : "Error",
        (locale === "ar" ? "حدث خطأ: " : locale === "en" ? "An error occurred: " : "Terjadi kesalahan: ") + err.message
      );
    } finally {
      setIsSubmittingMateri(false);
    }
  };

  const pendingIncomingCount = localIncomingRequests.filter(r => r.status === "Pending").length;

  return (
    <div className="tarbiyah-page-wrapper">
      <div className="tarbiyah-wrapper">
        <Link href="/fitur" className="btn-back">
          <i className="fa-solid fa-arrow-left"></i> {t.common.back}
        </Link>

        {/* HEADER */}
        <div className="header-titles">
          <h1 className="tarbiyah-title">{t.tarbiyah.title}</h1>
          <p className="tarbiyah-subtitle">{t.tarbiyah.subtitle}</p>
        </div>

        {/* 5 MAIN NAVIGATION TABS */}
        <div className="nexus-tabs-bar">
          <button
            type="button"
            className={`tab-btn ${activeTab === "mentor" ? "active" : ""}`}
            onClick={() => setActiveTab("mentor")}
          >
            <i className="fa-solid fa-user-graduate"></i> {t.tarbiyah.tab_mentorship} ({mentors.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "tender" ? "active" : ""}`}
            onClick={() => setActiveTab("tender")}
          >
            <i className="fa-solid fa-briefcase"></i> {t.tarbiyah.tab_tender} ({tenders.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "materi" ? "active" : ""}`}
            onClick={() => setActiveTab("materi")}
          >
            <i className="fa-solid fa-book-quran"></i> {t.tarbiyah.tab_materi} ({materiList.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "my_requests" ? "active" : ""}`}
            onClick={() => setActiveTab("my_requests")}
          >
            <i className="fa-solid fa-paper-plane"></i> {t.tarbiyah.tab_my_requests} ({localSentRequests.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "inbox" ? "active" : ""}`}
            onClick={() => setActiveTab("inbox")}
          >
            <i className="fa-solid fa-inbox"></i> {t.tarbiyah.tab_inbox}
            {pendingIncomingCount > 0 && <span className="tab-badge">{pendingIncomingCount}</span>}
          </button>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: JARINGAN MENTORSHIP */}
        {/* ===================================================================== */}
        {activeTab === "mentor" && (
          <div className="tab-content-section">
            <div className="tab-toolbar">
              <div className="nexus-search-box">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder={t.tarbiyah.search_mentor_placeholder}
                  value={mentorSearch}
                  onChange={e => setMentorSearch(e.target.value)}
                />
                {mentorSearch && (
                  <button type="button" className="btn-clear" onClick={() => setMentorSearch("")}>
                    &times;
                  </button>
                )}
              </div>

              <button
                type="button"
                className="btn-toolbar-action"
                onClick={() => handleOpenGeneralProposal("Mentor")}
              >
                <i className="fa-solid fa-feather-pointed"></i> {t.tarbiyah.apply_mentorship}
              </button>
            </div>

            <div className="card-grid">
              {filteredMentors.length === 0 ? (
                <div className="empty-state-box">
                  <i className="fa-solid fa-user-slash"></i>
                  <p>{t.tarbiyah.no_mentors}</p>
                  <button
                    type="button"
                    className="btn-toolbar-action"
                    style={{ marginTop: "15px" }}
                    onClick={() => handleOpenGeneralProposal("Mentor")}
                  >
                    <i className="fa-solid fa-feather-pointed"></i> {t.tarbiyah.open_proposal}
                  </button>
                </div>
              ) : (
                filteredMentors.map(m => {
                  const status = getSentRequestStatus(m.id);
                  const avatar = getAvatarUrl(m.foto_profil, m.nama_panggilan || m.nama_lengkap || "M");
                  const displayName = m.nama_panggilan || m.nama_lengkap || "Mentor";

                  return (
                    <div key={m.id} className="nexus-card item-card">
                      <div className="card-badge">{m.role === "admin" ? t.tarbiyah.leader_badge : t.tarbiyah.elite_badge}</div>
                      <Image
                        src={avatar}
                        alt={displayName}
                        width={84}
                        height={84}
                        className="item-img"
                        unoptimized={avatar.startsWith("data:") || avatar.includes("ui-avatars.com") || avatar.includes("supabase.co")}
                      />
                      <h3 className="item-name">{displayName}</h3>
                      <div className="item-subtitle">{m.pekerjaan || "Mentor Profesional"}</div>
                      <p className="item-desc">
                        {m.motivasi_hidup && m.motivasi_hidup.length > 85
                          ? m.motivasi_hidup.substring(0, 85) + "..."
                          : m.motivasi_hidup || "Siap membimbing dan berbagi wawasan strategis."}
                      </p>

                      <div className="card-actions">
                        <div className="card-btn-row">
                          <Link href={`/dossier/${m.id}`} className="btn-action-view" title={t.tarbiyah.view_dossier}>
                            <i className="fa-regular fa-id-badge"></i> Dossier
                          </Link>
                          {status && (
                            <span className={`status-pill-mini status-${status}`}>
                              {status === "Pending" && <><i className="fa-solid fa-clock"></i> {locale === "ar" ? "قيد الانتظار" : locale === "en" ? "Pending" : "Menunggu"}</>}
                              {status === "Approved" && <><i className="fa-solid fa-check-double"></i> {locale === "ar" ? "معتمد" : locale === "en" ? "Approved" : "Disetujui"}</>}
                              {status === "Rejected" && <><i className="fa-solid fa-xmark"></i> {locale === "ar" ? "مرفوض" : locale === "en" ? "Rejected" : "Ditolak"}</>}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn-wax"
                          onClick={() =>
                            handleOpenProposal({
                              id: m.id,
                              name: displayName,
                              type: "Mentor",
                              subtitle: m.pekerjaan || "Mentor Profesional",
                              avatar: m.foto_profil,
                            })
                          }
                        >
                          <div className="wax-seal">
                            <i className="fa-solid fa-feather-pointed"></i>
                          </div>
                          <span>
                            {status === "Pending" ? (locale === "ar" ? "تعديل الطلب" : locale === "en" ? "Edit Request" : "Ubah Bimbingan") : status === "Approved" ? (locale === "ar" ? "طلب جلسة جديدة" : locale === "en" ? "New Session" : "Ajukan Sesi Baru") : t.tarbiyah.apply_mentorship}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: SOVEREIGN B2B & TENDER */}
        {/* ===================================================================== */}
        {activeTab === "tender" && (
          <div className="tab-content-section">
            <div className="tab-toolbar">
              <div className="category-chips">
                {tenderCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`chip-btn ${selectedTenderCat === cat ? "active" : ""}`}
                    onClick={() => setSelectedTenderCat(cat)}
                  >
                    {cat === "Semua" ? (locale === "ar" ? "الكل" : locale === "en" ? "All" : "Semua") : cat}
                  </button>
                ))}
              </div>

              <div className="toolbar-right-actions">
                <div className="nexus-search-box">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    type="text"
                    placeholder={locale === "ar" ? "ابحث عن مشروع، مناقصة، أو فرصة..." : locale === "en" ? "Search business, tender, or opportunities..." : "Cari bisnis, tender, atau peluang..."}
                    value={tenderSearch}
                    onChange={e => setTenderSearch(e.target.value)}
                  />
                  {tenderSearch && (
                    <button type="button" className="btn-clear" onClick={() => setTenderSearch("")}>
                      &times;
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-toolbar-action"
                  onClick={() => handleOpenGeneralProposal("Tender")}
                >
                  <i className="fa-solid fa-handshake"></i> {locale === "ar" ? "تقديم مقترح B2B" : locale === "en" ? "Submit B2B Proposal" : "Ajukan Proposal B2B"}
                </button>
              </div>
            </div>

            <div className="card-grid">
              {filteredTenders.length === 0 ? (
                <div className="empty-state-box">
                  <i className="fa-solid fa-store-slash"></i>
                  <p>{locale === "ar" ? "لا توجد مشاريع تطابق خيارات التصفية." : locale === "en" ? "No business tenders match the filters." : "Tidak ada tender bisnis yang sesuai dengan filter."}</p>
                  <button
                    type="button"
                    className="btn-toolbar-action"
                    style={{ marginTop: "15px" }}
                    onClick={() => handleOpenGeneralProposal("Tender")}
                  >
                    <i className="fa-solid fa-handshake"></i> {locale === "ar" ? "تقديم مقترح شراكة" : locale === "en" ? "Submit Partnership Proposal" : "Ajukan Proposal Kerjasama"}
                  </button>
                </div>
              ) : (
                filteredTenders.map(t => {
                  const status = getSentRequestStatus(t.id);
                  const logo = getSyndicateLogoUrl(t.logo_url, t.nama_bisnis);

                  return (
                    <div key={t.id} className="nexus-card item-card">
                      <div className="card-badge b2b">{t.kategori || "B2B"}</div>
                      <Image
                        src={logo}
                        alt={t.nama_bisnis}
                        width={84}
                        height={84}
                        className="item-img logo-img"
                        unoptimized={logo.startsWith("data:") || logo.includes("ui-avatars.com") || logo.includes("supabase.co")}
                      />
                      <h3 className="item-name">{t.nama_bisnis}</h3>
                      <div className="item-subtitle">{locale === "ar" ? "دليل مشاريع الدفعة" : locale === "en" ? "Alumni Business Directory" : "Katalog Bisnis Alumni"}</div>
                      <p className="item-desc">
                        {t.deskripsi && t.deskripsi.length > 90
                          ? t.deskripsi.substring(0, 90) + "..."
                          : t.deskripsi || "Peluang sinergi bisnis dan kemitraan antar anggota."}
                      </p>

                      <div className="card-actions">
                        <div className="card-btn-row">
                          <Link href="/syndicate" className="btn-action-view" title={locale === "ar" ? "عرض تفاصيل الدليل التجاري" : locale === "en" ? "View Business Catalog Details" : "Lihat Detail Katalog Usaha"}>
                            <i className="fa-solid fa-store"></i> {locale === "ar" ? "الدليل" : locale === "en" ? "Catalog" : "Katalog"}
                          </Link>
                          {status && (
                            <span className={`status-pill-mini status-${status}`}>
                              {status === "Pending" && <><i className="fa-solid fa-clock"></i> {locale === "ar" ? "قيد الانتظار" : locale === "en" ? "Pending" : "Menunggu"}</>}
                              {status === "Approved" && <><i className="fa-solid fa-check-double"></i> {locale === "ar" ? "معتمد" : locale === "en" ? "Approved" : "Disetujui"}</>}
                              {status === "Rejected" && <><i className="fa-solid fa-xmark"></i> {locale === "ar" ? "مرفوض" : locale === "en" ? "Rejected" : "Ditolak"}</>}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn-wax"
                          onClick={() =>
                            handleOpenProposal({
                              id: t.id,
                              name: t.nama_bisnis,
                              type: "Tender",
                              subtitle: t.kategori || "B2B Syndicate",
                              avatar: t.logo_url,
                            })
                          }
                        >
                          <div className="wax-seal">
                            <i className="fa-solid fa-handshake"></i>
                          </div>
                          <span>
                            {status === "Pending" ? (locale === "ar" ? "تعديل المقترح" : locale === "en" ? "Edit Proposal" : "Ubah Proposal") : (locale === "ar" ? "تقديم المقترح" : locale === "en" ? "Submit Proposal" : "Ajukan Proposal")}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: MATERI & ARSIP KAJIAN */}
        {/* ===================================================================== */}
        {activeTab === "materi" && (
          <div className="tab-content-section">
            <div className="materi-header-bar">
              <div>
                <h2 className="materi-section-title">{locale === "ar" ? "المنهج وأرشيف الدروس" : locale === "en" ? "Syllabus & Lecture Archive" : "Silabus & Arsip Kajian"}</h2>
                <p className="materi-section-desc">{locale === "ar" ? "مواد التزكية والمعارف الإسلامية الدورية" : locale === "en" ? "Islamic knowledge & spiritual development materials" : "Materi peningkatan tsaqafah & pengembangan spiritual berkala"}</p>
              </div>
              {currentUser.role === "admin" && (
                <button
                  type="button"
                  className="btn-add-materi"
                  onClick={() => setIsAddMateriOpen(true)}
                >
                  <i className="fa-solid fa-plus"></i> {locale === "ar" ? "إضافة مادة جديدة" : locale === "en" ? "Add New Material" : "Tambah Materi Baru"}
                </button>
              )}
            </div>

            <div className="materi-grid">
              {materiList.length === 0 ? (
                <div className="empty-state-box">
                  <i className="fa-solid fa-book-open"></i>
                  <p>{locale === "ar" ? "لم يتم نشر أي مواد علمية بعد." : locale === "en" ? "No study materials published yet." : "Belum ada materi kajian yang dipublikasikan."}</p>
                </div>
              ) : (
                materiList.map(m => (
                  <div key={m.id} className="nexus-card materi-card">
                    <div className="materi-content-left">
                      <div className="materi-meta-row">
                        <span className={`materi-status-badge ${m.status === "completed" ? "status-completed" : "status-upcoming"}`}>
                          {m.status === "completed" ? (locale === "ar" ? "مكتمل" : locale === "en" ? "Completed" : "Selesai") : (locale === "ar" ? "قادم" : locale === "en" ? "Upcoming" : "Akan Datang")}
                        </span>
                        <span className="materi-date">
                          <i className="fa-regular fa-calendar"></i> {formatDate(m.event_date)}
                        </span>
                      </div>
                      <h3 className="materi-title">{m.title}</h3>
                      <p className="materi-desc">{m.description || (locale === "ar" ? "دروس دورية لتعزيز الأخوة وتعميق البصيرة الإسلامية." : locale === "en" ? "Cohort study circle to enrich brotherhood and Islamic insight." : "Materi kajian rutin angkatan untuk mempererat ukhuwah dan memperdalam wawasan keislaman.")}</p>
                    </div>
                    <div className="materi-actions">
                      <Link href="/kontemplasi" className="btn-materi-link">
                        <i className="fa-solid fa-hands-praying"></i> {locale === "ar" ? "التأمل" : locale === "en" ? "Reflection" : "Kontemplasi"}
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: STATUS PERMOHONAN SAYA */}
        {/* ===================================================================== */}
        {activeTab === "my_requests" && (
          <div className="tab-content-section">
            <div className="section-intro">
              <h2 className="section-title">{locale === "ar" ? "الطلبات التي قدمتها" : locale === "en" ? "Requests You Have Submitted" : "Permohonan yang Telah Anda Ajukan"}</h2>
              <p className="section-desc">{locale === "ar" ? "تابع حالة الاعتماد من المرشدين أو مشاريع الأعمال." : locale === "en" ? "Track approval status from mentors or business tenders." : "Pantau status persetujuan dari mentor atau tender bisnis yang Anda hubungi."}</p>
            </div>

            <div className="requests-grid">
              {localSentRequests.length === 0 ? (
                <div className="empty-state-box">
                  <i className="fa-solid fa-envelope-open-text"></i>
                  <p>{locale === "ar" ? "لم تقدم أي طلبات إرشاد أو مقترحات بعد." : locale === "en" ? "You have not submitted any mentorship or tender requests yet." : "Anda belum mengajukan permohonan bimbingan atau proposal tender."}</p>
                </div>
              ) : (
                localSentRequests.map(r => (
                  <div key={r.id} className={`nexus-card request-card border-status-${r.status}`}>
                    <div className="req-header">
                      <div className="req-type-badge">
                        <i className={r.type === "Mentor" ? "fa-solid fa-user-graduate" : "fa-solid fa-briefcase"}></i>{" "}
                        {locale === "ar" ? (r.type === "Mentor" ? "إرشاد" : "مناقصة B2B") : r.type}
                      </div>
                      <span className={`status-pill status-${r.status}`}>
                        {r.status === "Pending" && (locale === "ar" ? "قيد انتظار الموافقة" : locale === "en" ? "Awaiting Approval" : "Menunggu Persetujuan")}
                        {r.status === "Approved" && (locale === "ar" ? "معتمد" : locale === "en" ? "Approved" : "Disetujui")}
                        {r.status === "Rejected" && (locale === "ar" ? "مرفوض" : locale === "en" ? "Rejected" : "Ditolak")}
                      </span>
                    </div>

                    <div className="req-body">
                      <h3 className="req-target-name">{r.target_name || (locale === "ar" ? "الهدف" : locale === "en" ? "Target" : "Target")}</h3>
                      <p className="req-subtitle">{r.target_subtitle || ""}</p>
                      <div className="req-date">
                        <i className="fa-regular fa-clock"></i> {locale === "ar" ? `قُدم في ${formatDate(r.created_at)}` : locale === "en" ? `Submitted on ${formatDate(r.created_at)}` : `Diajukan pada ${formatDate(r.created_at)}`}
                      </div>
                    </div>

                    {r.status === "Approved" && (
                      <div className="req-footer">
                        <Link href="/chat" className="btn-connect-chat">
                          <i className="fa-solid fa-comments"></i> {locale === "ar" ? "تواصل عبر غرفة المحادثة" : locale === "en" ? "Connect in Chat Lounge" : "Hubungi di Chat Lounge"}
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 5: PERMOHONAN MASUK (INBOX MENTOR / TENDER OWNER) */}
        {/* ===================================================================== */}
        {activeTab === "inbox" && (
          <div className="tab-content-section">
            <div className="section-intro">
              <h2 className="section-title">{locale === "ar" ? "الطلبات الواردة إليك" : locale === "en" ? "Incoming Requests for You" : "Permohonan Masuk untuk Anda"}</h2>
              <p className="section-desc">{locale === "ar" ? "مراجعة والرد على طلبات الإرشاد أو مقترحات الشراكة من زملاء الدفعة." : locale === "en" ? "Review and respond to mentorship requests or business proposals from cohort peers." : "Tinjau dan tanggapi permintaan bimbingan atau proposal kemitraan dari rekan-rekan angkatan."}</p>
            </div>

            <div className="requests-grid">
              {localIncomingRequests.length === 0 ? (
                <div className="empty-state-box">
                  <i className="fa-solid fa-inbox"></i>
                  <p>{locale === "ar" ? "لا توجد طلبات إرشاد أو مناقصات موجهة إليك بعد." : locale === "en" ? "No mentorship or tender requests directed to you yet." : "Belum ada permohonan bimbingan atau tender yang ditujukan kepada Anda."}</p>
                </div>
              ) : (
                localIncomingRequests.map(r => {
                  const avatar = getAvatarUrl(r.requester_avatar, r.requester_name || "K");

                  return (
                    <div key={r.id} className={`nexus-card incoming-card border-status-${r.status}`}>
                      <div className="req-header">
                        <div className="req-type-badge">
                          <i className={r.type === "Mentor" ? "fa-solid fa-user-graduate" : "fa-solid fa-briefcase"}></i>{" "}
                          {locale === "ar" ? (r.type === "Mentor" ? "طلب إرشاد" : "طلب مناقصة") : locale === "en" ? `${r.type} Request` : `Permohonan ${r.type}`}
                        </div>
                        <span className={`status-pill status-${r.status}`}>
                          {r.status === "Pending" && (locale === "ar" ? "في انتظار الرد" : locale === "en" ? "Awaiting Response" : "Menunggu Respon")}
                          {r.status === "Approved" && (locale === "ar" ? "معتمد" : locale === "en" ? "Approved" : "Telah Disetujui")}
                          {r.status === "Rejected" && (locale === "ar" ? "مرفوض" : locale === "en" ? "Rejected" : "Telah Ditolak")}
                        </span>
                      </div>

                      <div className="incoming-requester-info">
                        <Image
                          src={avatar}
                          alt={r.requester_name || (locale === "ar" ? "صاحب الطلب" : locale === "en" ? "Requester" : "Pemohon")}
                          width={46}
                          height={46}
                          className="requester-avatar"
                          unoptimized={avatar.startsWith("data:") || avatar.includes("ui-avatars.com") || avatar.includes("supabase.co")}
                        />
                        <div>
                          <h4 className="requester-name">{r.requester_name}</h4>
                          <span className="requester-role">{r.requester_role?.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="req-target-label">
                        {locale === "ar" ? "إلى:" : locale === "en" ? "For:" : "Untuk:"} <strong>{r.target_name}</strong>
                      </div>
                      <div className="req-date">
                        <i className="fa-regular fa-clock"></i> {locale === "ar" ? `وارد في ${formatDate(r.created_at)}` : locale === "en" ? `Received on ${formatDate(r.created_at)}` : `Masuk pada ${formatDate(r.created_at)}`}
                      </div>

                      {r.status === "Pending" ? (
                        <div className="incoming-actions">
                          <button
                            type="button"
                            className="btn-approve"
                            onClick={() => handleIncomingResponse(r.id, "Approved", r.requester_name || "Kolega")}
                          >
                            <i className="fa-solid fa-check"></i> {locale === "ar" ? "موافقة (+20 نقاط)" : locale === "en" ? "Approve (+20 Prestige)" : "Setujui (+20 Prestise)"}
                          </button>
                          <button
                            type="button"
                            className="btn-reject"
                            onClick={() => handleIncomingResponse(r.id, "Rejected", r.requester_name || "Kolega")}
                          >
                            <i className="fa-solid fa-xmark"></i> {locale === "ar" ? "رفض" : locale === "en" ? "Reject" : "Tolak"}
                          </button>
                        </div>
                      ) : (
                        <div className="req-footer">
                          {r.status === "Approved" && (
                            <Link href={`/chat/personal/${r.user_id}`} className="btn-connect-chat">
                              <i className="fa-solid fa-comments"></i> {locale === "ar" ? "فتح محادثة خاصة" : locale === "en" ? "Open Private Chat" : "Buka Percakapan Pribadi"}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: INTERACTIVE PROPOSAL MODAL (WAX SEAL) */}
      {/* ===================================================================== */}
      {isProposalModalOpen && proposalTarget && (
        <div className="tarbiyah-modal-backdrop" onClick={() => setIsProposalModalOpen(false)}>
          <div className="tarbiyah-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {proposalTarget.type === "Mentor" ? (locale === "ar" ? "طلب جلسة إرشاد" : locale === "en" ? "Apply for Mentorship" : "Ajukan Bimbingan Mentorship") : (locale === "ar" ? "تقديم مقترح شراكة" : locale === "en" ? "Submit Partnership Proposal" : "Ajukan Proposal Kerjasama")}
                </h2>
                <p className="modal-subtitle">{locale === "ar" ? "توثيق رسمي لطلب التعاون بالختم الشمعي الذهبي" : locale === "en" ? "Official collaboration proposal sealed with golden wax" : "Segel resmi permohonan kolaborasi dengan stempel lilin emas"}</p>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setIsProposalModalOpen(false)}>
                &times;
              </button>
            </div>

            {/* Target Selector / Summary */}
            <div className="form-group">
              <label>{locale === "ar" ? (proposalTarget.type === "Mentor" ? "المرشد المستهدف" : "المشروع المستهدف") : locale === "en" ? (proposalTarget.type === "Mentor" ? "TARGET MENTOR" : "TARGET BUSINESS TENDER") : `TARGET ${proposalTarget.type === "Mentor" ? "MENTOR" : "TENDER BISNIS"}`}</label>
              {proposalTarget.type === "Mentor" ? (
                <select
                  value={proposalTarget.id}
                  onChange={e => {
                    const sel = mentors.find(m => m.id === e.target.value);
                    if (sel) {
                      setProposalTarget({
                        id: sel.id,
                        name: sel.nama_panggilan || sel.nama_lengkap || "Mentor",
                        type: "Mentor",
                        subtitle: sel.pekerjaan || "Mentor Profesional",
                        avatar: sel.foto_profil,
                      });
                    }
                  }}
                >
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nama_panggilan || m.nama_lengkap} {m.pekerjaan ? `— ${m.pekerjaan}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={proposalTarget.id}
                  onChange={e => {
                    const sel = tenders.find(t => t.id === e.target.value);
                    if (sel) {
                      setProposalTarget({
                        id: sel.id,
                        name: sel.nama_bisnis,
                        type: "Tender",
                        subtitle: sel.kategori || "B2B Syndicate",
                        avatar: sel.logo_url,
                      });
                    }
                  }}
                >
                  {tenders.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nama_bisnis} {t.kategori ? `— (${t.kategori})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <form onSubmit={handleSubmitProposal} className="proposal-form">
              <div className="form-group">
                <label>{locale === "ar" ? "موضوع / عنوان الطلب" : locale === "en" ? "REQUEST TOPIC / SUBJECT" : "TOPIK / SUBJEK PERMOHONAN"}</label>
                <input
                  type="text"
                  placeholder={locale === "ar" ? "مثال: استشارة مهنية وتكامل تجاري" : locale === "en" ? "Example: Career Consultation & Business Synergy" : "Contoh: Konsultasi Karir & Sinergi Bisnis"}
                  value={proposalSubject}
                  onChange={e => setProposalSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>{locale === "ar" ? "رسالة التقديم / الخلفية" : locale === "en" ? "COVER MESSAGE / BACKGROUND" : "PESAN PENGANTAR / LATAR BELAKANG"}</label>
                <textarea
                  rows={3}
                  placeholder={locale === "ar" ? "اكتب أهداف الإرشاد أو الأسئلة أو تفاصيل المقترح التي ترغب في مشاركتها..." : locale === "en" ? "Write the mentorship goals, questions, or proposal details you wish to convey..." : "Tuliskan tujuan bimbingan, pertanyaan, atau rincian proposal yang ingin Anda sampaikan..."}
                  value={proposalMessage}
                  onChange={e => setProposalMessage(e.target.value)}
                ></textarea>
              </div>

              <div className="wax-seal-submit-area">
                <button
                  type="submit"
                  className="btn-wax-hero"
                  disabled={isSubmittingProposal}
                >
                  <div className="wax-seal-large">
                    <i className={isSubmittingProposal ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-feather-pointed"}></i>
                  </div>
                  <div className="wax-label">
                    <span className="wax-title">{isSubmittingProposal ? (locale === "ar" ? "جاري الختم والتوثيق..." : locale === "en" ? "Sealing Proposal..." : "Menyegel Permohonan...") : (locale === "ar" ? "ختم وإرسال رسمي" : locale === "en" ? "Official Seal & Submit" : "Segel & Kirim Resmi")}</span>
                    <span className="wax-sub">{locale === "ar" ? "سيتم توثيق خطاب الطلب بالختم الشمعي" : locale === "en" ? "Proposal letter will be officially sealed with wax" : "Surat permohonan akan disegel stempel lilin"}</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: ADMIN TAMBAH MATERI KAJIAN */}
      {/* ===================================================================== */}
      {isAddMateriOpen && (
        <div className="tarbiyah-modal-backdrop" onClick={() => setIsAddMateriOpen(false)}>
          <div className="tarbiyah-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{locale === "ar" ? "إضافة مادة علمية جديدة" : locale === "en" ? "Add Study Material" : "Tambah Materi Kajian"}</h2>
                <p className="modal-subtitle">{locale === "ar" ? "نشر المواعيد والمناهج الدراسية الجديدة للأعضاء" : locale === "en" ? "Publish new schedules and syllabus for members" : "Publikasikan jadwal dan silabus materi baru untuk anggota"}</p>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setIsAddMateriOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMateriSubmit} className="proposal-form">
              <div className="form-group">
                <label>{locale === "ar" ? "عنوان المادة العلمية" : locale === "en" ? "STUDY MATERIAL TITLE" : "JUDUL MATERI KAJIAN"}</label>
                <input
                  type="text"
                  placeholder={locale === "ar" ? "مثال: فقه المعاملات وأخلاقيات الأعمال الإسلامية" : locale === "en" ? "Example: Islamic Business Ethics & Transactions" : "Contoh: Fiqih Muamalah & Etika Bisnis Muslim"}
                  value={newMateriTitle}
                  onChange={e => setNewMateriTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>{locale === "ar" ? "الوصف / الخلاصة" : locale === "en" ? "DESCRIPTION / SUMMARY" : "DESKRIPSI / RANGKUMAN"}</label>
                <textarea
                  rows={3}
                  placeholder={locale === "ar" ? "ملخص محاور وموضوعات الدرس..." : locale === "en" ? "Summary of discussion points..." : "Ringkasan poin pembahasan kajian..."}
                  value={newMateriDesc}
                  onChange={e => setNewMateriDesc(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group">
                <label>{locale === "ar" ? "تاريخ الإنعقاد" : locale === "en" ? "EVENT DATE" : "TANGGAL PELAKSANAAN"}</label>
                <input
                  type="date"
                  value={newMateriDate}
                  onChange={e => setNewMateriDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>{locale === "ar" ? "حالة الدرس" : locale === "en" ? "STUDY STATUS" : "STATUS KAJIAN"}</label>
                <select
                  value={newMateriStatus}
                  onChange={e => setNewMateriStatus(e.target.value as any)}
                >
                  <option value="upcoming">{locale === "ar" ? "قادم (Upcoming)" : locale === "en" ? "Upcoming" : "Akan Datang (Upcoming)"}</option>
                  <option value="completed">{locale === "ar" ? "مكتمل (Completed)" : locale === "en" ? "Completed" : "Selesai (Completed)"}</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-submit-materi"
                disabled={isSubmittingMateri}
              >
                <i className="fa-solid fa-floppy-disk"></i>{" "}
                {isSubmittingMateri ? (locale === "ar" ? "جاري الحفظ..." : locale === "en" ? "Saving..." : "Menyimpan...") : (locale === "ar" ? "نشر المادة" : locale === "en" ? "Publish Material" : "Publikasikan Materi")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

