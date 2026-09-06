"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/layout/AegisConfirm";
import "../admin.css";
import AdminLockBtn from "../../AdminLockBtn";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";

export default function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
  useEffect(() => {
    document.body.classList.add("page-admin");
    return () => {
      document.body.classList.remove("page-admin");
    };
  }, []);

  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { showAlert, showConfirm } = useConfirm();

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengubah role pengguna");
      }

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      console.error(err);
      await showAlert("Gagal", err.message || "Gagal mengupdate role.");
    } finally {
      setLoadingId(null);
    }
  };

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    setLoadingId(userId);
    const newStatus = !currentStatus;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, is_active: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengubah status pengguna");
      }

      setUsers(users.map(u => u.id === userId ? { ...u, is_active: newStatus } : u));
    } catch (err: any) {
      console.error(err);
      await showAlert("Gagal", err.message || "Gagal mengupdate status.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteUser = async (user: any) => {
    const userName = user.nama_panggilan || user.nama_lengkap || user.email;
    const confirmed = await showConfirm(
      "Konfirmasi Hapus Akun",
      `Apakah Anda yakin ingin menghapus akun "${userName}" (${user.email}) secara permanen dari database? Tindakan ini akan menghapus akun dari sistem autentikasi dan profil secara permanen.`
    );
    if (!confirmed) return;

    setLoadingId(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus pengguna");
      }

      setUsers(users.filter(u => u.id !== user.id));
      await showAlert("Berhasil", "Akun pengguna telah dihapus secara permanen dari database.");
    } catch (err: any) {
      console.error(err);
      await showAlert("Gagal", err.message || "Terjadi kesalahan saat menghapus pengguna.");
    } finally {
      setLoadingId(null);
    }
  };

  // Generate badge style based on role
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return "cat-Pengumuman"; // Gold
      case "bendahara": return "cat-Berita"; // Green
      default: return "cat-Mosi"; // Blue
    }
  };

  return (
    <div className="admin-wrapper">
      <div className="admin-header" style={{ position: "relative" , paddingRight: "160px"}}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <div>
          <h1 className="admin-title">Manajemen Alumni</h1>
          <nav className="admin-nav" style={{ marginTop: "10px" }}>
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/users" className="active">Alumni</Link>
            <Link href="/admin/moderation">Moderasi</Link>
            <Link href="/admin/cms">CMS Strings</Link>
          </nav>
        </div>
      </div>

      <div className="table-panel">
        {/* DESKTOP TABLE */}
        <div className="cms-table-wrapper">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Alumni</th>
                <th>Email</th>
                <th>Role Saat Ini</th>
                <th>Ubah Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">Belum ada data pengguna.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} style={{ opacity: u.is_active === false ? 0.6 : 1 }}>
                    <td>
                      <div className="ann-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img 
                          src={getAvatarUrl(u.foto_profil, u.nama_panggilan || u.nama_lengkap || 'U')} 
                          alt="Avatar" 
                          style={{ width: "35px", height: "35px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(212,175,55,0.3)" }} 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getAvatarFallback(u.nama_panggilan || u.nama_lengkap || 'U');
                          }}
                        />
                        <div>
                          <div>{u.nama_panggilan || u.nama_lengkap || 'Unknown'}</div>
                          <div style={{ fontSize: "0.75rem", color: "#d4af37" }}><i className="fa-solid fa-star"></i> {u.prestise_points || 0} Poin</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{u.email}</td>
                    <td>
                      <span className={`ann-category ${getRoleBadgeClass(u.role)}`} style={{ textTransform: "capitalize" }}>
                        {u.role || 'Member'}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={u.role || 'member'} 
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={loadingId === u.id}
                        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--glass-border)", color: "var(--text-primary)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.8rem", outline: "none", cursor: "pointer" }}
                      >
                        <option value="member">Member</option>
                        <option value="bendahara">Bendahara</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`mod-badge ${u.is_active !== false ? 'mod-badge-open' : 'mod-badge-closed'}`}>
                        {u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          className={`btn-action ${u.is_active !== false ? 'btn-delete-action' : 'btn-edit-action'} hover-trigger`}
                          onClick={() => toggleStatus(u.id, u.is_active !== false)}
                          disabled={loadingId === u.id}
                        >
                          <i className={`fa-solid ${u.is_active !== false ? 'fa-ban' : 'fa-check'}`}></i> {u.is_active !== false ? 'Suspend' : 'Aktifkan'}
                        </button>
                        <button 
                          className="btn-action hover-trigger"
                          onClick={() => handleDeleteUser(u)}
                          disabled={loadingId === u.id}
                          style={{ background: "rgba(255, 51, 102, 0.15)", borderColor: "rgba(255, 51, 102, 0.4)", color: "#ff3366" }}
                          title="Hapus Pengguna Permanen Dari Database"
                        >
                          <i className="fa-solid fa-trash"></i> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE USER CARDS */}
        <div className="users-mobile-card-list">
          {users.map(u => (
            <div key={u.id} className="user-mobile-card" style={{ opacity: u.is_active === false ? 0.6 : 1 }}>
              <div className="user-mobile-card-header">
                <img 
                  src={getAvatarUrl(u.foto_profil, u.nama_panggilan || u.nama_lengkap || 'U')} 
                  alt="Avatar" 
                  style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(212,175,55,0.3)" }} 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getAvatarFallback(u.nama_panggilan || u.nama_lengkap || 'U');
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.nama_panggilan || u.nama_lengkap || 'Unknown'}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {u.email}
                  </div>
                </div>
                <span className={`mod-badge ${u.is_active !== false ? 'mod-badge-open' : 'mod-badge-closed'}`}>
                  {u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-secondary)", background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: "8px" }}>
                <span>Prestise: <strong style={{ color: "#d4af37" }}><i className="fa-solid fa-star"></i> {u.prestise_points || 0} Poin</strong></span>
                <span className={`ann-category ${getRoleBadgeClass(u.role)}`} style={{ textTransform: "capitalize", fontSize: "0.65rem", padding: "2px 8px" }}>
                  {u.role || 'Member'}
                </span>
              </div>

              <div className="user-mobile-card-controls">
                <select 
                  value={u.role || 'member'} 
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  disabled={loadingId === u.id}
                  style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid var(--glass-border)", color: "var(--text-primary)", padding: "8px 10px", borderRadius: "8px", fontSize: "0.78rem", outline: "none", cursor: "pointer" }}
                >
                  <option value="member">Role: Member</option>
                  <option value="bendahara">Role: Bendahara</option>
                  <option value="admin">Role: Admin</option>
                </select>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
                  <button 
                    className={`btn-action ${u.is_active !== false ? 'btn-delete-action' : 'btn-edit-action'} hover-trigger`}
                    onClick={() => toggleStatus(u.id, u.is_active !== false)}
                    disabled={loadingId === u.id}
                    style={{ width: "100%", padding: "8px 10px", textAlign: "center", justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <i className={`fa-solid ${u.is_active !== false ? 'fa-ban' : 'fa-check'}`}></i> {u.is_active !== false ? 'Suspend' : 'Aktifkan'}
                  </button>

                  <button 
                    className="btn-action hover-trigger"
                    onClick={() => handleDeleteUser(u)}
                    disabled={loadingId === u.id}
                    style={{ width: "100%", padding: "8px 10px", textAlign: "center", justifyContent: "center", display: "flex", alignItems: "center", gap: "6px", background: "rgba(255, 51, 102, 0.15)", borderColor: "rgba(255, 51, 102, 0.4)", color: "#ff3366" }}
                  >
                    <i className="fa-solid fa-trash"></i> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="empty-state">Belum ada data pengguna.</div>
          )}
        </div>

        <div style={{ textAlign: "center", padding: "16px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          Total: {users.length} alumni terdaftar
        </div>
      </div>
    </div>
  );
}
