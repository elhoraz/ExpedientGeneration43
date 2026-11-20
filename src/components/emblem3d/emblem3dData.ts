export interface ShardDef {
  id: number;
  key: string;
  title: string;
  shortTitle: string;
  category: string;
  desc: string;
  color: string;
  desktopPos: { nx: number; ny: number; nz: number };
  mobilePos: { nx: number; ny: number; nz: number };
  scaleBoost?: number;
}

export interface LocalizedShardText {
  title: string;
  desc: string;
}

export interface CoreParticle {
  baseX: number;
  baseY: number;
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  baseSpeed: number;
  size: number;
  glow: number;
  baseGlow: number;
  offsetX: number;
  offsetY: number;
}

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  lineWidth: number;
  color: string;
}

export interface BurstSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface ShardRuntime {
  def: ShardDef;
  obj: any;
  assembledPos: any; // THREE.Vector3
  localMaxDim: number;
  scatterTarget: { x: number; y: number; z: number; scale: number };
  velY: number;
  velX: number;
  floatPhase: number;
  hoverMult: number;
  isHovered: boolean;
  screenX: number;
  screenY: number;
  hitRadiusPx: number;
}

export const SHARD_DEFS: ShardDef[] = [
  {
    id: 1,
    key: "01_Bumi_Syahadat_Kitab",
    title: "Bumi dengan 2 Lafadz Syahadat, Pena Bulu Emas dan Dua Kitab",
    shortTitle: "Bumi, Syahadat, Pena & 2 Kitab",
    category: "Inti Spiritualitas & Khalifah",
    desc: "Melambangkan yang menyiratkan makna QS. Al-Baqarah : 30 sebagai pemimpin di bumi yang mempunyai misi dalam menyebarluaskan ajaran, nilai, dan syariat Islam yang benar ke seluruh jagat raya. Pena bulu emas dan dua kitab melambangkan kewajiban alumni Expedient Generation dalam menjalankan amanah yang berdasarkan Al-Qur'an & As-Sunnah.",
    color: "#64b5f6",
    desktopPos: { nx: 0.0, ny: 0.02, nz: 0.25 },
    mobilePos: { nx: 0.0, ny: 0.09, nz: 0.2 },
    scaleBoost: 0.92,
  },
  {
    id: 2,
    key: "02_Tulisan_Almamater",
    title: "Tulisan Almamater",
    shortTitle: "Tulisan Almamater (43rd Arrisalah)",
    category: "Doa & Identitas Generasi",
    desc: "Sebagai doa agar alumni Arrisalah tahun 2025 menjadi alumni yang husnul khotimah dan membangun kejayaan risalah Nabi Muhammad SAW.",
    color: "#cfd8dc",
    desktopPos: { nx: -0.34, ny: 0.29, nz: 0.05 },
    mobilePos: { nx: -0.31, ny: 0.30, nz: 0.0 },
    scaleBoost: 1.0,
  },
  {
    id: 3,
    key: "03_Cincin_Emas",
    title: "Cincin Emas",
    shortTitle: "Cincin Emas",
    category: "Tekad & Visi Masa Depan",
    desc: "Cincin emas bermakna kekuatan dan sesuatu yang berharga, melambangkan tekad yang kuat, serta karakter yang visioner.",
    color: "#f1c40f",
    desktopPos: { nx: 0.0, ny: 0.33, nz: 0.05 },
    mobilePos: { nx: 0.0, ny: 0.34, nz: 0.0 },
    scaleBoost: 1.0,
  },
  {
    id: 4,
    key: "04_Selendang_Putih",
    title: "Selendang Berwarna Putih",
    shortTitle: "Selendang Putih",
    category: "Ukhuwwah Islamiyyah",
    desc: "Selendang melambangkan persaudaraan yang erat dan solid, berdasarkan asas iman dan agama Islam yang harus dijaga kesuciannya.",
    color: "#f8fafc",
    desktopPos: { nx: 0.34, ny: 0.29, nz: 0.05 },
    mobilePos: { nx: 0.31, ny: 0.30, nz: 0.0 },
    scaleBoost: 1.08,
  },
  {
    id: 5,
    key: "05_Bendera_Pondok_Modern",
    title: "Bendera Pondok Modern",
    shortTitle: "Bendera Pondok Modern",
    category: "Kehormatan Lembaga",
    desc: "Merupakan simbol Pondok Modern sebagai lembaga pendidikan yang selalu berada di atas dan untuk semua golongan.",
    color: "#27ae60",
    desktopPos: { nx: -0.41, ny: 0.02, nz: 0.1 },
    mobilePos: { nx: -0.33, ny: 0.10, nz: 0.05 },
    scaleBoost: 0.36,
  },
  {
    id: 6,
    key: "06_Kelopak_Tungsten",
    title: "Kelopak Logam Mulia Tungsten",
    shortTitle: "Kelopak Logam Tungsten",
    category: "Perisai Keteguhan",
    desc: "Kelopak logam mulia tungsten merupakan material terkuat di dunia yang melambangkan perisai diri yang kuat dari godaan syaitan yang terkutuk.",
    color: "#90a4ae",
    desktopPos: { nx: 0.41, ny: 0.02, nz: 0.1 },
    mobilePos: { nx: 0.33, ny: 0.10, nz: 0.05 },
    scaleBoost: 1.05,
  },
  {
    id: 7,
    key: "07_Perisai_Rub_Al_Hizb",
    title: "Perisai Rub Al-Hizb",
    shortTitle: "Perisai Rub Al-Hizb",
    category: "Benteng Al-Qur'an",
    desc: "Bentuk segi delapan ini merepresentasikan Rub Al-Hizb, simbol klasik pembatas ayat Al-Qur'an, yang melambangkan komitmen alumni sebagai benteng iman dan pengamal kalam suci. Delapan sudutnya melambangkan delapan pintu surga sekaligus kesiapan menyebarkan kemaslahatan rahmatan lil-'alamin ke delapan penjuru mata angin. Dibalut kilau perak (Al-Fidhdhah) yang terinspirasi dari keindahan perhiasan surga (QS. Al-Insan: 21), simbol ini menegaskan karakter alumni yang tangguh, adaptif, dan berharga tinggi, namun tetap bersahaja dalam kerendahan hati (tawadhu).",
    color: "#e2e8f0",
    desktopPos: { nx: -0.34, ny: -0.24, nz: 0.0 },
    mobilePos: { nx: -0.28, ny: -0.04, nz: 0.0 },
    scaleBoost: 0.96,
  },
  {
    id: 8,
    key: "08_Kelopak_Blue_Marble",
    title: "Kelopak Blue Marble",
    shortTitle: "Kelopak Blue Marble",
    category: "Kelestarian Jagat",
    desc: "Merupakan sebutan pertama kali untuk foto bumi yang pertama, yang diambil pada 7 Desember 1972, melambangkan gerakan dalam menjaga dan melestarikan bumi sebagai amanah yang dibebankan kepada seluruh umat manusia sesuai dengan QS. Al-Baqarah: 56. Memicu perlunya pembangkitan berkelanjutan untuk menjaga planet. Kepercayaan, loyalitas, tanggung jawab, keamanan simbol surga spiritualitas. Dan berlist-kan emas melambangkan bahwa alumni Arrisalah tahun 2025 adalah sesuatu yang berharga.",
    color: "#00d2ff",
    desktopPos: { nx: 0.0, ny: -0.27, nz: 0.0 },
    mobilePos: { nx: 0.28, ny: -0.04, nz: 0.0 },
    scaleBoost: 1.0,
  },
  {
    id: 9,
    key: "09_Tanduk_Rusa_Emas",
    title: "Tanduk Rusa Emas Berlafazkan Muhammad SAW",
    shortTitle: "Tanduk Emas & Batu Ratna Ruby",
    category: "Fondasi Tauhid & Risalah",
    desc: "Melambangkan semangat yang tinggi dalam menggapai cita-cita yang mulia, sebagai simbol regenerasi dan kebangkitan risalah Nabi Muhammad SAW. Kehadiran batu rubi merah di poros tengah bawah mengambil makna dari istilah bahasa Sanskerta Ratna yang berarti permata paling berharga. Batu Ratna ini merepresentasikan prinsip ketauhidan sebagai pondasi utama yang tunggal dan utuh. Posisinya yang diletakkan di bagian paling bawah menegaskan bahwa seluruh pergerakan, semangat perjuangan, dan cita-cita alumni harus berakar kuat pada asas tauhid yang kokoh kepada Allah SWT.",
    color: "#e74c3c",
    desktopPos: { nx: 0.34, ny: -0.24, nz: 0.0 },
    mobilePos: { nx: 0.0, ny: -0.16, nz: 0.0 },
    scaleBoost: 1.08,
  },
  {
    id: 10,
    key: "10_Perisai_Baja_Segi8",
    title: "Perisai Baja Berbentuk Segi 8",
    shortTitle: "Perisai Baja Segi 8",
    category: "Asas Islam & Rahmatan Lil-'Alamin",
    desc: "Menggambarkan asas Islam yang kokoh dan delapan arah mata angin yang memberi dampak pemberdayaan potensi yang memancar ke seluruh penjuru alam (rahmatan lil-alamin), serta menyiratkan makna seperti dalam QS. Al-Baqarah: 115, yakni kemanapun kamu menghadap, disanalah wajah-Nya.",
    color: "#607d8b",
    desktopPos: { nx: -0.18, ny: 0.17, nz: 0.08 },
    mobilePos: { nx: -0.29, ny: -0.15, nz: 0.0 },
    scaleBoost: 0.92,
  },
  {
    id: 11,
    key: "11_Mahkota_Emas",
    title: "Mahkota Emas Berlambangkan Allah SWT",
    shortTitle: "Mahkota Emas (Allah SWT)",
    category: "Kedaulatan Ilahiah",
    desc: "Melambangkan kekuasaan, keabadian, kebijaksanaan dan legitimasi. Simbol ini terletak di atas melambangkan bahwa Allah SWT yang Maha Esa dan segala aspek kehidupan ini bermuara kepada-Nya tiada daya dan upaya selain dari kehendak Allah Taala.",
    color: "#ffd700",
    desktopPos: { nx: 0.18, ny: 0.17, nz: 0.08 },
    mobilePos: { nx: 0.29, ny: -0.15, nz: 0.0 },
    scaleBoost: 1.08,
  },
  {
    id: 12,
    key: "12_Lima_Permata",
    title: "Lima Permata",
    shortTitle: "Lima Permata (5 Rukun Islam)",
    category: "Lima Rukun Islam",
    desc: "Lima permata bermakna lima rukun Islam yang mendasari berdirinya agama Islam.",
    color: "#38bdf8",
    desktopPos: { nx: -0.18, ny: -0.14, nz: 0.12 },
    mobilePos: { nx: -0.17, ny: 0.21, nz: 0.05 },
    scaleBoost: 1.15,
  },
  {
    id: 13,
    key: "13_Enam_Batu_Zamrud",
    title: "Enam Batu Zamrud",
    shortTitle: "Enam Batu Zamrud (6 Rukun Iman)",
    category: "Enam Rukun Iman",
    desc: "Enam batu zamrud sebagai simbol kemakmuran dan kelimpahan yang melambangkan enam rukun iman sebagai asas dasar keyakinan seorang muslim.",
    color: "#10b981",
    desktopPos: { nx: 0.18, ny: -0.14, nz: 0.12 },
    mobilePos: { nx: 0.17, ny: 0.21, nz: 0.05 },
    scaleBoost: 1.12,
  },
];

