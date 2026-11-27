/**
 * EXPEDIENT GENERATION - MASTER GUIDE DATA
 * Katalog lengkap panduan, penjelasan fungsi, tombol penting, dan tips penggunaan
 * untuk seluruh halaman dan fitur portal Expedient 43.
 */

export interface GuideControl {
  name: string;
  icon: string;
  desc: string;
}

export interface PageGuide {
  id: string;
  route: string;
  title: string;
  subtitle: string;
  category: "utama" | "komunikasi" | "sosial" | "eksklusif" | "admin";
  categoryLabel: string;
  icon: string;
  badge?: string;
  summary: string;
  howToUse: string[];
  controls: GuideControl[];
  tips: string[];
  faq?: { q: string; a: string }[];
}

export const CATEGORIES = [
  { id: "semua", label: "Semua Fitur", icon: "fa-solid fa-border-all" },
  { id: "utama", label: "Menu Utama", icon: "fa-solid fa-compass" },
  { id: "komunikasi", label: "Komunikasi", icon: "fa-solid fa-comments" },
  { id: "sosial", label: "Sosial & Ibadah", icon: "fa-solid fa-hand-holding-heart" },
  { id: "eksklusif", label: "Fitur Satelit", icon: "fa-solid fa-gem" },
  { id: "admin", label: "Kelola Admin", icon: "fa-solid fa-shield-halved" },
] as const;

