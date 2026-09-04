"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { useCms } from "@/components/layout/CmsProvider";
import LorongKenangan from "./LorongKenangan";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import "./beranda.css";

export default function BerandaClient({
  galeri,
  bukuTamu,
  kurator,
  leaderboard,
  birthdayUsers,
  isLoggedIn,
}: {
  galeri: any[];
  bukuTamu: any[];
  kurator: any[];
  leaderboard: any[];
  birthdayUsers: any[];
  isLoggedIn: boolean;
}) {
  const [gsapReady, setGsapReady] = useState(false);
  const [scrollTriggerReady, setScrollTriggerReady] = useState(false);
  const { t } = useCms();

  useEffect(() => {
    document.body.classList.add("page-beranda");
    
    // Setup window CMS config
    (window as any).BERANDA_CMS = {
      lores: [
          t('beranda_lore_1', '"Dan bersabarlah kamu bersama-sama dengan orang-orang yang menyeru Tuhannya di pagi dan senja hari..." (Al-Kahfi: 28)'),
          t('beranda_lore_2', '"Niscaya Allah akan meninggikan orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu pengetahuan..." (Al-Mujadilah: 11)'),
          t('beranda_lore_3', '"Dan berpeganglah kamu semuanya kepada tali (agama) Allah, dan janganlah kamu bercerai berai..." (Ali Imran: 103)'),
          t('beranda_lore_4', '"Maka sesungguhnya sesudah kesulitan itu ada kemudahan..." (Al-Insyirah: 5)'),
          t('beranda_lore_5', '"Bukanlah golongan kami orang yang tidak menyayangi yang muda dan tidak menghormati yang tua." (HR. Tirmidzi)')
      ],
      shards: [
          { title: t('beranda_shard_1_title', 'Bumi dengan 2 Lafazd Syahadat, Pena Bulu Emas dan Dua Kitab'), desc: t('beranda_shard_1_desc', 'Melambangkan yang menyiratkan makna QS. Al-Baqarah : 30 sebagai pemimpin di bumi yang mempunyai misi dalam menyebarluaskan ajaran, nilai, dan syariat Islam yang benar ke seluruh jagat raya. Pena bulu emas dan dua kitab melambangkan kewajiban alumni Expedient Generation, dalam menjalankan amanah yang berdasarkan Al-Quran\'an & As - Sunnah.') },
          { title: t('beranda_shard_2_title', 'Tulisan Almamater'), desc: t('beranda_shard_2_desc', 'Sebagai doa agar alumni Arrisalah tahun 2025 menjadi alumni yang husnul khotimah dan membangun kejayaan risalah Nabi Muhammad SAW.') },
          { title: t('beranda_shard_3_title', 'Cincin Emas'), desc: t('beranda_shard_3_desc', 'Cincin emas bermakna kekuatan dan sesuatu yang berharga, melambangkan tekat yang kuat, serta karakter yang visioner.') },
          { title: t('beranda_shard_4_title', 'Selendang Berwarna Putih'), desc: t('beranda_shard_4_desc', 'Selendang melambangkan persaudaraan yang erat dan solid, berdasarkan asas iman dan agama Islam yang harus dijaga kesuciannya.') },
          { title: t('beranda_shard_5_title', 'Bendera Pondok Modern'), desc: t('beranda_shard_5_desc', 'Merupakan simbol Pondok Modern sebagai lembaga pendidikan yang selalu berada di atas dan untuk semua golongan.') },
          { title: t('beranda_shard_6_title', 'Kelopak Logam Mulia Tungsten'), desc: t('beranda_shard_6_desc', 'Kelopak logam mulia tungsten merupakan material terkuat di dunia yang melambangkan perisai diri yang kuat dari godaan syaitan yang terkutuk.') },
          { title: t('beranda_shard_7_title', 'Perisai Rub Al-Hizb'), desc: t('beranda_shard_7_desc', 'Bentuk segi delapan ini merepresentasikan Rub Al-Hizb, simbol klasik pembatas ayat Al-Qur\'an, yang melambangkan komitmen alumni sebagai benteng iman dan pengamal kalam suci. Delapan sudutnya melambangkan delapan pintu surga sekaligus kesiapan menyebarkan kemaslahatan rahmatan lil-\'alamin ke delapan penjuru mata angin. Dibalut kilau perak (Al-Fidhdhah) yang terinspirasi dari keindahan perhiasan surga (QS. Al-Insan: 21), simbol ini menegaskan karakter alumni yang tangguh, adaptif, dan berharga tinggi, namun tetap bersahaja dalam kerendahan hati (tawadhu).') },
          { title: t('beranda_shard_8_title', 'Kelopak Blue Marble'), desc: t('beranda_shard_8_desc', 'Merupakan sebutan pertama kali untuk foto bumi yang pertama, yang diambil pada 7 Desember 1972, melambangkan gerakan dalam menjaga dan melestarikan bumi sebagai amanah yang dibebankan kepada seluruh umat manusia sesuai dengan QS. Al-Baqarah: 56. Memicu perlunya pembangkitan berkelanjutan untuk menjaga planet. Kepercayaan, loyalitas, tanggung jawab, keamanan simbol surga spiritualitas. Dan berlist-kan emas melambangkan bahwa alumni Arrisalah tahun 2025 adalah sesuatu yang berharga.') },
          { title: t('beranda_shard_9_title', 'Tanduk Rusa Emas Berlafazkan Muhammad SAW'), desc: t('beranda_shard_9_desc', 'Melambangkan semangat yang tinggi dalam menggapai cita-cita yang mulia, sebagai simbol regenerasi dan kebangkitan risalah Nabi Muhammad SAW. Kehadiran batu rubi merah di poros tengah bawah mengambil makna dari istilah bahasa Sanskerta Ratna yang berarti permata paling berharga. Batu Ratna ini merepresentasikan prinsip ketauhidan sebagai pondasi utama yang tunggal dan utuh. Posisinya yang diletakkan di bagian paling bawah menegaskan bahwa seluruh pergerakan, semangat perjuangan, dan cita-cita alumni harus berakar kuat pada asas tauhid yang kokoh kepada Allah SWT.') },
          { title: t('beranda_shard_10_title', 'Perisai Baja Berbentuk Segi 8'), desc: t('beranda_shard_10_desc', 'Menggambarkan asas Islam yang kokoh dan delapan arah mata angin yang memberi dampak pemberdayaan potensi yang memancar ke seluruh penjuru alam (rahmatan lil-alamin), serta menyiratkan makna seperti dalam QS. Al-Baqarah: 115, yakni kemanapun kamu menghadap, disanalah wajah-Nya.') },
          { title: t('beranda_shard_11_title', 'Mahkota Emas Berlambangkan Allah SWT'), desc: t('beranda_shard_11_desc', 'Melambangkan kekuasaan, keabadian, kebijaksanaan dan legitimasi. Simbol ini terletak di atas melambangkan bahwa Allah SWT yang Maha Esa dan segala aspek kehidupan ini bermuara kepada-Nya tiada daya dan upaya selain dari kehendak Allah Taala.') },
          { title: t('beranda_shard_12_title', 'Lima Permata'), desc: t('beranda_shard_12_desc', 'Lima permata bermakna lima rukun Islam yang mendasari berdirinya agama Islam.') },
          { title: t('beranda_shard_13_title', 'Enam Batu Zamrud'), desc: t('beranda_shard_13_desc', 'Enam batu zamrud sebagai simbol kemakmuran dan kelimpahan yang melambangkan enam rukun iman sebagai asas dasar keyakinan seorang muslim.') }
      ],
      jiwa: {
          keikhlasan: { title: t('beranda_jiwa_1_title', '1. Keikhlasan'), desc: t('beranda_jiwa_1_desc', '<p>Jiwa yang pertama adalah keikhlasan. Prinsip ini berarti <em>sepi ing pamrih</em>, yakni berbuat sesuatu bukan karena didorong oleh keinginan untuk mendapatkan keuntungan tertentu, melainkan hanya untuk Allah SWT semata. Segala perbuatan dilakukan dengan niat semata-mata untuk ibadah, Lillah. Kiai dan guru ikhlas dalam mendidik, para pembantu Kiai ikhlas dalam membantu menjalankan proses pendidikan, serta para santri yang ikhlas dididik.</p><p>Jiwa ini menciptakan suasana kehidupan pondok yang harmonis antara Kiai yang disegani dengan santri yang taat, cinta dan penuh hormat. Jiwa ini pula yang menjadikan para santri senantiasa siap berjuang di jalan Allah, di manapun dan kapanpun.</p>') },
          kesederhanaan: { title: t('beranda_jiwa_2_title', '2. Kesederhanaan'), desc: t('beranda_jiwa_2_desc', '<p>Kehidupan yang sederhana tentu sangat erat kaitannya dengan pondok pesantren. Kehidupan santri yang tentram bersahaja tentu jauh dari kata berlebihan, mubazir and lain sebagainya. Sederhana tidak berarti pasif atau menerima begitu saja, tidak juga berarti miskin dan melarat.</p><p>Justru dalam jiwa kesederhanan itu terdapat nilai-nilai kekuatan, kesanggupan, ketabahan dan penguasaan diri dalam menghadapi perjuangan hidup.</p>') },
          kemandirian: { title: t('beranda_jiwa_3_title', '3. Kemandirian'), desc: t('beranda_jiwa_3_desc', '<p>Kemandirian atau sering disebut juga dengan Berdikari (Berdiri di atas kaki sendiri) adalah kesanggupan menolong diri sendiri. Jiwa tersebut merupakan senjata ampuh yang dibekalkan pesantren kepada para santrinya. Berdikari tidak saja berarti bahwa santri sanggup belajar dan berlatih mengurus segala kepentingannya sendiri, tetapi pondok pesantren itu sendiri sebagai lembaga pendidikan juga harus sanggup berdikari sehingga tidak pernah menyandarkan kehidupannya kepada bantuan atau belas kasihan pihak lain.</p><p>Gontor menerapkan <em>Zelp-Berdruiping Systeem</em> (sama-sama memberikan iuran dan sama-sama memakai). Semua pekerjaan yang ada di dalam pondok dikerjakan oleh Kiai, guru dan para santrinya sendiri.</p>') },
          ukhuwah: { title: t('beranda_jiwa_4_title', '4. Ukhuwwah Islamiyyah'), desc: t('beranda_jiwa_4_desc', '<p>Kehidupan di pondok pesantren diliputi suasana persaudaraan yang akrab, sehingga segala suka dan duka dirasakan bersama dalam jalinan ukhuwwah Islamiyyah. Tidak ada dinding pemisah di antara mereka; apapun latarbelakang keluarga, suku, budaya, bahkan bangsa semua larut dalam jalinan ukhuwwah Islamiyyah.</p><p>Ukhuwah ini bukan saja selama mereka di Pondok, tetapi juga mempengaruhi ke arah persatuan umat dalam masyarakat setelah mereka terjun di masyarakat.</p>') },
          kebebasan: { title: t('beranda_jiwa_5_title', '5. Kebebasan'), desc: t('beranda_jiwa_5_desc', '<p>Bebas dalam berpikir dan berbuat, bebas dalam menentukan masa depan, bebas dalam memilih jalan hidup, dan bahkan bebas dari berbagai pengaruh negatif dari luar dirinya. Jiwa bebas ini akan menjadikan santri berjiwa besar dan optimis dalam menghadapi segala kesulitan.</p><p>Seringkali ditemukan unsur-unsur negatif dari kebebasan yang tak terkontrol, yaitu apabila kebebasan itu disalahgunakan, sehingga terlalu bebas (liberal) dan berakibat hilangnya arah tujuan dan prinsip. Ada pula yang terlalu bebas (untuk tidak mau dipengaruhi), berpegang teguh kepada tradisi yang dianggapnya baik, sehingga tidak mau mengikuti perkembangan zaman.</p><p>Maka kebebasan ini harus dikembalikan ke aslinya, yaitu bebas di dalam garis-garis yang positif, dengan penuh tanggungjawab; baik di dalam kehidupan pondok pesantren itu sendiri, maupun dalam kehidupan masyarakat. Untuk bisa mendapatkan kebebasan, seorang santri haruslah memegang teguh 4 prinsip sebelumnya agar tidak terjerumus ke dalam kebebasan yang salah.</p>') }
      },
      archive: {
          visi: { date: t('beranda_archive_1_date', '30 MARET 2026'), title: t('beranda_archive_1_title', 'Deklarasi Visi Sovereign'), content: t('beranda_archive_1_content', '<p>Naskah ini mencatat sumpah agung angkatan Expedient mengenai visi dan arah tujuan masa depan.</p><p>Kami berjanji untuk memelihara warisan <span class="redacted" onclick="revealRedacted(this)">KEISLAMAN</span> dan mengikat erat <span class="redacted" onclick="revealRedacted(this)">PERSAUDARAAN</span>.</p><p>Nilai-nilai ini diukir bukan pada batu, melainkan pada karakter setiap individu.</p><p><em>Selesai.</em></p>') },
          simpul: { date: t('beranda_archive_2_date', '15 FEBRUARI 2026'), title: t('beranda_archive_2_title', 'Simpul Kesucian: Menjaga Nilai Arrisalah'), content: t('beranda_archive_2_content', '<p>Manuskrip mengenai pemeliharaan nilai-nilai murni dalam harmoni pasca-kelulusan.</p><p>Di balik kemewahan dunia, pondasi kita tetap bersandar pada <span class="redacted" onclick="revealRedacted(this)">KESEDERHANAAN</span> hati.</p><p>Setiap duta angkatan diharapkan menjadi mercusuar teladan di manapun mereka memijakkan kaki.</p><p><em>Tertanda, Dewan Kehormatan.</em></p>') }
      },
      ui: {
          hint_spin: t('beranda_ui_hint_spin', 'MEMUTAR HOLOGRAM...'),
          hint_drag: t('beranda_ui_hint_drag', "<i class='fa-solid fa-arrows-left-right'></i> Tahan & Geser Untuk Memutar"),
          hint_interact: t('beranda_ui_hint_interact', "<i class='fa-solid fa-hand-pointer'></i> Geser Untuk Putar / Klik Untuk Data"),
          hint_lock: t('beranda_ui_hint_lock', 'MENGUNCI FORMASI...'),
          btn_process: t('beranda_ui_btn_process', '<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses...'),
          btn_assemble: t('beranda_ui_btn_assemble', '<i class="fa-solid fa-circle-notch fa-spin"></i> Merakit...'),
          btn_unite: t('beranda_ui_btn_unite', '<i class="fa-solid fa-compress"></i> Satukan Identitas'),
          btn_scatter: t('beranda_ui_btn_scatter', '<i class="fa-solid fa-expand"></i> Pencar Formasi')
      }
    };

    return () => {
      document.body.classList.remove("page-beranda");
    };
  }, [t]);

  const { showAlert } = useConfirm();

  const closeModal = () => {
    document.getElementById('philModal')?.classList.remove('active');
  };

  const handleGuestbookSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nama = formData.get('nama') as string;
    const pesan = formData.get('pesan') as string;
    
    // API expects message
    try {
      const res = await fetch('/api/buku-tamu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, message: pesan })
      });
      if (res.ok) {
        await showAlert("Berhasil", "Pesan berhasil dikirim!");
        // Reload to show new message or handle optimism
        window.location.reload();
      } else {
        await showAlert("Gagal", "Gagal mengirim pesan.");
      }
    } catch (err) {
      await showAlert("Gagal", "Terjadi kesalahan.");
    }
  };

  // Render HTML langsung (tanpa gate isClient) agar premium-loader tampil segera

  return (
    <>
      <div className="premium-loader" id="loader">
          <div className="circular-loader">
              <div className="loader-ring"></div>
              <div className="loader-ring-active"></div>
              <div className="loader-percent" id="loadPercent">0%</div>
          </div>
          <div className="loader-lore" id="loaderLore">"Sovereign Protocol Initiated..."</div>
          <div className="loader-status">Mempersiapkan Ruang Pameran</div>
      </div>

      <div className="mecha-stage" id="stage">
          <div className="god-rays" id="godRays"></div>
          <div className="monumental-text" id="monumentalText">EXPEDIENT</div>

          <canvas id="constellationCanvas"></canvas>

          <div className="logo-utuh-container hover-trigger" id="fullLogoBox">
              <canvas id="fullLogoCanvas" width="800" height="450"></canvas>
              <img src="/images/logo-utuh.webp" id="fullLogoStatic" alt="Static" />
          </div>
          
          <div className="shards-universe" id="shardsContainer"></div>
          <div className="merge-flash" id="flashEffect"></div>
          
          <div className="hud-controls">
              <div className="hud-hint" id="hudHint"><i className="fa-solid fa-arrows-left-right"></i> Tahan & Geser Untuk Memutar</div>
              <button className="btn-mecha hover-trigger" id="btnAction"><i className="fa-solid fa-expand"></i> Pencar Formasi</button>
          </div>

          <i className="fa-solid fa-chevron-down scroll-indicator" style={{ position: 'absolute', bottom: '5vh', left: '50%', transform: 'translateX(-50%)', color: '#d4af37', fontSize: '2rem', animation: 'bounceIndicator 2s infinite', zIndex: 20, opacity: 0.7 }}></i>
      </div>

      <div className="phil-modal" id="philModal">
          <div className="phil-content">
              <h2 className="phil-title" id="modalTitle">Judul</h2>
              <p className="phil-desc" id="modalDesc">Deskripsi filosofi.</p>
              <button className="btn-mecha hover-trigger" style={{ marginTop: '25px', padding: '10px 25px', fontSize: '0.8rem' }} onClick={closeModal}>TUTUP</button>
          </div>
      </div>

      <main className="museum-halls">
          <section className="hall-section epigraph-section">
              <h1 className="grand-text reveal-up" dangerouslySetInnerHTML={{__html: t('beranda_epigraph', 'Kami bukan sekadar angkatan.<br class="desktop-br" /> Kami adalah <span class="highlight-gold">barisan pelopor</span> yang lahir dari rahim Arrisalah,<br class="desktop-br" /> dibentuk oleh waktu, dipersatukan oleh takdir.')}}>
              </h1>
          </section>

          <section className="hall-section">
              <div className="stats-grid">
                  <div className="stat-card glass-panel reveal-up">
                      <h3 className="stat-number"><span className="gsap-counter" data-target={t('beranda_stat_1_num', '124')}>0</span>+</h3>
                      <p className="stat-label">{t('beranda_stat_1_label', 'Entitas Expedient')}</p>
                  </div>
                  <div className="stat-card glass-panel reveal-up">
                      <h3 className="stat-number"><span className="gsap-counter" data-target={t('beranda_stat_2_num', '34')}>0</span></h3>
                      <p className="stat-label">{t('beranda_stat_2_label', 'Wilayah Sebaran')}</p>
                  </div>
                  <div className="stat-card glass-panel reveal-up">
                      <h3 className="stat-number"><span className="gsap-counter" data-target={t('beranda_stat_3_num', '2025')}>0</span></h3>
                      <p className="stat-label">{t('beranda_stat_3_label', 'Tahun Kebangkitan')}</p>
                  </div>
              </div>
          </section>

          <section className="hall-section">
              <h2 className="section-title reveal-up">{t('beranda_gallery_title', 'Lorong Kenangan')}</h2>
              <LorongKenangan galeri={galeri} />
          </section>

          <section className="hall-section">
              <h2 className="section-title reveal-up">{t('beranda_manuskrip_title', 'Manuskrip Sejarah')}</h2>
              <div className="news-list">
                  <article className="news-item reveal-up" onClick={() => (window as any).openArchive?.('visi')} style={{ cursor: 'pointer' }}>
                      <span className="news-date">30 MARET 2026</span>
                      <h3 className="news-title">Penetapan Visi Angkatan</h3>
                      <a href="#" onClick={(e) => e.preventDefault()} className="news-link">BACA DOKUMEN <i className="fa-solid fa-book-open"></i></a>
                  </article>
                  <article className="news-item reveal-up" onClick={() => (window as any).openArchive?.('simpul')} style={{ cursor: 'pointer' }}>
                      <span className="news-date">15 FEBRUARI 2026</span>
                      <h3 className="news-title">Simpul Kesucian: Menjaga Nilai-Nilai Arrisalah</h3>
                      <a href="#" onClick={(e) => e.preventDefault()} className="news-link">BACA DOKUMEN <i className="fa-solid fa-book-open"></i></a>
                  </article>
              </div>
          </section>

          {/* Modal Sovereign Archives */}
          <div className="archive-modal" id="archiveModal">
              <div className="archive-backdrop" onClick={() => (window as any).closeArchive?.()}></div>
              <div className="archive-paper" id="archivePaper">
                  <div className="archive-header">
                      <div>SOVEREIGN ARCHIVE</div>
                      <div id="arcDate">---</div>
                  </div>
                  <h1 className="archive-title" id="arcTitle">TITLE</h1>
                  <div className="archive-body" id="arcBody">
                      {/* Content injected here */}
                  </div>
                  <button className="btn-stamp" style={{ marginTop: '40px', display: 'block', width: '100%', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }} onClick={() => (window as any).closeArchive?.()}>TUTUP MANUSKRIP</button>
              </div>
          </div>

          <section className="hall-section">
              <h2 className="section-title reveal-up">{t('beranda_kurator_title', 'Para Kurator')}</h2>
              <div className="curator-grid">
                  {kurator.map((k, idx) => (
                      <div className="curator-card glass-panel reveal-up" key={idx}>
                          <div className="curator-img-wrap">
                            <img 
                              src={getAvatarUrl(k.foto_profil, k.nama_panggilan || k.nama_lengkap)} 
                              alt={k.nama_lengkap || "Kurator"} 
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getAvatarFallback(k.nama_panggilan || k.nama_lengkap);
                              }}
                            />
                          </div>
                          <div className="curator-info">
                              <h4>{k.nama_lengkap}</h4>
                              <p>{k.jabatan || 'Admin'}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </section>

          {leaderboard.length > 0 && (
              <section className="hall-section" style={{ paddingTop: 0 }}>
                  <h2 className="section-title reveal-up" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>{t('beranda_leaderboard_title', 'Jajaran Kehormatan')}</h2>
                  <div className="leaderboard-container">
                      {leaderboard.map((l, idx) => {
                          const rank = idx + 1;
                          const borderColor = rank === 1 ? '#FFD700' : (rank === 2 ? '#E5E4E2' : (rank === 3 ? '#cd7f32' : 'var(--glass-border)'));
                          return (
                              <div className="glass-panel reveal-up leaderboard-item" style={{ borderLeft: `4px solid ${borderColor}` }} key={idx}>
                                  <div className="leaderboard-info">
                                      <div className="leaderboard-rank">#{rank}</div>
                                      <img 
                                        src={getAvatarUrl(l.foto_profil, l.nama_panggilan || l.nama_lengkap)} 
                                        className="leaderboard-avatar" 
                                        alt="Avatar" 
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = getAvatarFallback(l.nama_panggilan || l.nama_lengkap);
                                        }}
                                      />
                                      <div>
                                          <div className="leaderboard-name">{l.nama_panggilan || l.nama_lengkap}</div>
                                          <div className="leaderboard-label">POIN TERAKUMULASI</div>
                                      </div>
                                  </div>
                                  <div className="leaderboard-score">
                                      {new Intl.NumberFormat('id-ID').format(l.prestise_points || 0)}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </section>
          )}

          <section className="hall-section monolith-section">
              <div className="monolith-pillar">
                  <h2 className="gold-engraving panca-jiwa" onClick={() => (window as any).openJiwa?.('keikhlasan')}>Keikhlasan</h2>
                  <h2 className="gold-engraving panca-jiwa" onClick={() => (window as any).openJiwa?.('kesederhanaan')}>Kesederhanaan</h2>
                  <h2 className="gold-engraving panca-jiwa" onClick={() => (window as any).openJiwa?.('kemandirian')}>Kemandirian</h2>
                  <h2 className="gold-engraving panca-jiwa" onClick={() => (window as any).openJiwa?.('ukhuwah')}>Ukhuwwah Islamiyyah</h2>
                  <h2 className="gold-engraving panca-jiwa" onClick={() => (window as any).openJiwa?.('kebebasan')}>Kebebasan</h2>
              </div>
          </section>

          {/* Modal Khusus Panca Jiwa */}
          <div className="jiwa-modal" id="jiwaModal">
              <div className="jiwa-anim-container" id="jiwaAnimContainer"></div>
              <div className="jiwa-content" id="jiwaContent">
                  <h2 className="jiwa-title" id="jiwaTitle">Judul</h2>
                  <div className="jiwa-desc" id="jiwaDesc">Penjelasan...</div>
                  <button className="btn-stamp" style={{ marginTop: '30px', fontSize: '0.8rem', padding: '10px 20px' }} onClick={() => (window as any).closeJiwa?.()}>Tutup Penjelasan</button>
              </div>
          </div>

          <section className="hall-section">
              <h2 className="section-title reveal-up">{t('beranda_timeline_title', 'Garis Waktu')}</h2>
              <div className="golden-timeline">
                  <div className="timeline-node">
                      <div className="node-dot"></div>
                      <div className="node-content glass-panel">
                          <span className="node-year">AWAL MULA</span>
                          <p>Angkatan Expedient pertama kali menapakkan jejaknya di bumi Arrisalah, mengikat janji untuk menjadi barisan pelopor peradaban.</p>
                      </div>
                  </div>
                  <div className="timeline-node">
                      <div className="node-dot"></div>
                      <div className="node-content glass-panel">
                          <span className="node-year">MASA PENEMPAAN</span>
                          <p>Melewati berbagai ujian dan dinamika pondok yang membentuk mental baja, kemandirian, serta ukhuwah islamiyah yang tak tergoyahkan.</p>
                      </div>
                  </div>
              </div>
          </section>

          <section className="hall-section ledger-section reveal-up">
              <h2 className="section-title" style={{ marginBottom: '20px' }}>{t('beranda_guestbook_title', 'Buku Tamu Eksklusif')}</h2>
              <p style={{ color: 'var(--text-muted, #5e7a6b)', marginBottom: '40px', fontSize: '0.9rem' }}>{t('beranda_guestbook_desc', 'Segel kehadiran Anda di dalam sejarah peradaban.')}</p>
              
              {isLoggedIn ? (
                  <form onSubmit={handleGuestbookSubmit} className="ledger-form" id="ledgerForm">
                      <input type="text" name="nama" className="luxury-input input-signature" placeholder="Tanda Tangan (Nama)" required />
                      <textarea name="pesan" className="luxury-input" placeholder="Tuliskan pesan berharga Anda..." rows={2} required></textarea>
                      <div>
                          <button type="submit" className="btn-stamp" id="desktopSubmitBtn">STEMPEL KEHADIRAN</button>
                          
                          <div className="swipe-seal-container" id="swipeSealContainer">
                              <div className="swipe-fill" id="swipeFill"></div>
                              <div className="swipe-text" id="swipeText">GESER UNTUK MENYEGEL <i className="fa-solid fa-arrow-right" style={{ marginLeft: '10px' }}></i></div>
                              <div className="swipe-knob" id="swipeKnob"><i className="fa-solid fa-fingerprint"></i></div>
                          </div>
                      </div>
                  </form>
              ) : (
                  <div className="guestbook-empty">
                      <i className="fa-solid fa-lock guestbook-empty-icon"></i>
                      <p className="guestbook-empty-text">Masuk ke portal untuk menandatangani buku tamu.</p>
                      <a href="/login" className="guestbook-login-link">
                          <i className="fa-solid fa-right-to-bracket"></i> Masuk Sekarang
                      </a>
                  </div>
              )}

              {bukuTamu.length > 0 && (
                  <div className="guestbook-list">
                      <h3 className="guestbook-title">Jejak Terkini</h3>
                      <div className="guestbook-items">
                          {bukuTamu.map((bt, idx) => (
                              <div className="guestbook-item" key={idx}>
                                  <div className="guestbook-name">{bt.nama}</div>
                                  <div className="guestbook-msg">"{bt.pesan}"</div>
                                  <div className="guestbook-date">{new Date(bt.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                          ))}
                      </div>
                      <div className="guestbook-footer">
                          <a href="/buku-tamu" className="guestbook-more-link">Lihat Seluruh Catatan <i className="fa-solid fa-arrow-right"></i></a>
                      </div>
                  </div>
              )}
          </section>

          {isLoggedIn && birthdayUsers.length > 0 && (
              <div id="bdayToast" style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%) translateY(150px)', width: '90%', maxWidth: '400px', background: 'var(--glass-bg)', backdropFilter: 'blur(30px)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '16px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', gap: '15px', opacity: 0, transition: '0.8s cubic-bezier(0.16,1,0.3,1)' }}>
                  <div style={{ width: '50px', height: '50px', background: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', fontSize: '1.5rem', flexShrink: 0 }}>
                      <i className="fa-solid fa-cake-candles"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", color: '#d4af37', fontWeight: 700, fontSize: '1.1rem', marginBottom: '5px' }}>Notifikasi Ulang Tahun</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                          Hari ini adalah ulang tahun <strong>{birthdayUsers[0].nama_panggilan || birthdayUsers[0].nama_lengkap}</strong>
                          {birthdayUsers.length > 1 ? ` dan ${birthdayUsers.length - 1} entitas lainnya` : ''}. <br/>
                          <a href="/birthday" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 'bold', marginTop: '5px', display: 'inline-block' }}>Kirim Ucapan <i className="fa-solid fa-arrow-right-long" style={{ marginLeft: '5px' }}></i></a>
                      </div>
                  </div>
                  <button onClick={() => { document.getElementById('bdayToast')!.style.opacity = '0'; setTimeout(() => document.getElementById('bdayToast')!.style.display = 'none', 800); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '5px' }}><i className="fa-solid fa-times"></i></button>
              </div>
          )}
      </main>

      {/* GSAP & ScrollTrigger — chained loading agar urutan terjamin */}
      <Script 
        src="/vendor/gsap/gsap.min.js" 
        strategy="afterInteractive" 
        onReady={() => setGsapReady(true)}
      />
      {gsapReady && (
        <Script 
          src="/vendor/gsap/ScrollTrigger.min.js" 
          strategy="afterInteractive" 
          onReady={() => setScrollTriggerReady(true)}
        />
      )}
      {/* Script Utama Beranda — hanya dimuat setelah GSAP + ScrollTrigger siap */}
      {scrollTriggerReady && (
        <Script src="/assets/js/beranda.js" strategy="afterInteractive" />
      )}
    </>
  );
}
