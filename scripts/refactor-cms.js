const fs = require('fs');
let code = fs.readFileSync('c:/Users/LENOVO/angkatan1/expedient-next/src/app/(dashboard)/admin/(protected)/cms/CmsClient.tsx', 'utf8');

// We will insert the getGroupForKey logic inside the component.
const groupLogic = `
  const getGroupForKey = (key: string, prefix: string) => {
    if (prefix === 'beranda') {
      if (key.includes('_loader_') || key.includes('_hero_') || key.includes('_epigraph')) return 'Hero & Loading';
      if (key.includes('_lore_')) return 'Sovereign Lore (Loading Texts)';
      if (key.includes('_shard_') || key.includes('_img_full')) return 'Pecahan (Shards) & Logo 3D';
      if (key.includes('_jiwa_')) return 'Panca Jiwa (Filosofi)';
      if (key.includes('_stat_')) return 'Statistik Angkatan';
      if (key.includes('gallery') || key.includes('lorong_') || key.includes('_kenangan_')) return 'Lorong Kenangan';
      if (key.includes('_manuskrip_') || key.includes('_archive_') || key.includes('_news_')) return 'Manuskrip Sejarah';
      if (key.includes('_kurator') || key.includes('_leaderboard')) return 'Kurator & Kehormatan';
      if (key.includes('_timeline')) return 'Garis Waktu';
      if (key.includes('_buku_tamu') || key.includes('_guestbook')) return 'Buku Tamu';
      if (key.includes('hud_') || key.includes('btn_')) return 'Tombol & HUD';
      return 'Lain-lain';
    }
    return 'General';
  };
`;

code = code.replace('const router = useRouter();', 'const router = useRouter();\n' + groupLogic);

const newRender = `
          <div key={prefix} className={\`cms-tab-content \${activeTab === prefix ? 'active' : ''}\`}>
            <button className="btn-add" onClick={() => handleOpenAddKey(prefix)}>
              <i className="fa-solid fa-plus"></i> Tambah Kunci Konten Baru
            </button>
            {Object.entries(
              groupedContents[prefix].reduce((acc, c) => {
                const group = getGroupForKey(c.content_key, prefix);
                if (!acc[group]) acc[group] = [];
                acc[group].push(c);
                return acc;
              }, {} as Record<string, SiteContent[]>)
            ).map(([subGroup, items]) => (
              <div key={subGroup} style={{ marginBottom: '40px' }}>
                <h3 style={{ fontFamily: 'Playfair Display', color: '#d4af37', borderBottom: '1px solid rgba(212,175,55,0.3)', paddingBottom: '10px', marginBottom: '15px' }}>{subGroup}</h3>
                <div className="cms-table-wrapper">
                  <table className="cms-table">
                    <thead>
                      <tr>
                        <th style={{ width: "20%" }}>Identifier (Key)</th>
                        <th style={{ width: "15%" }}>Format</th>
                        <th style={{ width: "50%" }}>Nilai Saat Ini</th>
                        <th style={{ width: "15%" }}>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((c) => {
                        const isDrafted = draftUpdates[c.id] !== undefined;
                        const isDeleted = draftDeletions.includes(c.id);
                        const isNew = c.id.startsWith("new_");
                        
                        if (isDeleted) return null;

                        const displayValue = isDrafted ? draftUpdates[c.id] : c.content_value;

                        return (
                          <tr key={c.id} style={{ background: isDrafted || isNew ? 'rgba(0, 255, 136, 0.05)' : 'transparent' }}>
                            <td>
                              <span className="key-badge">{c.content_key}</span>
                              {(isDrafted || isNew) && <span style={{ fontSize: "0.6rem", color: "#00ff88", marginLeft: "5px" }}>*DRAFT</span>}
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
                                <>
                                  <img src={displayValue} className="content-preview-img" alt="Preview" />
                                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "5px", wordBreak: "break-all" }}>{displayValue}</div>
                                </>
                              ) : (
                                <div className="content-preview-text">{displayValue}</div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "5px" }}>
                                <button type="button" className="btn-edit hover-trigger" onClick={() => handleOpenEdit(c)}>
                                  <i className="fa-solid fa-pen-nib"></i> Modifikasi
                                </button>
                                <button type="button" className="btn-danger hover-trigger" onClick={() => handleMarkDelete(c.id)}>
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={4} className="empty-state">Belum ada konten</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
`;

// Extract everything from <div className="cms-panel"> to {/* GALERI TAB CONTENT */}
const targetRegex = /<div key={prefix} className={\`cms-tab-content \${activeTab === prefix \? 'active' : ''}\`}>[\s\S]*?<\/table>\s*<\/div>\s*<\/div>\s*\)\)}/;
code = code.replace(targetRegex, newRender.trim() + "\n        ))} ");

fs.writeFileSync('c:/Users/LENOVO/angkatan1/expedient-next/src/app/(dashboard)/admin/(protected)/cms/CmsClient.tsx', code);