export const PAGE_GUIDES: PageGuide[] = [
  // =========================================================================
  // 1. MENU UTAMA
  // =========================================================================
  {
    id: "beranda",
    route: "/beranda",
    title: "Beranda Kenangan",
    subtitle: "Museum Digital & Linimasa Jejak Langkah",
    category: "utama",
    categoryLabel: "Menu Utama",
    icon: "fa-solid fa-landmark",
    summary:
      "Halaman utama yang menyajikan museum interaktif digital angkatan. Di sini terdapat logo 3D yang dapat diputar, linimasa sejarah perjuangan masa pondok, lorong kenangan foto, serta kilasan buku tamu.",
    howToUse: [
      "Sentuh atau seret mouse pada logo angkatan untuk memutar lambang 3D.",
      "Gulir ke bawah untuk menelusuri linimasa sejarah sejak tahun pertama nyantri hingga kelulusan.",
      "Tekan foto di lorong kenangan untuk memperbesar momen dokumentasi masa lalu.",
      "Tulis salam atau pesan singkat pada kolom buku tamu di bagian bawah.",
    ],
    controls: [
      { name: "Interaksi Lambang 3D", icon: "fa-solid fa-cube", desc: "Klik dan seret untuk memutar logo angkatan 360 derajat secara bebas." },
      { name: "Linimasa Sejarah", icon: "fa-solid fa-timeline", desc: "Runtutan peristiwa penting, ujian, dan pencapaian angkatan ke-43." },
      { name: "Buku Tamu Cepat", icon: "fa-solid fa-pen-nib", desc: "Kolom untuk menuliskan pesan silaturahmi yang langsung tampil di beranda." },
    ],
    tips: [
      "Aktifkan mode gelap atau terang lewat ikon bulan/matahari di bilah atas untuk kenyamanan visual Anda.",
      "Pada perangkat ponsel, cukup usap layar ke atas untuk menikmati animasi transisi halus.",
    ],
  },
  {
    id: "direktori",
    route: "/direktori",
    title: "Direktori Alumni",
    subtitle: "Buku Kontak & Database Sahabat Seangkatan",
    category: "utama",
    categoryLabel: "Menu Utama",
    icon: "fa-solid fa-address-book",
    summary:
      "Buku alamat seluruh anggota angkatan ke-43 untuk mencari kontak kawan berdasarkan nama, panggilan, kelas, konsulat daerah, hingga kota domisili.",
    howToUse: [
      "Ketik nama atau kota domisili kawan pada kolom pencarian.",
      "Gunakan filter gender atau kelas di bagian atas untuk menyaring daftar alumni.",
      "Tekan tombol 'Hubungi via WhatsApp' pada detail profil untuk langsung memulai chat.",
      "Tekan tombol 'Simpan' (vCard) untuk mengekspor dan menyimpan kontak ke buku telepon ponsel Anda.",
      "Tekan kartu alumni untuk membuka detail profil sahabat tersebut.",
    ],
    controls: [
      { name: "Kolom Pencarian", icon: "fa-solid fa-magnifying-glass", desc: "Pencarian instan berdasarkan nama lengkap, nama panggilan, kelas, atau kota." },
      { name: "Filter Gender & Kelas", icon: "fa-solid fa-filter", desc: "Menyaring daftar alumni berdasarkan putra/putri dan kelas." },
      { name: "Tombol WhatsApp", icon: "fa-brands fa-whatsapp", desc: "Membuka aplikasi WhatsApp langsung ke nomor kontak sahabat." },
      { name: "Simpan Kontak (vCard)", icon: "fa-solid fa-id-badge", desc: "Mengunduh file kontak .vcf langsung ke kontak HP Anda." },
    ],
    tips: [
      "Jika nomor kawan belum terverifikasi atau berubah, sarankan sahabat tersebut untuk memperbarui di halaman Profil mereka.",
    ],
  },
  {
    id: "galeri",
    route: "/galeri",
    title: "Galeri Kenangan",
    subtitle: "Arsip Foto & Video Sejarah Masa Nyantri",
    category: "utama",
    categoryLabel: "Menu Utama",
    icon: "fa-solid fa-film",
    summary:
      "Arsip digital multimedia yang menyimpan kenangan visual, foto masa santri, panggung gembira, perkemahan, kegiatan asrama, hingga prosesi wisuda kelulusan.",
    howToUse: [
      "Pilih kategori album foto yang ingin Anda jelajahi di tab bagian atas.",
      "Klik salah satu foto untuk membuka mode layar penuh (lightbox).",
      "Gunakan tombol panah kiri dan kanan untuk berpindah foto berikutnya.",
      "Tekan tombol 'Unggah Media' jika Anda memiliki dokumentasi masa pondok untuk dibagikan.",
    ],
    controls: [
      { name: "Tab Kategori Album", icon: "fa-solid fa-folder-open", desc: "Menyaring foto berdasarkan tema kegiatan atau tahun kenangan." },
      { name: "Pemutar Musik Latar", icon: "fa-solid fa-music", desc: "Memutar alunan instrumen nostalgia kenangan." },
      { name: "Unggah Media", icon: "fa-solid fa-cloud-arrow-up", desc: "Formulir kontribusi foto dari alumni." },
      { name: "Unduh Foto", icon: "fa-solid fa-download", desc: "Menyimpan foto resolusi penuh ke galeri ponsel Anda." },
    ],
    tips: [
      "Foto yang diunggah dikompresi agar hemat kuota tanpa mengurangi ketajaman visual.",
    ],
  },
  {
    id: "radar",
    route: "/radar",
    title: "Peta Persebaran Alumni",
    subtitle: "Peta Interaktif Lokasi & Domisili Sahabat",
    category: "utama",
    categoryLabel: "Menu Utama",
    icon: "fa-solid fa-map-location-dot",
    summary:
      "Peta interaktif global yang memetakan domisili rekan-rekan alumni di seluruh Indonesia dan dunia saat sedang bepergian atau mencari kawan sekota.",
    howToUse: [
      "Geser peta untuk menelusuri titik kumpul alumni.",
      "Tekan switch 'Globe 3D' atau ubah lapisan peta pada kontrol kanan bawah.",
      "Gunakan daftar Top 5 Kota atau perbesar langsung pada cluster kota yang diminati.",
      "Tekan tombol 'Update Lokasi' untuk membagikan koordinat kota Anda saat ini secara aman.",
      "Klik pin alumni untuk melihat nama, kota domisili, dan tautan dossier atau WhatsApp.",
    ],
    controls: [
      { name: "Switch Mode Peta/Globe", icon: "fa-solid fa-globe", desc: "Beralih antara peta jalan 2D Leaflet atau tampilan Globe 3D." },
      { name: "Top 5 Kota", icon: "fa-solid fa-city", desc: "Menampilkan kota dengan domisili alumni terbanyak." },
      { name: "Perbarui Lokasi GPS", icon: "fa-solid fa-crosshairs", desc: "Menyinkronkan kota tinggal Anda agar terbaca oleh rekan seangkatan." },
      { name: "Panel Info Pin", icon: "fa-solid fa-address-card", desc: "Menampilkan ringkasan alumni dan tautan kontak." },
    ],
    tips: [
      "Koordinat yang dibagikan hanya sebatas tingkat kota/kabupaten demi menjaga privasi tempat tinggal alumni.",
    ],
  },
  {
    id: "syndicate",
    route: "/syndicate",
    title: "Katalog Bisnis Alumni",
    subtitle: "Pusat Usaha, Produk & Jasa Sahabat",
    category: "utama",
    categoryLabel: "Menu Utama",
    icon: "fa-solid fa-briefcase",
    summary:
      "Etalase ekonomi angkatan untuk mempromosikan usaha, produk UMKM, dan jasa sesama alumni agar saling mendukung.",
    howToUse: [
      "Gunakan kolom pencarian atau filter kategori untuk mencari produk atau jasa.",
      "Tekan kartu usaha untuk membuka microsite atau detail produk.",
      "Klik tombol 'Pesan via WhatsApp' untuk langsung terhubung ke pemilik usaha.",
      "Tekan tombol 'Daftarkan Usaha Anda' bila ingin menampilkan usaha milik Anda.",
    ],
    controls: [
      { name: "Daftarkan Usaha", icon: "fa-solid fa-plus", desc: "Membuka formulir pendaftaran merek, deskripsi usaha, dan kontak WhatsApp." },
      { name: "Filter Kategori", icon: "fa-solid fa-tags", desc: "Menyaring bisnis berdasarkan sektor usaha." },
      { name: "Pesan via WhatsApp", icon: "fa-brands fa-whatsapp", desc: "Menghubungi pemilik usaha langsung melalui WhatsApp." },
    ],
    tips: [
      "Lengkapi nomor WhatsApp aktif agar rekan alumni mudah memesan produk atau layanan Anda.",
    ],
  },
  {
    id: "fitur",
    route: "/fitur",
    title: "Pusat Menu & Fitur Angkatan",
    subtitle: "Gerbang Seluruh Layanan Alumni",
    category: "utama",
    categoryLabel: "Menu Utama",
    icon: "fa-solid fa-cubes",
    summary:
      "Hub terpadu yang memuat lebih dari 20 fitur layanan angkatan, mencakup KTA 3D, Photobooth, Kas Baitul Maal, Majlis Ilmu, Ruang Dzikir, Kalender Reuni, hingga Wasiat Kenangan.",
    howToUse: [
      "Pilih tab kategori di bagian atas untuk memfilter fitur.",
      "Pilih salah satu kartu layanan untuk membuka halamannya.",
      "Gunakan tombol Pintasan Cepat di bagian atas untuk membuka Obrolan, Direktori, Khatam, atau Kiblat.",
    ],
    controls: [
      { name: "Kartu Peluncur", icon: "fa-solid fa-arrow-right-long", desc: "Membuka halaman layanan yang dipilih." },
    ],
    tips: [
      "Seluruh fitur ibadah di bagian Spiritual & Hikmah dapat diakses langsung tanpa perlu masuk akun.",
    ],
  },
  {
    id: "profil",
    route: "/profil",
    title: "Profil Pribadi",
    subtitle: "Pengaturan Akun & Identitas Alumni",
    category: "utama",
    categoryLabel: "Menu Utama",
    icon: "fa-solid fa-circle-user",
    summary:
      "Halaman untuk mengelola informasi pribadi Anda di direktori, mengatur foto avatar, memperbarui nomor WhatsApp, tautan media sosial, serta melihat kartu anggota digital.",
    howToUse: [
      "Tekan tombol pada foto profil untuk mengunggah dan memotong foto terbaik Anda.",
      "Perbarui nama panggilan, nomor WhatsApp aktif, alamat domisili, dan cita-cita.",
      "Tekan 'Simpan Perubahan' agar data terbaru langsung tampil di Direktori.",
      "Ganti kata sandi, atur keamanan biometrik, atau ubah bahasa antarmuka pada tab Keamanan & Bahasa.",
    ],
    controls: [
      { name: "Ubah Foto Profil", icon: "fa-solid fa-camera", desc: "Pemotong foto rasio 1:1 untuk avatar profil Anda." },
      { name: "Simpan Perubahan", icon: "fa-solid fa-floppy-disk", desc: "Menyimpan data kontak dan informasi terbaru ke portal." },
      { name: "Keamanan & Bahasa", icon: "fa-solid fa-key", desc: "Mengubah sandi, bahasa (ID/AR/EN), dan kunci perangkat." },
      { name: "Kartu Alumni 3D", icon: "fa-solid fa-id-card", desc: "Membuka pratinjau kartu anggota digital Anda." },
    ],
    tips: [
      "Pastikan nomor WhatsApp menggunakan format aktif (misal: 6281234567890) agar tombol chat di direktori berfungsi.",
    ],
  },

  // =========================================================================
  // 2. KOMUNIKASI & INTERAKSI
  // =========================================================================
  {
    id: "chat-lounge",
    route: "/chat/lounge",
    title: "Obrolan Angkatan (Lounge)",
    subtitle: "Ruang Diskusi & Sapa Sahabat Bersama",
    category: "komunikasi",
    categoryLabel: "Komunikasi",
    icon: "fa-solid fa-comments",
    summary:
      "Ruang obrolan bersama seluruh anggota angkatan ke-43 untuk bertukar kabar, mengirim foto, pesan suara, maupun pesan video.",
    howToUse: [
      "Ketik pesan di kolom bawah lalu tekan ikon kirim atau Enter.",
      "Tekan ikon mikrofon untuk merekam Pesan Suara.",
      "Tekan ikon kamera untuk merekam Pesan Video.",
      "Gunakan tombol emotikon untuk menyisipkan emoji.",
    ],
    controls: [
      { name: "Kirim Pesan Suara", icon: "fa-solid fa-microphone", desc: "Merekam suara Anda sebagai audio player." },
      { name: "Pesan Video", icon: "fa-solid fa-video", desc: "Merekam video pesan singkat ke ruang obrolan." },
      { name: "Unggah Gambar", icon: "fa-solid fa-image", desc: "Membagikan foto kenangan langsung ke obrolan." },
      { name: "Emoji Picker", icon: "fa-regular fa-face-smile", desc: "Memilih emoji untuk percakapan." },
    ],
    tips: [
      "Pesan suara dan video didukung langsung di peramban seluler maupun komputer.",
    ],
  },
  {
    id: "chat-personal",
    route: "/chat/personal/[id]",
    title: "Obrolan Pribadi & Telepon",
    subtitle: "Percakapan Empat Mata & WebRTC Call",
    category: "komunikasi",
    categoryLabel: "Komunikasi",
    icon: "fa-solid fa-comment-dots",
    summary:
      "Ruang percakapan privat 1-lawan-1 antara Anda dan sahabat alumni, dilengkapi panggilan suara dan video langsung lewat peramban web.",
    howToUse: [
      "Pilih salah satu kawan dari Direktori atau daftar riwayat pesan di Kotak Pesan.",
      "Kirim pesan teks, gambar, suara, atau video pribadi.",
      "Tekan ikon telepon di sudut kanan atas untuk melakukan Panggilan Suara.",
      "Tekan ikon kamera video untuk melakukan Panggilan Video tatap muka.",
    ],
    controls: [
      { name: "Panggilan Suara", icon: "fa-solid fa-phone", desc: "Memulai panggilan suara jernih real-time via koneksi WebRTC." },
      { name: "Panggilan Video", icon: "fa-solid fa-video", desc: "Panggilan tatap muka langsung di layar peramban dengan sahabat." },
      { name: "Hapus Pesan", icon: "fa-solid fa-trash", desc: "Menghapus pesan Anda sendiri jika terdapat kekeliruan ketik." },
    ],
    tips: [
      "Pastikan Anda memberikan izin mikrofon dan kamera pada peramban saat pertama kali menggunakan fitur panggilan.",
    ],
  },
  {
    id: "birthday",
    route: "/birthday",
    title: "Pengingat Milad & Doa Sahabat",
    subtitle: "Kalender Ulang Tahun Rekan Seangkatan",
    category: "komunikasi",
    categoryLabel: "Komunikasi",
    icon: "fa-solid fa-cake-candles",
    summary:
      "Kalender otomatis yang mencatat tanggal lahir seluruh kawan seangkatan, mengingatkan hari milad mereka, serta menyediakan sarana mengirim doa dan ucapan selamat.",
    howToUse: [
      "Lihat daftar kawan yang berulang tahun pada hari ini atau minggu ini.",
      "Tekan tombol 'Kirim Doa' untuk menuliskan ucapan berkah umur dan kesuksesan.",
      "Ucapan Anda akan langsung masuk ke notifikasi akun sahabat tersebut.",
    ],
    controls: [
      { name: "Daftar Milad Hari Ini", icon: "fa-solid fa-calendar-day", desc: "Menampilkan sahabat yang sedang bertambah usia pada hari ini." },
      { name: "Kirim Ucapan & Doa", icon: "fa-solid fa-paper-plane", desc: "Mengirim kartu ucapan selamat yang menyentuh hati sahabat." },
    ],
    tips: [
      "Periksa kelengkapan tanggal lahir Anda di halaman Profil agar rekan-rekan bisa turut mendoakan saat hari milad Anda tiba.",
    ],
  },
  {
    id: "buku-tamu",
    route: "/buku-tamu",
    title: "Buku Tamu Digital",
    subtitle: "Catatan Kehadiran & Kesan Pesan Alumni",
    category: "komunikasi",
    categoryLabel: "Komunikasi",
    icon: "fa-solid fa-book-open-reader",
    summary:
      "Buku prasasti digital tempat seluruh anggota alumni menorehkan jejak kunjungan, salam persaudaraan, dan kesan pesan saat membuka portal.",
    howToUse: [
      "Tuliskan nama atau pesan singkat pada kolom isian buku tamu.",
      "Klik tombol 'Kirim Catatan'. Pesan Anda akan langsung diabadikan di dinding buku tamu.",
      "Baca kembali pesan-pesan haru dari rekan-rekan alumni dari berbagai penjuru kota.",
    ],
    controls: [
      { name: "Tulis Catatan", icon: "fa-solid fa-pen", desc: "Formulir pengisian pesan kenangan dan salam silaturahmi." },
      { name: "Urutkan Pesan", icon: "fa-solid fa-arrow-down-wide-short", desc: "Melihat pesan terbaru atau pesan terpopuler yang ditinggalkan alumni." },
    ],
    tips: [
      "Pesan yang ditinggalkan di buku tamu dapat dibaca oleh seluruh alumni yang berkunjung ke portal.",
    ],
  },
  {
    id: "event",
    route: "/event",
    title: "Agenda Acara & Reuni",
    subtitle: "Jadwal Temu Kangen, Buka Bersama & Silaturahmi",
    category: "komunikasi",
    categoryLabel: "Komunikasi",
    icon: "fa-solid fa-calendar-days",
    summary:
      "Pusat informasi kegiatan resmi angkatan, agenda buka puasa bersama, reuni akbar, silaturahmi konsulat, lengkap dengan hitung mundur waktu dan konfirmasi kehadiran (RSVP).",
    howToUse: [
      "Pilih acara yang ingin Anda hadiri dari daftar agenda.",
      "Baca rincian waktu, lokasi, dress code, dan susunan acara.",
      "Pilih status kehadiran Anda: 'Hadir', 'Ragu-ragu', atau 'Tidak Hadir'.",
      "Gunakan tombol petunjuk arah untuk membuka lokasi acara langsung di Google Maps.",
    ],
    controls: [
      { name: "Konfirmasi Kehadiran (RSVP)", icon: "fa-solid fa-circle-check", desc: "Membantu panitia mendata jumlah peserta, konsumsi, dan kapasitas ruang." },
      { name: "Buka Google Maps", icon: "fa-solid fa-location-arrow", desc: "Membuka navigasi peta jalan menuju lokasi acara secara akurat." },
      { name: "Hitung Mundur Acara", icon: "fa-solid fa-clock", desc: "Penghitung hari dan jam menuju pelaksanaan temu kangen." },
    ],
    tips: [
      "Segera lakukan konfirmasi kehadiran agar panitia reuni dapat mempersiapkan akomodasi terbaik untuk Anda.",
    ],
  },

  // =========================================================================
  // 3. SOSIAL, KEAGAMAAN & SPIRITUAL
  // =========================================================================
  {
    id: "baitul-maal",
    route: "/baitul-maal",
    title: "Kas & Donasi (Baitul Maal)",
    subtitle: "Transparansi Dana Sosial & Iuran Angkatan",
    category: "sosial",
    categoryLabel: "Sosial & Ibadah",
    icon: "fa-solid fa-hand-holding-dollar",
    summary:
      "Laporan terbuka keuangan kas angkatan, transparansi pemasukan/pengeluaran, serta saluran sedekah jariyah dan santunan duka cita bagi keluarga alumni yang membutuhkan.",
    howToUse: [
      "Pantau saldo kas terkini dan rincian mutasi dana angkatan.",
      "Salin nomor rekening resmi bendahara angkatan yang tertera di kartu rekening.",
      "Setelah melakukan transfer iuran atau sedekah, gunakan formulir konfirmasi untuk mengunggah bukti transfer.",
      "Lihat daftar program sosial dan penyaluran bantuan yang telah disalurkan pengurus.",
    ],
    controls: [
      { name: "Salin Nomor Rekening", icon: "fa-solid fa-copy", desc: "Menyalin nomor rekening bank/e-wallet bendahara secara cepat." },
      { name: "Konfirmasi Transfer", icon: "fa-solid fa-receipt", desc: "Formulir unggah struk bukti pengiriman dana kas/donasi." },
      { name: "Grafik Arus Kas", icon: "fa-solid fa-chart-pie", desc: "Diagram visual persentase alokasi dana sosial dan operasional angkatan." },
    ],
    tips: [
      "Seluruh laporan diverifikasi langsung oleh bendahara angkatan demi menjaga amanah dan transparansi dana umat.",
    ],
  },
  {
    id: "multazam",
    route: "/multazam",
    title: "Dinding Doa & Hajat (Multazam)",
    subtitle: "Titip Doa Bersama & Saling Mengaminkan",
    category: "sosial",
    categoryLabel: "Sosial & Ibadah",
    icon: "fa-solid fa-kaaba",
    summary:
      "Ruang spiritual persaudaraan tempat sahabat alumni saling menitipkan permohonan doa (kesehatan, kelancaran rezeki, jodoh, kemudahan ujian anak) dan saling mengaminkan satu sama lain.",
    howToUse: [
      "Tekan tombol 'Titip Doa' untuk menuliskan hajat atau permohonan doa Anda.",
      "Pilih kategori doa (Keluarga, Rezeki, Kesehatan, Umum).",
      "Saat membaca doa kawan, tekan tombol 'Aamiin' untuk turut mendoakan kebaikan bagi sahabat Anda.",
    ],
    controls: [
      { name: "Tombol Aamiin", icon: "fa-solid fa-hands-praying", desc: "Menambahkan doa Anda ke permohonan hajat kawan dengan efek pendar emas." },
      { name: "Titip Doa Baru", icon: "fa-solid fa-plus", desc: "Membuka formulir penulisan doa dan harapan Anda." },
      { name: "Filter Hajat", icon: "fa-solid fa-filter", desc: "Menyaring doa berdasarkan kategori permohonan." },
    ],
    tips: [
      "Doa seorang muslim untuk saudaranya tanpa sepengetahuannya adalah doa yang mustajab. Luangkan waktu sejenak mengaminkan doa kawan.",
    ],
  },
  {
    id: "majlis",
    route: "/majlis",
    title: "Majlis Kajian & Suara",
    subtitle: "Ruang Kajian Online & Audio Tausiyah",
    category: "sosial",
    categoryLabel: "Sosial & Ibadah",
    icon: "fa-solid fa-microphone-lines",
    summary:
      "Ruang audio kajian interaktif dan arsip tausiyah online. Tempat mendengarkan nasihat agama dari asatidz, pengajian rutin, dan bertukar pikiran seputar keilmuan Islam.",
    howToUse: [
      "Lihat jadwal kajian live yang akan datang.",
      "Saat sesi kajian live berlangsung, tekan 'Masuk Ruang Kajian' untuk mendengarkan audio pembicara.",
      "Gunakan kolom tanya jawab untuk mengajukan pertanyaan ke narasumber kajian.",
      "Dengarkan rekaman rekaman tausiyah terdahulu yang tersimpan di arsip audio.",
    ],
    controls: [
      { name: "Masuk Audio Kajian", icon: "fa-solid fa-headphones", desc: "Menyambungkan streaming audio kajian langsung ke speaker HP/laptop." },
      { name: "Kolom Tanya Jawab", icon: "fa-solid fa-circle-question", desc: "Mengirimkan pertanyaan seputar materi kajian yang sedang dibahas." },
      { name: "Arsip Rekaman", icon: "fa-solid fa-box-archive", desc: "Koleksi materi ceramah yang dapat didengar ulang kapan saja." },
    ],
    tips: [
      "Gunakan headset atau earphone untuk mendapatkan kualitas audio kajian yang lebih jernih.",
    ],
  },
  {
    id: "tarbiyah",
    route: "/tarbiyah",
    title: "Jejaring Karir & Konsultasi",
    subtitle: "Bimbingan Profesional & Pengembangan Diri",
    category: "sosial",
    categoryLabel: "Sosial & Ibadah",
    icon: "fa-solid fa-handshake-angle",
    summary:
      "Wadah sinergi pengembangan diri, konsultasi karir, bursa informasi lowongan kerja antar alumni, serta bimbingan keluarga dan keilmuan yang dipandu rekan-rekan yang berpengalaman.",
    howToUse: [
      "Cari topik bimbingan atau informasi lowongan pekerjaan yang sedang dibuka alumni.",
      "Ajukan pertanyaan atau konsultasi seputar dunia kerja, bisnis, atau pendidikan lanjutan.",
      "Bagikan peluang karir di perusahaan atau instansi Anda bagi kawan seangkatan yang membutuhkan.",
    ],
    controls: [
      { name: "Kirim Konsultasi", icon: "fa-solid fa-paper-plane", desc: "Mengajukan pertanyaan tertutup atau terbuka untuk didiskusikan." },
      { name: "Peluang Karir", icon: "fa-solid fa-briefcase", desc: "Daftar lowongan kerja yang divalidasi langsung oleh rekan seangkatan." },
    ],
    tips: [
      "Manfaatkan jejaring persaudaraan pondok untuk saling membuka jalan rezeki dan karir yang berkah.",
    ],
  },
  {
    id: "wasiat",
    route: "/wasiat",
    title: "Kotak Pesan & Wasiat Kenangan",
    subtitle: "Kapsul Waktu Pesan Persaudaraan",
    category: "sosial",
    categoryLabel: "Sosial & Ibadah",
    icon: "fa-solid fa-scroll",
    summary:
      "Fitur kapsul waktu untuk menyimpan pesan rahasia, nasihat kehidupan, atau catatan persahabatan yang baru dapat dibuka pada tahun peringatan tertentu di masa depan.",
    howToUse: [
      "Tuliskan pesan berharga Anda untuk seluruh angkatan atau untuk sahabat tertentu.",
      "Tentukan tanggal buka kunci kapsul waktu (misal: saat reuni 10 tahun atau 20 tahun).",
      "Kunci pesan Anda. Pesan akan tersimpan secara aman dan hanya dapat dibaca bersama saat waktunya tiba.",
    ],
    controls: [
      { name: "Kunci Pesan Kapsul", icon: "fa-solid fa-lock", desc: "Mengunci tulisan kenangan agar tidak bisa dibuka sebelum tanggal target." },
      { name: "Status Kapsul Terbuka", icon: "fa-solid fa-hourglass-half", desc: "Menampilkan hitungan mundur waktu pembukaan pesan rahasia." },
    ],
    tips: [
      "Tuliskan kenangan yang penuh makna, cita-cita masa pondok, atau pesan persaudaraan yang ingin Anda baca kembali di masa depan.",
    ],
  },
  {
    id: "kontemplasi",
    route: "/kontemplasi",
    title: "Ruang Dzikir & Ketenangan",
    subtitle: "Tafakkur Hening & Lantunan Murottal Al-Qur'an",
    category: "sosial",
    categoryLabel: "Sosial & Ibadah",
    icon: "fa-solid fa-spa",
    summary:
      "Ruang visual dan audio hening dengan suasana gelap minim distraksi. Menyajikan lantunan murottal surat-surat pilihan Al-Qur'an, dzikir pagi-petang, dan suara alam yang menyejukkan hati.",
    howToUse: [
      "Buka halaman ini saat Anda ingin beristirahat dari kesibukan dunia.",
      "Pilih surat Al-Qur'an atau tema dzikir yang ingin didengarkan.",
      "Tekan tombol 'Layar Penuh (Fullscreen)' untuk meredupkan seluruh antarmuka.",
      "Atur volume suara murottal dan suara alam sesuai kenyamanan Anda.",
    ],
    controls: [
      { name: "Pemutar Murottal", icon: "fa-solid fa-play", desc: "Memulai dan menjeda lantunan tilawah Al-Qur'an qari ternama." },
      { name: "Mode Layar Penuh", icon: "fa-solid fa-expand", desc: "Menghilangkan seluruh menu untuk fokus bertafakkur dan berdzikir." },
      { name: "Pilihan Audio Alam", icon: "fa-solid fa-cloud-rain", desc: "Kombinasi suara hujan, gemercik air, dan ketenangan malam." },
    ],
    tips: [
      "Sangat dianjurkan dibuka menjelang waktu istirahat malam atau sehabis shalat fardhu.",
    ],
  },

  // =========================================================================
  // 4. FITUR EKSKLUSIF & SATELIT
  // =========================================================================
  {
    id: "sovereign",
    route: "/sovereign",
    title: "Kartu Tanda Anggota (KTA 3D)",
    subtitle: "Identitas Digital Resmi Expedient 43",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-id-card",
    badge: "3D Three.js",
    summary:
      "Kartu Tanda Anggota (KTA) digital resmi dengan simulasi 3D Three.js realistis. Dilengkapi hologram berkilau, foto profil, data kelulusan, dan QR Code verifikasi anggota asli.",
    howToUse: [
      "Sentuh dan geser kartu untuk membalik tampak depan dan tampak belakang.",
      "Gunakan tombol di kanan atas untuk beralih antara tema 'Gold Night' atau 'Royal Pearl'.",
      "Tekan tombol 'Unduh KTA' (ikon download) untuk menyimpan berkas kartu identitas beresolusi tinggi ke galeri ponsel Anda.",
      "Tekan tombol 'Kembali' di pojok kiri atas untuk kembali ke halaman sebelumnya.",
    ],
    controls: [
      { name: "Putar Kartu 360°", icon: "fa-solid fa-arrows-rotate", desc: "Melihat kartu dari sudut manapun dengan pencahayaan dinamis." },
      { name: "Ganti Tema Kartu", icon: "fa-solid fa-sun", desc: "Pilihan tampilan kartu tema gelap emas atau putih mutiara elegan." },
      { name: "Simpan Gambar KTA (PNG)", icon: "fa-solid fa-download", desc: "Mengekspor kartu resolusi tinggi untuk dicetak atau disimpan di HP." },
      { name: "QR Code Verifikasi", icon: "fa-solid fa-qrcode", desc: "Kode QR yang jika dipindai akan membuktikan keaslian anggota alumni." },
    ],
    tips: [
      "Kartu KTA ini dapat digunakan sebagai tanda pengenal resmi saat menghadiri acara reuni akbar.",
    ],
  },
  {
    id: "photobooth",
    route: "/photobooth",
    title: "Studio Photobooth Virtual",
    subtitle: "Pembuat Photostrip 4-Pose Khas Reuni",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-camera-retro",
    badge: "Kamera Interaktif",
    summary:
      "Studio photobox virtual bergaya vintage. Anda dapat mengambil 4 foto berturut-turut, menambahkan bingkai resmi angkatan, filter warna nostalgia, stiker digital, lalu mengunduh photostrip siap cetak.",
    howToUse: [
      "Izinkan akses kamera pada peramban web ponsel atau laptop Anda.",
      "Pilih kamera depan atau belakang sesuai kenyamanan.",
      "Tekan tombol 'Mulai Berpose'. Kamera akan menghitung mundur (3-2-1) untuk setiap pose.",
      "Pilih warna bingkai photostrip dan stiker angkatan favorit Anda.",
      "Tekan 'Simpan Photostrip' untuk mengunduh hasil foto kenangan ke galeri HP.",
    ],
    controls: [
      { name: "Tombol Shutter", icon: "fa-solid fa-camera", desc: "Memulai sesi pemotretan otomatis 4 pose bergantian." },
      { name: "Balik Kamera", icon: "fa-solid fa-camera-rotate", desc: "Beralih antara lensa kamera depan dan lensa kamera belakang." },
      { name: "Pilihan Bingkai", icon: "fa-solid fa-palette", desc: "Beragam variasi bingkai warna emas, hitam klasik, dan pearl." },
      { name: "Simpan Hasil", icon: "fa-solid fa-download", desc: "Mengunduh photostrip vertikal beresolusi tajam siap bagikan ke medsos." },
    ],
    tips: [
      "Ajak kawan-kawan saat sedang berkumpul temu kangen untuk berfoto bersama di satu frame photostrip.",
    ],
  },
  {
    id: "scanner",
    route: "/scanner",
    title: "Pemindai QR Kontak (Scanner)",
    subtitle: "Scan Cepat KTA & Profil Rekan Alumni",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-qrcode",
    summary:
      "Pemindai kamera praktis untuk membaca QR Code pada kartu KTA atau layar HP kawan. Sekali scan, portal langsung membuka profil lengkap sahabat dan menawarkan tombol simpan kontak otomatis.",
    howToUse: [
      "Izinkan peramban mengakses kamera.",
      "Arahkan kotak bidik kamera ke QR Code yang ada di kartu fisik KTA atau HP rekan Anda.",
      "Sistem secara instan mendeteksi kode dan mengarahkan Anda ke profil alumni bersangkutan.",
    ],
    controls: [
      { name: "Jendela Bidik Kamera", icon: "fa-solid fa-expand", desc: "Area pemindaian kode respons cepat (QR Code)." },
      { name: "Balik Kamera", icon: "fa-solid fa-camera-rotate", desc: "Mengganti kamera depan atau belakang." },
    ],
    tips: [
      "Pastikan pencahayaan ruangan cukup terang saat mengarahkan kamera ke kode QR.",
    ],
  },
  {
    id: "wrapped",
    route: "/wrapped",
    title: "Kilas Balik Angkatan (Wrapped)",
    subtitle: "Rangkuman Statistik Kenangan Sepanjang Tahun",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-film",
    badge: "Story Interaktif",
    summary:
      "Rangkuman kilas balik interaktif ala Spotify Wrapped yang menampilkan statistik perjalanan Anda di portal: sahabat yang paling sering Anda sapa, foto kenangan terfavorit, serta jejak kebersamaan setahun.",
    howToUse: [
      "Tekan layar sebelah kanan untuk melanjutkan slide berikutnya, atau kiri untuk mengulang slide.",
      "Nikmati alunan musik latar dan visual animasi pergerakan data Anda.",
      "Pada slide terakhir, unduh kartu statistik kilas balik Anda untuk diunggah ke status WhatsApp atau Instagram.",
    ],
    controls: [
      { name: "Navigasi Slide Story", icon: "fa-solid fa-forward", desc: "Ketuk sisi layar untuk berpindah slide cerita." },
      { name: "Bagikan Rekap", icon: "fa-solid fa-share-nodes", desc: "Mengekspor gambar rangkuman tahunan untuk dibagikan." },
    ],
    tips: [
      "Fitur ini selalu diperbarui dengan momen-momen baru setiap pergantian tahun alumni.",
    ],
  },
  {
    id: "download",
    route: "/download",
    title: "Pusat Unduhan & Pasang Aplikasi",
    subtitle: "Panduan Instalasi di Android & iPhone (PWA)",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-download",
    summary:
      "Panduan cara memasang portal alumni langsung di layar utama ponsel Anda agar mudah diakses seperti aplikasi seluler.",
    howToUse: [
      "Untuk pengguna Android: Tekan tombol unduh APK pada halaman ini atau pasang melalui peramban Chrome ke layar utama.",
      "Untuk pengguna iPhone: Buka halaman ini di Safari, tekan tombol Share (ikon kotak bertanda panah atas), lalu pilih 'Add to Home Screen' (Tambah ke Layar Utama).",
      "Ikon aplikasi Expedient 43 akan muncul di layar ponsel dan dapat dibuka langsung tanpa mengetik ulang alamat situs.",
    ],
    controls: [
      { name: "Unduh Android (.APK)", icon: "fa-solid fa-download", desc: "Mengunduh paket resmi Android Expedient 43 untuk pemasangan langsung." },
      { name: "Panduan Langkah Demi Langkah", icon: "fa-solid fa-list-check", desc: "Tab instruksi pemasangan tertulis untuk Android APK, iPhone, dan Web App PWA." },
    ],
    tips: [
      "Memasang aplikasi di layar utama membuat notifikasi pesan obrolan dan telepon masuk menjadi lebih responsif.",
    ],
  },
  {
    id: "celestial",
    route: "/celestial",
    title: "Mutiara Hikmah & Nasihat",
    subtitle: "Untaian Petuah Bijak Guru & Pimpinan",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-star",
    summary:
      "Koleksi kutipan mutiara hikmah, petuah bijak dari para kyai, pimpinan pondok, dan asatidz yang senantiasa membimbing moral dan menuntun langkah perjuangan hidup alumni.",
    howToUse: [
      "Gulir daftar kutipan mutiara hikmah harian.",
      "Gunakan tombol salin kutipan untuk membagikannya ke grup WA keluarga atau status medsos.",
    ],
    controls: [
      { name: "Salin Hikmah", icon: "fa-solid fa-copy", desc: "Menyalin teks kutipan bijak ke papan klip." },
    ],
    tips: ["Jadikan untaian nasihat ini sebagai penyemangat harian di pagi hari."],
  },
  {
    id: "divine",
    route: "/divine",
    title: "Ayat & Refleksi Harian",
    subtitle: "Tadabbur Al-Qur'an & Hadits Pilihan",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-book-open",
    summary:
      "Ruang tadabbur yang menyajikan satu ayat Al-Qur'an dan hadits nabawi setiap hari beserta terjemahan dan hikmah amalannya bagi kehidupan modern.",
    howToUse: [
      "Baca ayat suci dan renungkan maknanya yang terpilih untuk hari ini.",
      "Simpan ayat ke daftar favorit Anda.",
    ],
    controls: [
      { name: "Putar Audio Ayat", icon: "fa-solid fa-volume-high", desc: "Mendengarkan bacaan qari untuk ayat harian." },
    ],
    tips: ["Luangkan waktu 2 menit setiap membuka portal untuk membaca tadabbur harian."],
  },
  {
    id: "genesis",
    route: "/genesis",
    title: "Sejarah & Filosofi Angkatan",
    subtitle: "Panca Jiwa & Nilai Dasar Pondok",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-landmark-dome",
    summary:
      "Dokumentasi asal-usul penamaan Expedient, lambang kebesaran angkatan ke-43, dan komitmen memegang teguh Panca Jiwa serta Motto Pondok sepanjang hayat.",
    howToUse: [
      "Pelajari makna filosofi lambang, warna bendera, dan motto angkatan.",
      "Kenali kembali nilai-nilai Panca Jiwa: Keikhlasan, Kesederhanaan, Berdikari, Ukhuwah Islamiyah, dan Kebebasan.",
    ],
    controls: [
      { name: "Jelajahi Filosofi", icon: "fa-solid fa-compass", desc: "Membuka penjelasan detail elemen lambang angkatan." },
    ],
    tips: ["Pengingat jati diri bahwa ke manapun kita melangkah, jiwa pondok selalu melekat di dada."],
  },
  {
    id: "nexus",
    route: "/nexus",
    title: "Pencocok Minat & Domisili",
    subtitle: "Temukan Sahabat Sehobi & Sekota",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-network-wired",
    summary:
      "Fitur pencocokan profil alumni berdasarkan kemiripan kota domisili, profesi, bidang keahlian, dan minat dari biodata.",
    howToUse: [
      "Tekan tombol pindai untuk menghitung skor kesamaan profil Anda dengan sesama alumni.",
      "Sistem akan menampilkan daftar sahabat dengan kecocokan domisili dan minat tertinggi.",
    ],
    controls: [
      { name: "Mulai Pencocokan", icon: "fa-solid fa-wand-magic-sparkles", desc: "Menjalankan algoritma pencari relasi sesama alumni." },
    ],
    tips: ["Lengkapi data minat dan hobi di Profil Anda agar pencocokan semakin akurat."],
  },
  {
    id: "enigma",
    route: "/enigma",
    title: "Catatan Kenangan Pribadi",
    subtitle: "Buku Harian & Jurnal Nyantri Terenkripsi",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-book-bookmark",
    summary:
      "Ruang catatan pribadi yang terenkripsi aman. Anda dapat menuliskan kenangan masa lalu, refleksi diri, resolusi masa depan, atau catatan rahasia yang hanya bisa dibaca oleh Anda sendiri.",
    howToUse: [
      "Tuliskan catatan baru dan berikan judul kenangan.",
      "Catatan Anda tersimpan secara privat dan tidak dapat dibaca oleh alumni lain.",
    ],
    controls: [
      { name: "Tambah Catatan", icon: "fa-solid fa-pen-to-square", desc: "Membuka lembar jurnal baru untuk ditulis." },
    ],
    tips: ["Gunakan sebagai sarana mengabadikan perjalanan hidup dan pelajaran berharga."],
  },
  {
    id: "oracle",
    route: "/oracle",
    title: "Kamera Aura Positif",
    subtitle: "Deteksi Senyum & Kutipan Semangat",
    category: "eksklusif",
    categoryLabel: "Fitur Satelit",
    icon: "fa-solid fa-camera",
    summary:
      "Fitur kamera interaktif yang menganalisis bingkai video dari kamera perangkat Anda dan menampilkan kutipan penyemangat persaudaraan.",
    howToUse: [
      "Buka kamera dan tersenyumlah ke arah lensa.",
      "Kamera akan mendeteksi ekspresi wajah Anda dan memberikan pesan motivasi sahabat.",
    ],
    controls: [
      { name: "Ambil Senyuman", icon: "fa-solid fa-camera", desc: "Memulai pemindaian ekspresi ceria." },
    ],
    tips: ["Senyum adalah sedekah. Bagikan energi positif ini ke sahabat seangkatan."],
  },

  // =========================================================================
  // 5. MODUL ADMINISTRATOR (PENGURUS)
  // =========================================================================
  {
    id: "admin-users",
    route: "/admin/users",
    title: "Kelola Pengguna & Alumni",
    subtitle: "Manajemen Akun, Verifikasi & Role Anggota",
    category: "admin",
    categoryLabel: "Kelola Admin",
    icon: "fa-solid fa-users-gear",
    badge: "Khusus Pengurus",
    summary:
      "Panel kontrol untuk memverifikasi pendaftaran alumni baru, mengatur hak akses (User biasa / Admin), mengatur status akun, serta mereset sandi jika ada anggota yang terkendala akses.",
    howToUse: [
      "Gunakan bilah cari untuk menemukan anggota berdasarkan nama atau email.",
      "Tekan tombol 'Ubah Role' untuk mengangkat anggota menjadi pengurus admin.",
      "Tekan tombol 'Nonaktifkan' jika terdapat akun ganda atau tidak dikenal.",
    ],
    controls: [
      { name: "Ubah Role Pengguna", icon: "fa-solid fa-user-shield", desc: "Mengubah level akses antara user biasa dan administrator." },
      { name: "Nonaktifkan Akun", icon: "fa-solid fa-user-slash", desc: "Mencegah akses sementara waktu bagi akun yang mencurigakan." },
    ],
    tips: ["Pastikan identitas pendaftar baru benar-benar diverifikasi sebagai alumni angkatan 43 sebelum disetujui."],
  },
  {
    id: "admin-cms",
    route: "/admin/cms",
    title: "Kelola Konten Website (CMS)",
    subtitle: "Ubah Teks, Galeri & Sambutan Tanpa Koding",
    category: "admin",
    categoryLabel: "Kelola Admin",
    icon: "fa-solid fa-pen-ruler",
    badge: "Khusus Pengurus",
    summary:
      "Sistem manajemen konten visual untuk memperbarui teks sambutan ketua, linimasa sejarah, foto galeri, dan pengumuman berjalan tanpa perlu menyentuh kode pemrograman.",
    howToUse: [
      "Pilih tab bagian konten yang ingin diperbarui (Beranda, Sejarah, Teks Pengumuman).",
      "Ubah teks atau unggah foto baru pada formulir yang disediakan.",
      "Foto yang diunggah otomatis dikompresi agar tidak melebihi batas serverless Vercel.",
      "Tekan tombol 'Simpan Perubahan' untuk langsung menerapkan ke website secara live.",
    ],
    controls: [
      { name: "Editor Teks Konten", icon: "fa-solid fa-font", desc: "Mengedit kalimat dan judul yang tampil di berbagai halaman." },
      { name: "Pengunggah Gambar Terkompresi", icon: "fa-solid fa-image", desc: "Mengunggah gambar baru dengan optimasi ukuran file instan." },
      { name: "Simpan CMS", icon: "fa-solid fa-floppy-disk", desc: "Menyimpan seluruh konfigurasi ke database utama Supabase." },
    ],
    tips: ["Gunakan foto horizontal berkualitas baik untuk banner halaman beranda."],
  },
  {
    id: "admin-broadcast",
    route: "/admin/broadcast",
    title: "Siaran Pengumuman Massal",
    subtitle: "Kirim Pesan Notifikasi Push & Email ke Alumni",
    category: "admin",
    categoryLabel: "Kelola Admin",
    icon: "fa-solid fa-bullhorn",
    badge: "Khusus Pengurus",
    summary:
      "Pusat siaran berita resmi untuk mengirimkan notifikasi push ke layar HP alumni dan pesan email massal terkait agenda reuni, berita duka, atau pengumuman darurat panitia.",
    howToUse: [
      "Tuliskan judul pengumuman dan isi pesan yang jelas.",
      "Pilih saluran pengiriman: Web Push Notification, Email, atau keduanya.",
      "Tentukan target penerima: Semua Alumni terdaftar atau per Konsulat wilayah.",
      "Tekan tombol 'Kirim Siaran Sekarang' untuk menyebarkan pengumuman.",
    ],
    controls: [
      { name: "Kirim Siaran", icon: "fa-solid fa-paper-plane", desc: "Menjalankan antrean pengiriman notifikasi massal secara real-time." },
      { name: "Filter Sasaran Wilayah", icon: "fa-solid fa-location-dot", desc: "Menyasar hanya alumni di wilayah atau konsulat tertentu." },
    ],
    tips: ["Gunakan fitur siaran secara bijak hanya untuk informasi penting dan mendesak."],
  },
  {
    id: "admin-moderation",
    route: "/admin/moderation",
    title: "Moderasi Pesan & Laporan",
    subtitle: "Pusat Pengawasan Ketertiban & Kenyamanan",
    category: "admin",
    categoryLabel: "Kelola Admin",
    icon: "fa-solid fa-shield-halved",
    badge: "Khusus Pengurus",
    summary:
      "Panel peninjauan laporan anggota mengenai pesan obrolan, foto kenangan, atau komentar yang melanggar norma kesopanan dan ukhuwah islamiyah.",
    howToUse: [
      "Periksa daftar laporan masuk dari anggota.",
      "Pilih tindakan: Hapus Konten yang melanggar atau Berikan Peringatan ke pembuat pesan.",
    ],
    controls: [
      { name: "Hapus Pesan Melanggar", icon: "fa-solid fa-trash-can", desc: "Menghapus konten yang tidak pantas dari obrolan publik." },
    ],
    tips: ["Utamakan pendekatan tabayyun dan silaturahmi sebelum mengambil tindakan tegas."],
  },
  {
    id: "admin-export",
    route: "/admin/export",
    title: "Ekspor & Cadangan Database",
    subtitle: "Unduh Data Kontak Excel / CSV / JSON",
    category: "admin",
    categoryLabel: "Kelola Admin",
    icon: "fa-solid fa-file-export",
    badge: "Khusus Pengurus",
    summary:
      "Alat pengunduhan buku kontak alumni format Excel/CSV untuk keperluan cetak buku kenangan fisik reuni akbar, arsip sekretariat, atau rekapitulasi data panitia.",
    howToUse: [
      "Pilih format berkas yang diinginkan: Excel (.xlsx), CSV, atau JSON.",
      "Tentukan kolom data yang ingin disertakan.",
      "Klik tombol 'Ekspor Data' untuk mengunduh berkas cadangan ke komputer Anda.",
    ],
    controls: [
      { name: "Unduh Excel", icon: "fa-solid fa-file-excel", desc: "Format tabel siap cetak dan olah di Microsoft Excel." },
    ],
    tips: ["Jaga kerahasiaan berkas data kontak alumni dan hindari menyebarkannya ke pihak luar."],
  },
  {
    id: "admin-wallet",
    route: "/admin/wallet-generator",
    title: "Generator KTA Massal",
    subtitle: "Pembuat Kartu Anggota Sekaligus",
    category: "admin",
    categoryLabel: "Kelola Admin",
    icon: "fa-solid fa-id-card-clip",
    badge: "Khusus Pengurus",
    summary:
      "Alat otomatis untuk menghasilkan file gambar kartu KTA digital untuk seluruh anggota terdaftar sekaligus dalam satu kali klik, dibundel dalam format arsip ZIP.",
    howToUse: [
      "Pilih konsulat atau seluruh anggota angkatan.",
      "Tekan tombol 'Generate Semua KTA'. Sistem akan merender kartu secara bertahap.",
      "Unduh berkas arsip ZIP berisi seluruh file KTA yang siap dibagikan.",
    ],
    controls: [
      { name: "Mulai Generator Batch", icon: "fa-solid fa-gears", desc: "Merender ribuan kartu KTA beresolusi tinggi di background." },
      { name: "Unduh Berkas ZIP", icon: "fa-solid fa-file-zipper", desc: "Mengunduh bundel seluruh kartu yang sudah selesai dirender." },
    ],
    tips: ["Pastikan koneksi internet stabil saat menjalankan proses rendering massal."],
  },
];

