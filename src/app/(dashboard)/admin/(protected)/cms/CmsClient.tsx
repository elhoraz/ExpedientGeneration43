"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveCmsChanges, saveGalleryItem, deleteGalleryItem, uploadImageToStorage } from "./actions";
import { useConfirm } from "@/components/layout/AegisConfirm";
import Link from "next/link";
import AdminLockBtn from "../../AdminLockBtn";

type SiteContent = {
  id: string;
  content_key: string;
  content_value: string;
  content_type: string;
};

type GaleriItem = {
  id: string;
  image_url: string;
  caption: string;
};

type DraftUpdate = { [id: string]: string };
type DraftNewKey = { key: string; type: string; value: string };

// Kategori Halaman Sistem CMS
const PAGE_CONFIG: { [prefix: string]: { label: string; icon: string; desc: string } } = {
  landing: { label: "Landing Page", icon: "fa-solid fa-house", desc: "Hero, Narasi Utama, & Tentang Kami" },
  beranda: { label: "Beranda Museum", icon: "fa-solid fa-landmark", desc: "Lore, Shard, & Jiwa Pondok" },
  fitur: { label: "Fitur Hub", icon: "fa-solid fa-compass", desc: "Portal Fitur & Menu Navigasi" },
  direktori: { label: "Direktori Alumni", icon: "fa-solid fa-address-book", desc: "Pencarian & Profil Alumni" },
  galeri: { label: "Galeri Museum 3D", icon: "fa-solid fa-images", desc: "Foto & Arsip Museum Interaktif" },
  sovereign: { label: "Sovereign ID", icon: "fa-solid fa-id-card", desc: "Kartu VVIP 5D" },
  tarbiyah: { label: "Tarbiyah Nexus", icon: "fa-solid fa-book-quran", desc: "Kajian, Mentor, & Tender" },
  majlis: { label: "Majlis Forum", icon: "fa-solid fa-users", desc: "Diskusi & Voice Stage" },
  kontemplasi: { label: "Kontemplasi", icon: "fa-solid fa-spa", desc: "Binaural Beats & Jurnal" },
  multazam: { label: "Multazam Doa", icon: "fa-solid fa-kaaba", desc: "Dinding Doa 3D" },
  wasiat: { label: "Wasiat Vault", icon: "fa-solid fa-shield-halved", desc: "Pesan Terenkripsi AES" },
  oracle: { label: "Oracle Vision", icon: "fa-solid fa-eye", desc: "Kapsul Waktu & Visi" },
  enigma: { label: "Enigma Vault", icon: "fa-solid fa-puzzle-piece", desc: "Teka-teki & Puzzle" },
  celestial: { label: "Celestial Codex", icon: "fa-solid fa-star", desc: "Modul Spiritual" },
  divine: { label: "Divine Aegis", icon: "fa-solid fa-sun", desc: "Modul Protection" },
  baitulmaal: { label: "Baitul Maal", icon: "fa-solid fa-hand-holding-dollar", desc: "Kas & Laporan Keuangan" },
  site: { label: "Pengaturan & SEO", icon: "fa-solid fa-sliders", desc: "Pengaturan Situs & Meta" },
  footer: { label: "Footer & Legas", icon: "fa-solid fa-copyright", desc: "Teks Hak Cipta & Catatan Kaki" },
  home: { label: "Beranda Utama", icon: "fa-solid fa-globe", desc: "Kunci Beranda Legacy" },
  general: { label: "Umum & Global", icon: "fa-solid fa-gear", desc: "String Global Situs" },
};