export const SHARD_BY_KEY = new Map<string, ShardDef>(SHARD_DEFS.map((s) => [s.key, s]));

export const DEFAULT_LORE_QUOTES = [
  '"Dan bersabarlah kamu bersama-sama dengan orang-orang yang menyeru Tuhannya di pagi dan senja hari..." (Al-Kahfi: 28)',
  '"Niscaya Allah akan meninggikan orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu pengetahuan..." (Al-Mujadilah: 11)',
  '"Dan berpeganglah kamu semuanya kepada tali (agama) Allah, dan janganlah kamu bercerai berai..." (Ali Imran: 103)',
  '"Maka sesungguhnya sesudah kesulitan itu ada kemudahan..." (Al-Insyirah: 5)',
  '"Bukanlah golongan kami orang yang tidak menyayangi yang muda dan tidak menghormati yang tua." (HR. Tirmidzi)',
];

// Architectural Z-depth / assembly hierarchy & pre-dock rail offsets
export const RAIL_OFFSETS: Record<string, { dx: number; dy: number; dz: number; tier: number }> = {
  "10_Perisai_Baja_Segi8": { dx: 0.0, dy: 0.0, dz: -0.42, tier: 0 },
  "07_Perisai_Rub_Al_Hizb": { dx: 0.0, dy: 0.0, dz: -0.24, tier: 0 },
  "04_Selendang_Putih": { dx: 0.0, dy: -0.32, dz: 0.1, tier: 1 },
  "08_Kelopak_Blue_Marble": { dx: 0.0, dy: 0.14, dz: 0.22, tier: 1 },
  "06_Kelopak_Tungsten": { dx: 0.0, dy: -0.18, dz: 0.34, tier: 1 },
  "01_Bumi_Syahadat_Kitab": { dx: 0.0, dy: 0.0, dz: 0.45, tier: 2 },
  "03_Cincin_Emas": { dx: 0.0, dy: 0.0, dz: 0.62, tier: 2 },
  "02_Tulisan_Almamater": { dx: 0.0, dy: 0.0, dz: 0.76, tier: 2 },
  "05_Bendera_Pondok_Modern": { dx: 0.0, dy: -0.16, dz: 0.88, tier: 3 },
  "11_Mahkota_Emas": { dx: 0.0, dy: 0.38, dz: 0.72, tier: 3 },
  "09_Tanduk_Rusa_Emas": { dx: 0.0, dy: -0.38, dz: 0.84, tier: 3 },
  "13_Enam_Batu_Zamrud": { dx: 0.0, dy: 0.0, dz: 1.05, tier: 4 },
  "12_Lima_Permata": { dx: 0.0, dy: 0.0, dz: 1.15, tier: 4 },
};
