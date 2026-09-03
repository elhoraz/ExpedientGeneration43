"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { getAvatarUrl } from "@/lib/avatar";
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
    return new Date(dateString).toLocaleDateString("id-ID", {
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
      await showAlert("Peringatan", "Silakan pilih target mentor atau bisnis terlebih dahulu.");
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
        await showAlert("Disegel Resmi", `Permohonan ${proposalTarget.type} telah berhasil dikirimkan kepada ${proposalTarget.name}.`);
        setIsProposalModalOpen(false);
      } else {
        await showAlert("Gagal", json.message || json.error || "Gagal mengirimkan permohonan.");
      }
    } catch (err: any) {
      await showAlert("Error", "Terjadi kesalahan: " + err.message);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Handle Response on Incoming Request (Approve / Reject)
  const handleIncomingResponse = async (requestId: string, newStatus: "Approved" | "Rejected", requesterName: string) => {
    const isApproved = newStatus === "Approved";
    const confirmed = await showConfirm(
      isApproved ? "Setujui Permohonan" : "Tolak Permohonan",
      `Apakah Anda yakin ingin ${isApproved ? "menyetujui" : "menolak"} permohonan dari ${requesterName}?`
    );
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
        await showAlert("Berhasil", `Permohonan telah di-${isApproved ? "setujui (+20 Prestise)" : "tolak"}.`);
      } else {
        await showAlert("Gagal", json.message || json.error || "Gagal memperbarui status permohonan.");
      }
    } catch (err: any) {
      await showAlert("Error", "Terjadi kesalahan: " + err.message);
    }
  };

  // Submit Admin Add Materi
  const handleAddMateriSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMateriTitle.trim()) {
      await showAlert("Peringatan", "Judul materi kajian wajib diisi.");
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
        await showAlert("Berhasil", "Materi kajian baru berhasil ditambahkan.");
        setIsAddMateriOpen(false);
        setNewMateriTitle("");
        setNewMateriDesc("");
        setNewMateriDate("");
      } else {
        await showAlert("Gagal", json.message || "Gagal menambahkan materi.");
      }
    } catch (err: any) {
      await showAlert("Error", "Terjadi kesalahan: " + err.message);
    } finally {
      setIsSubmittingMateri(false);
    }
  };

  const pendingIncomingCount = localIncomingRequests.filter(r => r.status === "Pending").length;

  return (
    <div className="tarbiyah-page-wrapper">
      <div className="tarbiyah-wrapper">
        <Link href="/fitur" className="btn-back">
          <i className="fa-solid fa-arrow-left"></i> Kembali ke Vault
        </Link>

        {/* HEADER */}
        <div className="header-titles">
          <h1 className="tarbiyah-title">Tarbiyah Nexus</h1>
          <p className="tarbiyah-subtitle">Pusat Mentorship, Sinergi B2B & Pengembangan Spiritual</p>
        </div>

        {/* 5 MAIN NAVIGATION TABS */}
        <div className="nexus-tabs-bar">
          <button
            type="button"
            className={`tab-btn ${activeTab === "mentor" ? "active" : ""}`}
            onClick={() => setActiveTab("mentor")}
          >
            <i className="fa-solid fa-user-graduate"></i> Mentorship ({mentors.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "tender" ? "active" : ""}`}
            onClick={() => setActiveTab("tender")}
          >
            <i className="fa-solid fa-briefcase"></i> B2B & Tender ({tenders.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "materi" ? "active" : ""}`}
            onClick={() => setActiveTab("materi")}
          >
            <i className="fa-solid fa-book-quran"></i> Materi Kajian ({materiList.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "my_requests" ? "active" : ""}`}
            onClick={() => setActiveTab("my_requests")}
          >
            <i className="fa-solid fa-paper-plane"></i> Permohonan Saya ({localSentRequests.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "inbox" ? "active" : ""}`}
            onClick={() => setActiveTab("inbox")}
          >
            <i className="fa-solid fa-inbox"></i> Permohonan Masuk
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
                  placeholder="Cari mentor, bidang keahlian, atau motivasi..."
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
                <i className="fa-solid fa-feather-pointed"></i> Ajukan Bimbingan
              </button>
            </div>

            <div className="card-grid">
              {filteredMentors.length === 0 ? (
                <div className="empty-state-box">
                  <i className="fa-solid fa-user-slash"></i>
                  <p>Tidak ada mentor yang sesuai dengan kriteria pencarian.</p>
                  <button
                    type="button"
                    className="btn-toolbar-action"
                    style={{ marginTop: "15px" }}
                    onClick={() => handleOpenGeneralProposal("Mentor")}
                  >
                    <i className="fa-solid fa-feather-pointed"></i> Ajukan Permohonan Bimbingan Terbuka
                  </button>
                </div>
              ) : (
                filteredMentors.map(m => {
                  const status = getSentRequestStatus(m.id);
                  const avatar = getAvatarUrl(m.foto_profil, m.nama_panggilan || m.nama_lengkap || "M");
                  const displayName = m.nama_panggilan || m.nama_lengkap || "Mentor";

                  return (
                    <div key={m.id} className="nexus-card item-card">
                      <div className="card-badge">{m.role === "admin" ? "Pimpinan Sidang" : "Mentor Elite"}</div>
                      <img src={avatar} alt={displayName} className="item-img" />
                      <h3 className="item-name">{displayName}</h3>
                      <div className="item-subtitle">{m.pekerjaan || "Mentor Profesional"}</div>
                      <p className="item-desc">
                        {m.motivasi_hidup && m.motivasi_hidup.length > 85
                          ? m.motivasi_hidup.substring(0, 85) + "..."
                          : m.motivasi_hidup || "Siap membimbing dan berbagi wawasan strategis."}
                      </p>

                      <div className="card-actions">
                        <div className="card-btn-row">
                          <Link href={`/dossier/${m.id}`} className="btn-action-view" title="Lihat Dossier Lengkap">
                            <i className="fa-regular fa-id-badge"></i> Dossier
                          </Link>
                          {status && (
                            <span className={`status-pill-mini status-${status}`}>
                              {status === "Pending" && <><i className="fa-solid fa-clock"></i> Menunggu</>}
                              {status === "Approved" && <><i className="fa-solid fa-check-double"></i> Disetujui</>}
                              {status === "Rejected" && <><i className="fa-solid fa-xmark"></i> Ditolak</>}
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
                            {status === "Pending" ? "Ubah Bimbingan" : status === "Approved" ? "Ajukan Sesi Baru" : "Ajukan Bimbingan"}
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
                    {cat}
                  </button>
                ))}
              </div>

              <div className="toolbar-right-actions">
                <div className="nexus-search-box">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    type="text"
                    placeholder="Cari bisnis, tender, atau peluang..."
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
                  <i className="fa-solid fa-handshake"></i> Ajukan Proposal B2B
                </button>
              </div>
            </div>

            <div className="card-grid">
              {filteredTenders.length === 0 ? (
                <div className="empty-state-box">
                  <i className="fa-solid fa-store-slash"></i>
                  <p>Tidak ada tender bisnis yang sesuai dengan filter.</p>
                  <button
                    type="button"
                    className="btn-toolbar-action"
                    style={{ marginTop: "15px" }}
                    onClick={() => handleOpenGeneralProposal("Tender")}
                  >
                    <i className="fa-solid fa-handshake"></i> Ajukan Proposal Kerjasama
                  </button>
                </div>
              ) : (
                filteredTenders.map(t => {
                  const status = getSentRequestStatus(t.id);
                  const logo = getSyndicateLogoUrl(t.logo_url, t.nama_bisnis);

                  return (
                    <div key={t.id} className="nexus-card item-card">
                      <div className="card-badge b2b">{t.kategori || "B2B"}</div>
                      <img src={logo} alt={t.nama_bisnis} className="item-img logo-img" />
                      <h3 className="item-name">{t.nama_bisnis}</h3>
                      <div className="item-subtitle">Sovereign Syndicate</div>
                      <p className="item-desc">
                        {t.deskripsi && t.deskripsi.length > 90
                          ? t.deskripsi.substring(0, 90) + "..."
                          : t.deskripsi || "Peluang sinergi bisnis dan kemitraan antar anggota."}
                      </p>

                      <div className="card-actions">
                        <div className="card-btn-row">
                          <Link href="/syndicate" className="btn-action-view" title="Kunjungi Pasar Syndicate">
                            <i className="fa-solid fa-store"></i> Katalog
                          </Link>
                          {status && (
                            <span className={`status-pill-mini status-${status}`}>
                              {status === "Pending" && <><i className="fa-solid fa-clock"></i> Menunggu</>}
                              {status === "Approved" && <><i className="fa-solid fa-check-double"></i> Disetujui</>}
                              {status === "Rejected" && <><i className="fa-solid fa-xmark"></i> Ditolak</>}
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
                            {status === "Pending" ? "Ubah Proposal" : "Ajukan Proposal"}
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
                <h2 className="materi-section-title">Silabus & Arsip Kajian</h2>
                <p className="materi-section-desc">Materi peningkatan tsaqafah & pengembangan spiritual berkala</p>
              </div>
              {currentUser.role === "admin" && (
                <button
                  type="button"
                  className="btn-add-materi"
                  onClick={() => setIsAddMateriOpen(true)}
                >
                  <i className="fa-solid fa-plus"></i> Tambah Materi Baru
                </button>
              )}
            </div>

            <div className="materi-grid">
              {materiList.length === 0 ? (
                <div className="empty-state-box">
                  <i className="fa-solid fa-book-open"></i>
                  <p>Belum ada materi kajian yang dipublikasikan.</p>
                </div>
              ) : (
                materiList.map(m => (
                  <div key={m.id} className="nexus-card materi-card">
                    <div className="materi-content-left">
                      <div className="materi-meta-row">
                        <span className={`materi-status-badge ${m.status === "completed" ? "status-completed" : "status-upcoming"}`}>
                          {m.status === "completed" ? "Selesai" : "Akan Datang"}
                        </span>
                        <span className="materi-date">
                          <i className="fa-regular fa-calendar"></i> {formatDate(m.event_date)}
                        </span>
                      </div>
                      <h3 className="materi-title">{m.title}</h3>
                      <p className="materi-desc">{m.description || "Materi kajian rutin angkatan untuk mempererat ukhuwah dan memperdalam wawasan keislaman."}</p>
                    </div>
                    <div className="materi-actions">
                      <Link href="/kontemplasi" className="btn-materi-link">
                        <i className="fa-solid fa-hands-praying"></i> Kontemplasi
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
              <h2 className="section-title">Permohonan yang Telah Anda Ajukan</h2>
              <p className="section-desc">Pantau status persetujuan dari mentor atau tender bisnis yang Anda hubungi.</p>
            </div>

            <div className="requests-grid">
              {localSentRequests.length === 0 ? (
                <div className="empty-state-box">
                  <i className="fa-solid fa-envelope-open-text"></i>
                  <p>Anda belum mengajukan permohonan bimbingan atau proposal tender.</p>
                </div>
              ) : (
                localSentRequests.map(r => (
                  <div key={r.id} className={`nexus-card request-card border-status-${r.status}`}>
                    <div className="req-header">
                      <div className="req-type-badge">
                        <i className={r.type === "Mentor" ? "fa-solid fa-user-graduate" : "fa-solid fa-briefcase"}></i>{" "}
                        {r.type}
                      </div>
                      <span className={`status-pill status-${r.status}`}>
                        {r.status === "Pending" && "Menunggu Persetujuan"}
                        {r.status === "Approved" && "Disetujui"}
                        {r.status === "Rejected" && "Ditolak"}
                      </span>
                    </div>

                    <div className="req-body">
                      <h3 className="req-target-name">{r.target_name || "Target"}</h3>
                      <p className="req-subtitle">{r.target_subtitle || ""}</p>
                      <div className="req-date">
                        <i className="fa-regular fa-clock"></i> Diajukan pada {formatDate(r.created_at)}
                      </div>
                    </div>

                    {r.status === "Approved" && (
                      <div className="req-footer">
                        <Link href="/chat" className="btn-connect-chat">
                          <i className="fa-solid fa-comments"></i> Hubungi di Chat Lounge
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
              <h2 className="section-title">Permohonan Masuk untuk Anda</h2>
              <p className="section-desc">Tinjau dan tanggapi permintaan bimbingan atau proposal kemitraan dari rekan-rekan angkatan.</p>
            </div>

            <div className="requests-grid">
              {localIncomingRequests.length === 0 ? (
                <div className="empty-state-box">
                  <i className="fa-solid fa-inbox"></i>
                  <p>Belum ada permohonan bimbingan atau tender yang ditujukan kepada Anda.</p>
                </div>
              ) : (
                localIncomingRequests.map(r => {
                  const avatar = getAvatarUrl(r.requester_avatar, r.requester_name || "K");

                  return (
                    <div key={r.id} className={`nexus-card incoming-card border-status-${r.status}`}>
                      <div className="req-header">
                        <div className="req-type-badge">
                          <i className={r.type === "Mentor" ? "fa-solid fa-user-graduate" : "fa-solid fa-briefcase"}></i>{" "}
                          Permohonan {r.type}
                        </div>
                        <span className={`status-pill status-${r.status}`}>
                          {r.status === "Pending" && "Menunggu Respon"}
                          {r.status === "Approved" && "Telah Disetujui"}
                          {r.status === "Rejected" && "Telah Ditolak"}
                        </span>
                      </div>

                      <div className="incoming-requester-info">
                        <img src={avatar} alt={r.requester_name} className="requester-avatar" />
                        <div>
                          <h4 className="requester-name">{r.requester_name}</h4>
                          <span className="requester-role">{r.requester_role?.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="req-target-label">
                        Untuk: <strong>{r.target_name}</strong>
                      </div>
                      <div className="req-date">
                        <i className="fa-regular fa-clock"></i> Masuk pada {formatDate(r.created_at)}
                      </div>

                      {r.status === "Pending" ? (
                        <div className="incoming-actions">
                          <button
                            type="button"
                            className="btn-approve"
                            onClick={() => handleIncomingResponse(r.id, "Approved", r.requester_name || "Kolega")}
                          >
                            <i className="fa-solid fa-check"></i> Setujui (+20 Prestise)
                          </button>
                          <button
                            type="button"
                            className="btn-reject"
                            onClick={() => handleIncomingResponse(r.id, "Rejected", r.requester_name || "Kolega")}
                          >
                            <i className="fa-solid fa-xmark"></i> Tolak
                          </button>
                        </div>
                      ) : (
                        <div className="req-footer">
                          {r.status === "Approved" && (
                            <Link href={`/chat/personal/${r.user_id}`} className="btn-connect-chat">
                              <i className="fa-solid fa-comments"></i> Buka Percakapan Pribadi
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
                  {proposalTarget.type === "Mentor" ? "Ajukan Bimbingan Mentorship" : "Ajukan Proposal Kerjasama"}
                </h2>
                <p className="modal-subtitle">Segel resmi permohonan kolaborasi dengan stempel lilin emas</p>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setIsProposalModalOpen(false)}>
                &times;
              </button>
            </div>

            {/* Target Selector / Summary */}
            <div className="form-group">
              <label>TARGET {proposalTarget.type === "Mentor" ? "MENTOR" : "TENDER BISNIS"}</label>
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
                <label>TOPIK / SUBJEK PERMOHONAN</label>
                <input
                  type="text"
                  placeholder="Contoh: Konsultasi Karir & Sinergi Bisnis"
                  value={proposalSubject}
                  onChange={e => setProposalSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>PESAN PENGANTAR / LATAR BELAKANG</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan tujuan bimbingan, pertanyaan, atau rincian proposal yang ingin Anda sampaikan..."
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
                    <span className="wax-title">{isSubmittingProposal ? "Menyegel Permohonan..." : "Segel & Kirim Resmi"}</span>
                    <span className="wax-sub">Surat permohonan akan disegel stempel lilin</span>
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
                <h2 className="modal-title">Tambah Materi Kajian</h2>
                <p className="modal-subtitle">Publikasikan jadwal dan silabus materi baru untuk anggota</p>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setIsAddMateriOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMateriSubmit} className="proposal-form">
              <div className="form-group">
                <label>JUDUL MATERI KAJIAN</label>
                <input
                  type="text"
                  placeholder="Contoh: Fiqih Muamalah & Etika Bisnis Muslim"
                  value={newMateriTitle}
                  onChange={e => setNewMateriTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>DESKRIPSI / RANGKUMAN</label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan poin pembahasan kajian..."
                  value={newMateriDesc}
                  onChange={e => setNewMateriDesc(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group">
                <label>TANGGAL PELAKSANAAN</label>
                <input
                  type="date"
                  value={newMateriDate}
                  onChange={e => setNewMateriDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>STATUS KAJIAN</label>
                <select
                  value={newMateriStatus}
                  onChange={e => setNewMateriStatus(e.target.value as any)}
                >
                  <option value="upcoming">Akan Datang (Upcoming)</option>
                  <option value="completed">Selesai (Completed)</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-submit-materi"
                disabled={isSubmittingMateri}
              >
                <i className="fa-solid fa-floppy-disk"></i>{" "}
                {isSubmittingMateri ? "Menyimpan..." : "Publikasikan Materi"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