export default function CmsClient({ 
  initialContents, 
  initialGaleri 
}: { 
  initialContents: SiteContent[],
  initialGaleri: GaleriItem[]
}) {
  const [contents, setContents] = useState<SiteContent[]>(initialContents);
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // State for Drafts
  const [draftUpdates, setDraftUpdates] = useState<DraftUpdate>({});
  const [draftDeletions, setDraftDeletions] = useState<string[]>([]);
  const [newKeys, setNewKeys] = useState<DraftNewKey[]>([]);

  // Modals state (CMS)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showPreviewHtml, setShowPreviewHtml] = useState(false);
  
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKeyPrefix, setNewKeyPrefix] = useState("");
  const [newKeySuffix, setNewKeySuffix] = useState("");
  const [newKeyType, setNewKeyType] = useState("text");
  const [newKeyValue, setNewKeyValue] = useState("");

  // Modals state (Galeri)
  const [isEditingGaleri, setIsEditingGaleri] = useState(false);
  const [galeriId, setGaleriId] = useState<string | null>(null);
  const [galeriUrl, setGaleriUrl] = useState("");
  const [galeriCaption, setGaleriCaption] = useState("");
  const [galeriFilePreview, setGaleriFilePreview] = useState<string>("");
  const [galeriFile, setGaleriFile] = useState<File | null>(null);
  
  // Image upload for CMS string edit modal
  const [cmsEditFile, setCmsEditFile] = useState<File | null>(null);
  const [cmsEditFilePreview, setCmsEditFilePreview] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useConfirm();

  // Group contents by prefix and search query
  const { groupedContents, prefixes, totalFilteredCount } = useMemo(() => {
    const groups: { [prefix: string]: SiteContent[] } = {};
    const allItems = [...contents].filter(item => !item.content_key.startsWith('beranda_gallery'));
    
    newKeys.forEach((nk, i) => {
      allItems.push({
        id: `new_${i}`,
        content_key: nk.key,
        content_value: nk.value,
        content_type: nk.type
      });
    });

    let totalFiltered = 0;
    const query = searchQuery.trim().toLowerCase();

    allItems.forEach(item => {
      const isDeleted = draftDeletions.includes(item.id);
      if (isDeleted) return;

      const currentValue = draftUpdates[item.id] !== undefined ? draftUpdates[item.id] : item.content_value;
      const matchesSearch = !query || 
        item.content_key.toLowerCase().includes(query) || 
        currentValue.toLowerCase().includes(query);

      if (!matchesSearch) return;

      const rawPrefix = item.content_key.split('_')[0] || 'general';
      const prefix = PAGE_CONFIG[rawPrefix] ? rawPrefix : 'general';

      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(item);
      totalFiltered++;
    });

    // Ensure all defined page categories appear in prefixes if they exist or are configured
    const definedPrefixes = Object.keys(PAGE_CONFIG).filter(p => p === 'galeri' || (groups[p] && groups[p].length > 0));
    // Add any dynamically discovered prefixes
    Object.keys(groups).forEach(p => {
      if (!definedPrefixes.includes(p)) definedPrefixes.push(p);
    });

    return { 
      groupedContents: groups, 
      prefixes: definedPrefixes.sort(), 
      totalFilteredCount: totalFiltered 
    };
  }, [contents, newKeys, draftDeletions, draftUpdates, searchQuery]);

  // Set default tab if activeTab is empty
  if (activeTab === "" && prefixes.length > 0) {
    setActiveTab(prefixes[0]);
  }

  // Sub-section helper for items inside a page
  const getSubSection = (key: string, type: string) => {
    const k = key.toLowerCase();
    if (k.includes('hero') || k.includes('title') || k.includes('eyebrow') || k.includes('welcome') || k.includes('subtitle')) {
      return { id: 'hero', name: '🎯 Header & Hero Section', icon: 'fa-solid fa-bullhorn' };
    }
    if (k.includes('about') || k.includes('lore') || k.includes('shard') || k.includes('desc') || k.includes('text') || k.includes('jiwa') || k.includes('archive')) {
      return { id: 'main', name: '📝 Konten & Deskripsi Utama', icon: 'fa-solid fa-align-left' };
    }
    if (type === 'image' || k.includes('img') || k.includes('image') || k.includes('logo') || k.includes('card') || k.includes('photo') || k.includes('feat')) {
      return { id: 'media', name: '🖼️ Media, Gambar & Visual', icon: 'fa-solid fa-photo-film' };
    }
    if (k.includes('btn') || k.includes('label') || k.includes('ui') || k.includes('footer') || k.includes('stat') || k.includes('copyright')) {
      return { id: 'ui', name: '🔘 Label UI & Tombol Navigasi', icon: 'fa-solid fa-sliders' };
    }
    return { id: 'other', name: '📁 Modul Konten Tambahan', icon: 'fa-solid fa-folder-open' };
  };

  // --- CMS Logic ---
  const handleOpenEdit = (c: SiteContent) => {
    setEditingId(c.id);
    setEditValue(draftUpdates[c.id] !== undefined ? draftUpdates[c.id] : c.content_value);
    setShowPreviewHtml(false);
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setDraftUpdates(prev => ({ ...prev, [editingId]: editValue }));
      setEditingId(null);
    }
  };

  const handleMarkDelete = (id: string) => {
    if (!confirm("Tandai kunci konten ini untuk dihapus dari database?")) return;
    setDraftDeletions(prev => [...prev, id]);
  };

  const handleOpenAddKey = (prefix: string) => {
    setNewKeyPrefix(prefix + "_");
    setNewKeySuffix("");
    setNewKeyValue("");
    setNewKeyType("text");
    setIsAddingKey(true);
  };

  const handleSaveNewKey = (e: React.FormEvent) => {
    e.preventDefault();
    const keyName = newKeyPrefix + newKeySuffix;
    setNewKeys(prev => [...prev, { key: keyName, type: newKeyType, value: newKeyValue }]);
    setIsAddingKey(false);
  };

  const handleBatchSave = async () => {
    setLoading(true);
    try {
      let finalContents = [...contents];
      finalContents = finalContents.map(c => {
        if (draftUpdates[c.id] !== undefined) {
          return { ...c, content_value: draftUpdates[c.id] };
        }
        return c;
      });
      finalContents = finalContents.filter(c => !draftDeletions.includes(c.id));
      newKeys.forEach((nk, i) => {
        finalContents.push({
          id: `new_temp_${Date.now()}_${i}`,
          content_key: nk.key,
          content_value: nk.value,
          content_type: nk.type
        });
      });

      await saveCmsChanges(finalContents);
      await showAlert("Berhasil", "Semua perubahan CMS per-halaman berhasil disimpan permanen ke database.");
      
      setDraftUpdates({});
      setDraftDeletions([]);
      setNewKeys([]);
      router.refresh();
      
    } catch (e: any) {
      await showAlert("Gagal", "Terjadi kesalahan saat menyimpan CMS: " + (e?.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  // --- Galeri Logic ---
  const handleOpenGaleriAdd = () => {
    setGaleriId(null);
    setGaleriUrl("");
    setGaleriCaption("");
    setGaleriFile(null);
    setGaleriFilePreview("");
    setIsEditingGaleri(true);
  };

  const handleOpenGaleriEdit = (g: GaleriItem) => {
    setGaleriId(g.id);
    setGaleriUrl(g.image_url);
    setGaleriCaption(g.caption || "");
    setGaleriFile(null);
    setGaleriFilePreview(g.image_url);
    setIsEditingGaleri(true);
  };

  const handleGaleriFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGaleriFile(file);
    setGaleriFilePreview(URL.createObjectURL(file));
    setGaleriUrl('');
  };

  const handleSaveGaleri = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalUrl = galeriUrl;
      if (galeriFile) {
        const fd = new FormData();
        fd.append('file', galeriFile);
        finalUrl = await uploadImageToStorage(fd, 'cms-assets', 'gallery');
      }
      if (!finalUrl) throw new Error('URL gambar tidak boleh kosong');
      await saveGalleryItem(galeriId, finalUrl, galeriCaption);
      await showAlert("Berhasil", "Gambar galeri berhasil disimpan.");
      setIsEditingGaleri(false);
      router.refresh();
    } catch (err: any) {
      await showAlert("Gagal", err?.message || "Terjadi kesalahan saat menyimpan gambar galeri.");
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload for CMS image-type field edit
  const handleCmsEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCmsEditFile(file);
    setCmsEditFilePreview(URL.createObjectURL(file));
  };

  const handleCmsImageUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalUrl = editValue;
      if (cmsEditFile) {
        const fd = new FormData();
        fd.append('file', cmsEditFile);
        finalUrl = await uploadImageToStorage(fd, 'cms-assets', 'cms');
        setEditValue(finalUrl);
      }
      if (editingId) {
        setDraftUpdates(prev => ({ ...prev, [editingId]: finalUrl }));
      }
      setCmsEditFile(null);
      setCmsEditFilePreview('');
      setEditingId(null);
    } catch (err: any) {
      await showAlert('Gagal Upload', err?.message || 'Gagal mengunggah gambar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGaleri = async (id: string) => {
    if (!confirm("Hapus gambar ini dari galeri museum?")) return;
    setLoading(true);
    try {
      await deleteGalleryItem(id);
      await showAlert("Berhasil", "Gambar galeri berhasil dihapus.");
      router.refresh();
    } catch {
      await showAlert("Gagal", "Gagal menghapus gambar.");
    } finally {
      setLoading(false);
    }
  };

  const totalChanges = Object.keys(draftUpdates).length + draftDeletions.length + newKeys.length;
  const currentTabConfig = PAGE_CONFIG[activeTab] || { label: activeTab, icon: "fa-solid fa-folder", desc: "Modul Konten" };
  const currentTabContents = groupedContents[activeTab] || [];

  // Group current tab contents into sub-sections
  const subSectionGroups = useMemo(() => {
    const subMap: { [id: string]: { name: string; icon: string; items: SiteContent[] } } = {};
    currentTabContents.forEach(c => {
      const sub = getSubSection(c.content_key, c.content_type);
      if (!subMap[sub.id]) {
        subMap[sub.id] = { name: sub.name, icon: sub.icon, items: [] };
      }
      subMap[sub.id].items.push(c);
    });
    return subMap;
  }, [currentTabContents]);

  return (
    <div style={{ paddingBottom: "100px" }}>
      {/* HEADER CMS */}
      <div className="admin-header" style={{ position: "relative" , paddingRight: "160px", marginBottom: "25px" }}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", color: "var(--gold-premium, #d4af37)" }}>
            <i className="fa-solid fa-sliders"></i>
          </div>
          <div>
            <h1 className="cms-title" style={{ margin: 0, fontSize: "1.6rem" }}>Manajemen CMS Per Halaman</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "3px 0 0 0", letterSpacing: "0.5px" }}>
              Kelola teks, narasi HTML, gambar banner, dan konten setiap halaman aplikasi secara terstruktur
            </p>
          </div>
        </div>

        <nav className="admin-nav" style={{ marginTop: "18px" }}>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/moderation">Moderasi</Link>
          <Link href="/admin/cms" className="active">CMS Per Halaman</Link>
        </nav>
      </div>

      {/* SEARCH BAR & SUMMARY */}
      <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "16px", padding: "16px 20px", marginBottom: "25px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 300px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", borderRadius: "10px", padding: "8px 14px" }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--gold-premium, #d4af37)", fontSize: "0.9rem" }}></i>
          <input 
            type="text" 
            placeholder="Cari kata kunci (misal: hero, title, logo, kata kunci)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.8rem" }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "12px" }}>
          <span>Total Kunci CMS: <strong style={{ color: "var(--gold-premium, #d4af37)" }}>{contents.length}</strong></span>
          <span>Ditemukan: <strong style={{ color: "#00ff88" }}>{totalFilteredCount}</strong></span>
        </div>
      </div>

      {/* TAB NAVIGASI HALAMAN (PER PAGE) */}
      <div className="cms-tabs" style={{ scrollBehavior: 'smooth', gap: "8px", flexWrap: "wrap", paddingBottom: "10px" }}>
        {prefixes.map((prefix) => {
          const cfg = PAGE_CONFIG[prefix] || { label: prefix, icon: "fa-solid fa-folder", desc: "" };
          const count = (groupedContents[prefix] || []).length;
          return (
            <button 
              key={prefix} 
              className={`cms-tab-btn ${activeTab === prefix ? 'active' : ''}`}
              onClick={() => setActiveTab(prefix)}
              style={{ flexShrink: 0, padding: "10px 16px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.82rem" }}
            >
              <i className={cfg.icon} style={{ color: activeTab === prefix ? "#000" : "var(--gold-premium, #d4af37)" }}></i>
              <span>{cfg.label}</span>
              <span style={{ fontSize: "0.68rem", opacity: 0.8, background: activeTab === prefix ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "10px" }}>
                {count}
              </span>
            </button>
          );
        })}

        {/* TAB KHUSUS GALERI MUSEUM */}
        <button 
          className={`cms-tab-btn ${activeTab === 'galeri' ? 'active' : ''}`}
          onClick={() => setActiveTab('galeri')}
          style={{ flexShrink: 0, padding: "10px 16px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.82rem" }}
        >
          <i className="fa-solid fa-images" style={{ color: activeTab === 'galeri' ? "#000" : "#00ff88" }}></i>
          <span>Galeri Museum 3D</span>
          <span style={{ fontSize: "0.68rem", opacity: 0.8, background: activeTab === 'galeri' ? "rgba(0,0,0,0.2)" : "rgba(0,255,136,0.2)", padding: "2px 6px", borderRadius: "10px" }}>
            {initialGaleri.length}
          </span>
        </button>
      </div>

      {/* HEADER HALAMAN AKTIF */}
      {activeTab !== 'galeri' && (
        <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "16px", padding: "18px 24px", margin: "20px 0", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--gold-premium, #d4af37)", display: "flex", alignItems: "center", gap: "10px" }}>
              <i className={currentTabConfig.icon}></i> {currentTabConfig.label}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              {currentTabConfig.desc} · Kunci Prefix: <code style={{ color: "var(--gold-premium, #d4af37)" }}>{activeTab}_*</code>
            </p>
          </div>
          <button className="btn-add hover-trigger" onClick={() => handleOpenAddKey(activeTab)} style={{ margin: 0 }}>
            <i className="fa-solid fa-plus" style={{ marginRight: "6px" }}></i> Tambah Kunci Konten {currentTabConfig.label}
          </button>
        </div>
      )}

      {/* CMS CONTENT PANEL PER PAGE */}
      <div className="cms-panel">
        {activeTab !== 'galeri' && (
          <div>
            {Object.keys(subSectionGroups).length === 0 ? (
              <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "16px", padding: "40px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: "2rem", marginBottom: "12px", display: "block", opacity: 0.4 }}></i>
                Belum ada kunci konten untuk halaman <strong>{currentTabConfig.label}</strong>. Klik tombol <strong>"Tambah Kunci Konten"</strong> untuk membuat baru.
              </div>
            ) : (
              Object.keys(subSectionGroups).map(subId => {
                const sub = subSectionGroups[subId];
                return (
                  <div key={subId} style={{ marginBottom: "35px" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "8px" }}>
                      <span>{sub.name}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 400 }}>({sub.items.length} item)</span>
                    </h3>

                    {/* DESKTOP TABLE */}
                    <div className="cms-table-wrapper">
                      <table className="cms-table">
                        <thead>
                          <tr>
                            <th style={{ width: "25%" }}>Key Name (Identifier)</th>
                            <th style={{ width: "12%" }}>Format</th>
                            <th style={{ width: "48%" }}>Nilai Konten</th>
                            <th style={{ width: "15%", textAlign: "center" }}>Tindakan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sub.items.map((c) => {
                            const isDrafted = draftUpdates[c.id] !== undefined;
                            const isNew = c.id.startsWith("new_");
                            const displayValue = isDrafted ? draftUpdates[c.id] : c.content_value;

                            return (
                              <tr key={c.id} style={{ background: isDrafted || isNew ? 'rgba(0, 255, 136, 0.05)' : 'transparent' }}>
                                <td>
                                  <span className="key-badge" style={{ fontSize: "0.78rem" }}>{c.content_key}</span>
                                  {(isDrafted || isNew) && <span style={{ fontSize: "0.6rem", color: "#00ff88", marginLeft: "6px", fontWeight: 700 }}>*DRAFT</span>}
                                </td>
                                <td>
                                  {c.content_type === "image" ? (
                                    <span className="type-badge type-image"><i className="fa-solid fa-image"></i> Gambar</span>
                                  ) : c.content_type === "html" ? (
                                    <span className="type-badge type-html"><i className="fa-solid fa-code"></i> HTML</span>
                                  ) : (
                                    <span className="type-badge type-text"><i className="fa-solid fa-font"></i> Teks</span>
                                  )}
                                </td>
                                <td>
                                  {c.content_type === "image" ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                      <img src={displayValue} className="content-preview-img" alt="Preview" style={{ width: "60px", height: "40px", objectFit: "cover", borderRadius: "6px" }} />
                                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>{displayValue}</div>
                                    </div>
                                  ) : (
                                    <div className="content-preview-text" style={{ fontSize: "0.8rem", maxHeight: "60px", overflow: "hidden" }}>{displayValue}</div>
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                    <button type="button" className="btn-edit hover-trigger" onClick={() => handleOpenEdit(c)} style={{ padding: "6px 12px", fontSize: "0.75rem" }}>
                                      <i className="fa-solid fa-pen-to-square"></i> Edit
                                    </button>
                                    <button type="button" className="btn-danger hover-trigger" onClick={() => handleMarkDelete(c.id)} style={{ padding: "6px 10px", fontSize: "0.75rem" }}>
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE CARDS VIEW */}
                    <div className="cms-mobile-card-list">
                      {sub.items.map((c) => {
                        const isDrafted = draftUpdates[c.id] !== undefined;
                        const isNew = c.id.startsWith("new_");
                        const displayValue = isDrafted ? draftUpdates[c.id] : c.content_value;

                        return (
                          <div key={c.id} className={`cms-mobile-card ${isDrafted || isNew ? 'draft-modified' : ''}`}>
                            <div className="cms-mobile-card-header">
                              <span className="key-badge" style={{ fontSize: "0.76rem", wordBreak: "break-all" }}>{c.content_key}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {c.content_type === "image" ? (
                                  <span className="type-badge type-image"><i className="fa-solid fa-image"></i> Gambar</span>
                                ) : c.content_type === "html" ? (
                                  <span className="type-badge type-html"><i className="fa-solid fa-code"></i> HTML</span>
                                ) : (
                                  <span className="type-badge type-text"><i className="fa-solid fa-font"></i> Teks</span>
                                )}
                                {(isDrafted || isNew) && <span style={{ fontSize: "0.62rem", color: "#00ff88", fontWeight: 700 }}>*DRAFT</span>}
                              </div>
                            </div>
                            <div className="cms-mobile-card-body">
                              {c.content_type === "image" ? (
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                  <img src={displayValue} alt="Preview" style={{ width: "64px", height: "45px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--glass-border)", background: "#000" }} />
                                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>{displayValue}</div>
                                </div>
                              ) : (
                                <div className="content-preview-text" style={{ fontSize: "0.82rem", maxHeight: "80px", overflow: "hidden", lineHeight: 1.4 }}>
                                  {displayValue}
                                </div>
                              )}
                            </div>
                            <div className="cms-mobile-card-actions">
                              <button type="button" className="btn-edit hover-trigger" onClick={() => handleOpenEdit(c)} style={{ padding: "8px 14px", fontSize: "0.78rem", justifyContent: "center" }}>
                                <i className="fa-solid fa-pen-to-square"></i> Edit
                              </button>
                              <button type="button" className="btn-danger hover-trigger" onClick={() => handleMarkDelete(c.id)} style={{ padding: "8px 12px", fontSize: "0.78rem" }}>
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* GALERI TAB CONTENT */}
        {activeTab === 'galeri' && (
          <div>
            <div style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "16px", padding: "18px 24px", marginBottom: "20px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#00ff88", display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-images"></i> Galeri Museum 3D
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  Kelola foto kenangan dan arsip visual angkatan yang ditampilkan pada galeri 3D museum
                </p>
              </div>
              <button className="btn-add hover-trigger" onClick={handleOpenGaleriAdd} style={{ margin: 0, background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88" }}>
                <i className="fa-solid fa-plus" style={{ marginRight: "6px" }}></i> Tambah Gambar Galeri Baru
              </button>
            </div>

            {/* DESKTOP GALERI TABLE */}
            <div className="cms-table-wrapper">
              <table className="cms-table">
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>Foto Museum</th>
                    <th style={{ width: "55%" }}>Keterangan / Caption</th>
                    <th style={{ width: "20%", textAlign: "center" }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {initialGaleri.map(g => (
                    <tr key={g.id}>
                      <td>
                        <img src={g.image_url} className="content-preview-img" alt="Gallery item" style={{ height: "80px", width: "120px", objectFit: "cover", borderRadius: "8px" }} />
                      </td>
                      <td>
                        <div className="content-preview-text" style={{ fontSize: "0.85rem", fontWeight: 500 }}>{g.caption || "Tanpa Keterangan"}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "4px", wordBreak: "break-all" }}>{g.image_url}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button type="button" className="btn-edit hover-trigger" onClick={() => handleOpenGaleriEdit(g)} style={{ padding: "6px 12px", fontSize: "0.75rem" }}>
                            <i className="fa-solid fa-pen-to-square"></i> Edit
                          </button>
                          <button type="button" className="btn-danger hover-trigger" onClick={() => handleDeleteGaleri(g.id)} style={{ padding: "6px 10px", fontSize: "0.75rem" }}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {initialGaleri.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty-state">Belum ada foto kenangan di galeri museum 3D.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE GALERI CARDS */}
            <div className="cms-mobile-card-list">
              {initialGaleri.map(g => (
                <div key={g.id} className="cms-mobile-card">
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <img src={g.image_url} alt="Gallery item" style={{ width: "90px", height: "70px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--glass-border)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{g.caption || "Tanpa Keterangan"}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>{g.image_url}</div>
                    </div>
                  </div>
                  <div className="cms-mobile-card-actions">
                    <button type="button" className="btn-edit hover-trigger" onClick={() => handleOpenGaleriEdit(g)} style={{ padding: "8px 14px", fontSize: "0.78rem", justifyContent: "center" }}>
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button type="button" className="btn-danger hover-trigger" onClick={() => handleDeleteGaleri(g.id)} style={{ padding: "8px 12px", fontSize: "0.78rem" }}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              {initialGaleri.length === 0 && (
                <div className="empty-state">Belum ada foto kenangan di galeri museum 3D.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDIT KONTEN CMS */}
      {editingId && (() => {
        const editingItem = contents.find(c => c.id === editingId);
        const isImageType = editingItem?.content_type === 'image';
        const isHtmlType = editingItem?.content_type === 'html';

        return (
          <div className="cms-modal-overlay active">
            <div className="cms-modal" style={{ maxWidth: "650px" }}>
              <button type="button" className="modal-close" onClick={() => { setEditingId(null); setCmsEditFile(null); setCmsEditFilePreview(''); }}><i className="fa-solid fa-xmark"></i></button>
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                <span className="key-badge" style={{ fontSize: "0.85rem" }}>{editingItem?.content_key}</span>
                {isHtmlType && <span className="type-badge type-html">Format HTML</span>}
                {isImageType && <span className="type-badge type-image">Format Gambar</span>}
              </div>

              <form onSubmit={isImageType ? handleCmsImageUploadAndSave : handleSaveDraft}>
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      {isImageType ? 'Pilih Gambar dari Perangkat atau Isi URL' : 'Nilai Modifikasi Konten'}
                    </label>
                    {isHtmlType && (
                      <button 
                        type="button" 
                        onClick={() => setShowPreviewHtml(!showPreviewHtml)} 
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--glass-border)", color: "var(--gold-premium, #d4af37)", padding: "3px 10px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer" }}
                      >
                        <i className={`fa-solid ${showPreviewHtml ? 'fa-code' : 'fa-eye'}`} style={{ marginRight: "4px" }}></i>
                        {showPreviewHtml ? 'Mode Code' : 'Preview HTML'}
                      </button>
                    )}
                  </div>

                  {isImageType ? (
                    <>
                      <label style={{ display: 'block', border: '2px dashed rgba(212,175,55,0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px', background: 'rgba(212,175,55,0.03)' }}>
                        <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.8rem', marginBottom: '8px', display: 'block', color: 'var(--gold-premium, #d4af37)' }}></i>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block' }}>Klik untuk pilih file gambar dari laptop/HP Anda</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCmsEditFileChange} />
                      </label>
                      {(cmsEditFilePreview || editValue) && (
                        <img src={cmsEditFilePreview || editValue} alt="Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px', border: '1px solid var(--glass-border)' }} />
                      )}
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Atau isi URL gambar secara manual:</label>
                      <input type="url" className="form-control" value={editValue} onChange={(e) => { setEditValue(e.target.value); setCmsEditFile(null); setCmsEditFilePreview(''); }} placeholder="https://..." />
                    </>
                  ) : showPreviewHtml ? (
                    <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "16px", minHeight: "150px", color: "var(--text-primary)", fontSize: "0.85rem", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: editValue }}>
                    </div>
                  ) : (
                    <textarea 
                      className="form-control" 
                      rows={6} 
                      required 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{ fontFamily: isHtmlType ? "monospace" : "inherit", fontSize: "0.85rem" }}
                    />
                  )}
                </div>
                <button type="submit" className="btn-submit hover-trigger" disabled={loading}>
                  {loading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...</> : isImageType ? <><i className="fa-solid fa-cloud-arrow-up"></i> Upload & Simpan</> : <><i className="fa-solid fa-check"></i> Simpan Sementara (Draft)</>}
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL TAMBAH KUNCI CMS BARU */}
      {isAddingKey && (
        <div className="cms-modal-overlay active">
          <div className="cms-modal" style={{ maxWidth: "600px" }}>
            <button type="button" className="modal-close" onClick={() => setIsAddingKey(false)}><i className="fa-solid fa-xmark"></i></button>
            <h3 style={{ color: "var(--gold-premium, #d4af37)", fontFamily: "'Playfair Display', serif", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fa-solid fa-key"></i> Tambah Kunci Konten Baru ({currentTabConfig.label})
            </h3>
            <form onSubmit={handleSaveNewKey}>
              <div className="form-group">
                <label className="form-label">Identifier (Nama Kunci)</label>
                <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.5)", border: "1px solid var(--glass-border)", borderRadius: "8px", paddingLeft: "12px" }}>
                  <span style={{ color: "var(--gold-premium, #d4af37)", fontFamily: "monospace", fontSize: "0.85rem" }}>{newKeyPrefix}</span>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ border: "none", boxShadow: "none", background: "transparent", paddingLeft: "5px", fontSize: "0.85rem" }} 
                    placeholder="misal: hero_title" 
                    required 
                    pattern="[a-zA-Z0-9_]+"
                    value={newKeySuffix}
                    onChange={(e) => setNewKeySuffix(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>Gunakan huruf kecil, angka, dan garis bawah (_).</span>
              </div>
              <div className="form-group">
                <label className="form-label">Tipe Format Konten</label>
                <select className="form-control" value={newKeyType} onChange={(e) => setNewKeyType(e.target.value)}>
                  <option value="text">Teks Biasa (Plain Text)</option>
                  <option value="html">Format Rich HTML</option>
                  <option value="image">URL Gambar / Media</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nilai Konten Awal</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  required 
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Tuliskan isi teks atau URL di sini..."
                />
              </div>
              <button type="submit" className="btn-submit hover-trigger">
                <i className="fa-solid fa-plus" style={{ marginRight: "6px" }}></i> Tambahkan Kunci ke Draft
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT GALERI */}
      {isEditingGaleri && (
        <div className="cms-modal-overlay active">
          <div className="cms-modal" style={{ maxWidth: "600px" }}>
            <button type="button" className="modal-close" onClick={() => setIsEditingGaleri(false)}><i className="fa-solid fa-xmark"></i></button>
            <h3 style={{ color: "#00ff88", fontFamily: "'Playfair Display', serif", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fa-solid fa-images"></i> {galeriId ? "Edit Gambar Galeri" : "Tambah Gambar Galeri Museum"}
            </h3>
            <form onSubmit={handleSaveGaleri}>
              <div className="form-group">
                <label className="form-label">Pilih Foto dari Gawai</label>
                <label style={{ display: 'block', border: '2px dashed rgba(0,255,136,0.3)', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,255,136,0.03)', marginBottom: '12px' }}>
                  <i className="fa-solid fa-image" style={{ fontSize: '2rem', marginBottom: '8px', display: 'block', color: '#00ff88' }}></i>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Klik untuk pilih file foto dari perangkat Anda</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>JPG, PNG, WEBP — Maks. 5MB</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleGaleriFileChange} />
                </label>
                {galeriFilePreview && (
                  <div style={{ marginBottom: '12px', position: 'relative' }}>
                    <img src={galeriFilePreview} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(0,255,136,0.3)' }} />
                  </div>
                )}
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Atau masukkan URL gambar secara manual:</label>
                <input
                  type="url"
                  className="form-control"
                  value={galeriUrl}
                  onChange={(e) => { setGaleriUrl(e.target.value); setGaleriFile(null); setGaleriFilePreview(e.target.value); }}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Keterangan / Caption</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  value={galeriCaption}
                  onChange={(e) => setGaleriCaption(e.target.value)}
                  placeholder="Contoh: Malam Keakraban Angkatan 43..."
                />
              </div>
              <button type="submit" className="btn-submit hover-trigger" disabled={loading || (!galeriFile && !galeriUrl)}>
                {loading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Mengunggah...</> : <><i className="fa-solid fa-floppy-disk"></i> Simpan Foto Galeri</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING SAVE BUTTON */}
      {totalChanges > 0 && activeTab !== 'galeri' && (
        <div className="batch-save-widget visible" onClick={handleBatchSave}>
          {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
          {loading ? "Menyimpan Perubahan..." : "Simpan Semua Perubahan CMS"}
          <div className="batch-save-count">{totalChanges}</div>
        </div>
      )}
    </div>
  );
}