/**
 * Mencari data panduan berdasarkan rute path saat ini
 */
export function getGuideByPath(pathname: string): PageGuide | undefined {
  if (!pathname) return undefined;

  // 1. Exact match
  const exact = PAGE_GUIDES.find((g) => g.route === pathname);
  if (exact) return exact;

  // 2. Sub-route prefix match
  if (pathname.startsWith("/chat/personal")) {
    return PAGE_GUIDES.find((g) => g.id === "chat-personal");
  }
  if (pathname.startsWith("/admin/users")) {
    return PAGE_GUIDES.find((g) => g.id === "admin-users");
  }
  if (pathname.startsWith("/admin/cms")) {
    return PAGE_GUIDES.find((g) => g.id === "admin-cms");
  }
  if (pathname.startsWith("/admin/broadcast")) {
    return PAGE_GUIDES.find((g) => g.id === "admin-broadcast");
  }
  if (pathname.startsWith("/admin/moderation")) {
    return PAGE_GUIDES.find((g) => g.id === "admin-moderation");
  }
  if (pathname.startsWith("/admin/export")) {
    return PAGE_GUIDES.find((g) => g.id === "admin-export");
  }
  if (pathname.startsWith("/admin/wallet-generator")) {
    return PAGE_GUIDES.find((g) => g.id === "admin-wallet");
  }

  // 3. General prefix match
  return PAGE_GUIDES.find((g) => pathname.startsWith(g.route) && g.route !== "/");
}
