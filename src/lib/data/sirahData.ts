export type SirahPhase = 'all' | 'makkah' | 'madinah' | 'battle' | 'peace';

export interface HistoricPlace {
  id: string;
  name: string;
  arabic: string;
  region: string;
  // Normalized 2D canvas coordinates (0 - 1000 range for map projection)
  mapX: number;
  mapY: number;
  description: string;
  significance: string;
  distanceInfo: string;
}

export interface LeadershipPillar {
  title: string;
  lesson: string;
  modernApplication: string;
}

export interface SirahEvent {
  id: string;
  title: string;
  arabicTitle: string;
  yearM: number;
  yearH?: number;
  dateString: string;
  phase: 'makkah' | 'madinah';
  category: 'revelation' | 'migration' | 'battle' | 'treaty' | 'milestone';
  locationId: string;
  summary: string;
  detailedStory: string;
  leadership: LeadershipPillar;
  quranRef?: string;
  routeId?: string;
}

export interface SirahRoute {
  id: string;
  name: string;
  arabicName: string;
  color: string;
  waypoints: { x: number; y: number; label: string }[];
  description: string;
}

export const SIRAH_PLACES: HistoricPlace[] = [
  {
    id: "makkah",
    name: "Kota Makkah Al-Mukarramah",
    arabic: "مَكَّة الْمُكَرَّمَة",
    region: "Hijaz Selatan",
    mapX: 420,
    mapY: 650,
    description: "Kota suci tempat Ka'bah berdiri, tempat lahir Baginda Nabi Muhammad SAW dan pusat turunnya fase dakwah tauhid awal.",
    significance: "Kiblat umat Islam dunia dan titik tolak revolusi spiritual peradaban manusia.",
    distanceInfo: "Pusat rujukan sejarah peradaban Hijaz"
  },
  {
    id: "gua-hira",
    name: "Gua Hira' (Jabal An-Nur)",
    arabic: "غَار حِرَاء",
    region: "Pegunungan Makkah",
    mapX: 435,
    mapY: 630,
    description: "Gua kecil di puncak Jabal An-Nur tempat Nabi bertahannuts dan menerima wahyu perdana (Iqra') melalui Malaikat Jibril.",
    significance: "Gerbang permulaan kenabian dan turunnya peradaban literasi Al-Qur'an.",
    distanceInfo: "± 6 km timur laut dari Masjidil Haram"
  },
  {
    id: "gua-tsur",
    name: "Gua Tsur (Jabal Tsur)",
    arabic: "غَار ثَوْر",
    region: "Selatan Makkah",
    mapX: 410,
    mapY: 680,
    description: "Gua persembunyian Nabi SAW dan Abu Bakr Ash-Shiddiq selama tiga malam saat menghindari kejaran pasukan Quraisy dalam perjalanan Hijrah.",
    significance: "Monumen keteladanan tawakal total dan ikhtiar strategis tingkat tinggi.",
    distanceInfo: "± 5 km selatan Masjidil Haram"
  },
  {
    id: "yatsrib",
    name: "Madinah Al-Munawwarah (Yatsrib)",
    arabic: "الْمَدِينَة الْمُنَوَّرَة",
    region: "Hijaz Utara",
    mapX: 380,
    mapY: 360,
    description: "Kota oase bercahaya yang menyambut kedatangan kaum Muhajirin dan menjadi ibukota Daulah Islamiyah pertama.",
    significance: "Pusat pembinaan masyarakat majemuk berperadaban, tempat Piagam Madinah ditegakkan.",
    distanceInfo: "± 450 km utara dari Makkah"
  },
  {
    id: "quba",
    name: "Masjid Quba",
    arabic: "مَسْجِد قُبَاء",
    region: "Pinggiran Madinah",
    mapX: 385,
    mapY: 380,
    description: "Masjid pertama yang dibangun dalam sejarah Islam atas dasar ketakwaan saat Nabi tiba di Madinah sebelum memasuki pusat kota.",
    significance: "Fondasi pertama peletakan tata kelola masyarakat berbasis masjid.",
    distanceInfo: "± 4 km barat daya Masjid Nabawi"
  },
  {
    id: "badr",
    name: "Lembah Badr",
    arabic: "بَدْر",
    region: "Antara Makkah & Madinah",
    mapX: 280,
    mapY: 480,
    description: "Lembah strategis dekat pesisir Laut Merah tempat terjadinya perang penentuan eksistensi Islam pada 17 Ramadhan 2 H.",
    significance: "Yaumul Furqan (Hari Pembeda) antara kebenaran hakiki dan kebatilan.",
    distanceInfo: "± 150 km barat daya Madinah"
  },
  {
    id: "uhud",
    name: "Gunung Uhud & Jabal Rumat",
    arabic: "جَبَل أُحُد",
    region: "Utara Madinah",
    mapX: 390,
    mapY: 340,
    description: "Gunung batu megah tempat berlangsungnya Perang Uhud (Syawal 3 H) dan makam para syuhada termasuk Hamzah bin Abdul Muthalib.",
    significance: "Pelajaran mahal tentang kepatuhan komando dan bahaya godaan materi.",
    distanceInfo: "± 5 km utara Masjid Nabawi"
  },
  {
    id: "khandaq",
    name: "Parit Khandaq (Jabal Sal')",
    arabic: "الْخَنْدَق",
    region: "Barat-Utara Madinah",
    mapX: 365,
    mapY: 355,
    description: "Garis galian parit pertahanan sepanjang Madinah utara dalam Perang Ahzab atas usulan jenius sahabat Salman Al-Farisi.",
    significance: "Simbol kemenangan pertahanan asimetris dan diplomasi psikologis.",
    distanceInfo: "Melindungi sisi utara kota Madinah"
  },
  {
    id: "hudaibiyah",
    name: "Lembah Hudaibiyah (Syumaisi)",
    arabic: "الْحُدَيْبِيَة",
    region: "Perbatasan Barat Makkah",
    mapX: 395,
    mapY: 645,
    description: "Tempat lahirnya Perjanjian Hudaibiyah (6 H) dan Bai'at Ridhwan di bawah pohon Samurah.",
    significance: "Kemenangan diplomasi nyata (Fathan Mubina) yang melipatgandakan jumlah kaum muslimin.",
    distanceInfo: "± 22 km barat Makkah arah Jeddah"
  },
  {
    id: "khaibar",
    name: "Benteng Khaibar",
    arabic: "خَيْبَر",
    region: "Utara Madinah",
    mapX: 410,
    mapY: 220,
    description: "Kompleks benteng kokoh di tanah oase vulkanik subur yang berhasil dibebaskan pada 7 H di bawah kepemimpinan Ali bin Abi Thalib.",
    significance: "Penetralisir ancaman koalisi konspirasi dan sumber stabilitas ekonomi pangan muslim.",
    distanceInfo: "± 165 km utara Madinah"
  },
  {
    id: "tabuk",
    name: "Oase Tabuk",
    arabic: "تَبُوك",
    region: "Perbatasan Syam (Utara)",
    mapX: 320,
    mapY: 100,
    description: "Titik terjauh ekspedisi militer Nabi SAW (9 H) dalam menghadapi kekaisaran Romawi Timur di musim kemarau ekstrem (Jaisyul Usyrah).",
    significance: "Ujian ketulusan iman tertinggi dan pengakuan hegemoni Islam oleh penguasa Syam.",
    distanceInfo: "± 680 km barat laut Madinah"
  },
  {
    id: "thaif",
    name: "Kota Tha'if",
    arabic: "الطَّائِف",
    region: "Dataran Tinggi Hijaz",
    mapX: 480,
    mapY: 690,
    description: "Kota sejuk berhawa dingin tempat Nabi berdakwah pasca wafatnya Khadijah, disambut lemparan batu namun didoakan ampunan oleh Nabi.",
    significance: "Puncak keagungan akhlak pemaaf dan ketabahan luar biasa seorang pemimpin.",
    distanceInfo: "± 85 km tenggara Makkah"
  },
  {
    id: "al-quds",
    name: "Masjid Al-Aqsha (Al-Quds)",
    arabic: "الْمَسْجِد الْأَقْصَى",
    region: "Palestina / Syam",
    mapX: 340,
    mapY: 20,
    description: "Titik pemberhentian Isra' sebelum Nabi SAW dinaikkan dalam Mi'raj menuju Sidratul Muntaha.",
    significance: "Kiblat pertama umat Islam dan tanah suci ketiga warisan para nabi.",
    distanceInfo: "± 1.250 km utara Makkah"
  }
];

export const SIRAH_ROUTES: SirahRoute[] = [
  {
    id: "hijrah",
    name: "Rute Hijrah Akbar Nabi & Abu Bakr",
    arabicName: "طَرِيقُ الْهِجْرَةِ النَّبَوِيَّةِ",
    color: "#d4af37",
    waypoints: [
      { x: 420, y: 650, label: "Makkah (Mulai)" },
      { x: 410, y: 680, label: "Gua Tsur (3 Malam)" },
      { x: 350, y: 600, label: "Pesisir Laut Merah" },
      { x: 310, y: 490, label: "Jalur Tak Lazim" },
      { x: 385, y: 380, label: "Quba (Masjid Pertama)" },
      { x: 380, y: 360, label: "Madinah (Tiba)" }
    ],
    description: "Perjalanan epik sejauh ±480 km memutar melalui jalur pantai tak lazim selama 8 hari demi mengecoh intelijen Quraisy."
  },
  {
    id: "badr-expedition",
    name: "Rute Ekspedisi Perang Badr",
    arabicName: "مَسِيرُ غَزْوَةِ بَدْرٍ الْكُبْرَى",
    color: "#10b981",
    waypoints: [
      { x: 380, y: 360, label: "Madinah" },
      { x: 330, y: 420, label: "Lembah Dzaqab" },
      { x: 280, y: 480, label: "Mata Air Badr" }
    ],
    description: "Pergerakan 313 mujahid mukmin dari Madinah menuju lembah Badr untuk menghadang hegemoni zalim Quraisy."
  },
  {
    id: "fathu-makkah",
    name: "Rute Pembebasan Fathu Makkah",
    arabicName: "طَرِيقُ فَتْحِ مَكَّةَ",
    color: "#f59e0b",
    waypoints: [
      { x: 380, y: 360, label: "Madinah (10.000 Pasukan)" },
      { x: 390, y: 470, label: "Marruz Zhahran" },
      { x: 420, y: 650, label: "Makkah (Amnesti Umum)" }
    ],
    description: "Pawasi damai 10.000 pasukan pada 20 Ramadhan 8 H memasuki Makkah dari 4 penjuru tanpa pertumpahan darah."
  }
];

export const SIRAH_EVENTS: SirahEvent[] = [
  {
    id: "kelahiran-nabi",
    title: "Kelahiran Sang Pembawa Risalah",
    arabicTitle: "مَوْلِدُ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ",
    yearM: 571,
    dateString: "12 Rabi'ul Awwal 571 M (Tahun Gajah)",
    phase: "makkah",
    category: "milestone",
    locationId: "makkah",
    summary: "Kelahiran Muhammad bin Abdullah di kota Makkah sebagai yatim, disambut runtuhnya kesombongan pasukan gajah Abrahah.",
    detailedStory: "Lahir dalam keadaan yatim dari kabilah Bani Hasyim suku Quraisy. Masa kecil beliau diasuh di padang pasir oleh Halimah As-Sa'diyah, menumbuhkan kefasihan bahasa, kebugaran raga, dan kebersihan jiwa yang jauh dari polusi hedonisme kota.",
    leadership: {
      title: "Karakter Integritas Sejak Dini (Al-Amin)",
      lesson: "Sebelum memegang mandat risalah, Nabi telah membangun reputasi tak terbantahkan sebagai 'Al-Amin' (Sosok Paling Terpercaya) melalui kejujuran dalam berdagang dan bertutur kata.",
      modernApplication: "Modal utama seorang pemimpin sebelum meminta orang lain mengikutinya adalah integritas moral dan rekam jejak kejujuran yang nyata di tengah komunitas."
    },
    quranRef: "QS. Al-Anbiya': 107"
  },
  {
    id: "wahyu-pertama",
    title: "Wahyu Perdana di Gua Hira' (Iqra')",
    arabicTitle: "بِدَايَةُ الْوَحْيِ فِي غَارِ حِرَاءٍ",
    yearM: 610,
    dateString: "17 Ramadhan 610 M (Usia 40 Tahun)",
    phase: "makkah",
    category: "revelation",
    locationId: "gua-hira",
    summary: "Turunnya Malaikat Jibril menyampaikan 5 ayat pertama Surah Al-'Alaq, menandai fajar peradaban ilmu dan berakhirnya zaman jahiliyah.",
    detailedStory: "Di tengah keheningan Gua Hira' yang terjal, Nabi SAW berkontemplasi mencari kebenaran. Jibril memeluk beliau tiga kali sambil menyerukan 'Iqra'!' (Bacalah!). Pulang dengan tubuh menggigil, beliau diselimuti dan ditenangkan oleh sang istri tercinta, Sayyidah Khadijah RA.",
    leadership: {
      title: "Peradaban Berbasis Ilmu & Support System Keluarga",
      lesson: "Perintah pertama Islam bukan perang atau ekonomi, melainkan 'Iqra'' (membaca, meneliti, dan memahami). Peran Khadijah membuktikan betapa vitalnya pendamping yang cerdas dan menenangkan saat pemimpin menghadapi guncangan awal visi besar.",
      modernApplication: "Setiap lompatan peradaban harus dimulai dengan riset dan literasi mendalam, ditopang oleh keluarga yang menjadi jangkar ketenangan emosional."
    },
    quranRef: "QS. Al-'Alaq: 1-5"
  },
  {
    id: "dakwah-shafa",
    title: "Seruan Terbuka di Bukit Shafa",
    arabicTitle: "الدَّعْوَةُ جَهْرًا عَلَى جَبَلِ الصَّفَا",
    yearM: 613,
    dateString: "Tahun ke-3 Kenabian (613 M)",
    phase: "makkah",
    category: "milestone",
    locationId: "makkah",
    summary: "Nabi menaiki Bukit Shafa menyeru seluruh kabilah Quraisy untuk memeluk tauhid dan meninggalkan penyembahan berhala.",
    detailedStory: "Nabi bertanya: 'Jika aku kabarkan ada pasukan berkuda musuh di balik lembah ini hendak menyerang kalian, apakah kalian percaya?' Mereka serempak menjawab: 'Tentu! Kami belum pernah mendapati engkau berdusta!' Namun saat Nabi menyeru tauhid, Abu Lahab mencela dan memusuhi beliau.",
    leadership: {
      title: "Menguji Kredibilitas Sebelum Menyampaikan Pesan Berat",
      lesson: "Nabi mengonfirmasi reputasi kejujuran beliau terlebih dahulu sebelum menyampaikan gagasan yang radikal dan menantang status quo.",
      modernApplication: "Saat hendak melakukan transformasi besar dalam organisasi atau bisnis, pastikan kredibilitas pemimpin telah diakui secara bulat oleh para anggota."
    },
    quranRef: "QS. Asy-Syu'ara': 214"
  },
  {
    id: "hijrah-habasyah",
    title: "Hijrah Pertama ke Habasyah (Ethiopia)",
    arabicTitle: "الْهِجْرَةُ إِلَى الْحَبَشَةِ",
    yearM: 615,
    dateString: "Rajab Tahun ke-5 Kenabian (615 M)",
    phase: "makkah",
    category: "migration",
    locationId: "makkah",
    summary: "Gelombang pertama pengungsian muslimin menyeberangi Laut Merah menuju kerajaan Raja Najasyi yang adil untuk menyelamatkan diri dari siksaan.",
    detailedStory: "Melihat sahabat-sahabatnya disiksa di Makkah (seperti Bilal dan keluarga Yasir), Nabi menginstruksikan mereka hijrah ke Habasyah: 'Pergilah ke sana, karena di sana ada raja yang tidak menzalimi seorang pun di negerinya.' Ja'far bin Abi Thalib berhasil memukau Raja Najasyi dengan membacakan Surah Maryam.",
    leadership: {
      title: "Manajemen Perlindungan Anggota & Diplomasi Lintas Agama",
      lesson: "Pemimpin yang bijak memprioritaskan keselamatan fisik dan mental timnya, serta mampu menjalin aliansi dengan penguasa luar yang menjunjung tinggi keadilan meskipun berbeda keyakinan.",
      modernApplication: "Melindungi anggota yang rentan adalah amanah mutlak pemimpin; kolaborasi profesional tidak boleh dibatasi sekat primordial jika berlandaskan keadilan bersama."
    }
  },
  {
    id: "isra-miraj",
    title: "Peristiwa Agung Isra' Mi'raj",
    arabicTitle: "مُعْجِزَةُ الْإِسْرَاءِ وَالْمِعْرَاجِ",
    yearM: 621,
    dateString: "27 Rajab Tahun ke-11 Kenabian (621 M)",
    phase: "makkah",
    category: "milestone",
    locationId: "al-quds",
    summary: "Perjalanan semalam dari Masjidil Haram ke Masjidil Aqsha lalu menembus Sidratul Muntaha untuk menerima syariat shalat 5 waktu.",
    detailedStory: "Terjadi pasca 'Amul Huzni (wafatnya Khadijah dan Abu Thalib) serta penolakan menyakitkan di Tha'if. Allah menghibur kekasih-Nya dengan perjalanan melintasi ruang dan waktu mengendarai Buraq, menjadi imam shalat para nabi di Al-Aqsha, dan menerima perintah shalat langsung tanpa perantara.",
    leadership: {
      title: "Penghiburan Spiritual di Titik Terendah Kehidupan",
      lesson: "Ketika pintu-pintu bumi tertutup rapat oleh penolakan manusia, pintu-pintu langit terbuka lebar. Shalat diwajibkan sebagai sarana recharging spiritual abadi bagi kaum beriman.",
      modernApplication: "Seorang pejuang sejati tidak boleh mengandalkan daya manusianya semata; koneksi vertikal kepada Sang Pencipta adalah sumber energi tak terbatas saat menghadapi kegagalan di bumi."
    },
    quranRef: "QS. Al-Isra': 1"
  },
  {
    id: "hijrah-akbar",
    title: "Hijrah Akbar ke Madinah",
    arabicTitle: "الْهِجْرَةُ النَّبَوِيَّةُ الْمُبَارَكَةُ",
    yearM: 622,
    yearH: 1,
    dateString: "Rabi'ul Awwal 1 H / September 622 M",
    phase: "madinah",
    category: "migration",
    locationId: "yatsrib",
    routeId: "hijrah",
    summary: "Eksodus bersejarah pembuka kalender Islam: lolos dari kepungan pembunuh Quraisy, bersembunyi di Gua Tsur, dan disambut meriah di Yatsrib.",
    detailedStory: "Ali bin Abi Thalib tidur di ranjang Nabi untuk mengecoh para pembunuh. Nabi dan Abu Bakr bergerak ke arah selatan (Gua Tsur) berlawanan dengan jalur Madinah di utara, menyewa penunjuk jalan profesional non-muslim (Abdullah bin Uraiqith), lalu menempuh pesisir pantai hingga mendirikan Masjid Quba.",
    leadership: {
      title: "Masterclass Manajemen Risiko & Eksekusi Strategis",
      lesson: "Hijrah bukan pelarian panik, melainkan operasi terencana dengan detail mitigasi risiko kelas dunia (pengalihan isu, logistik rahasia, penunjuk jalan ahli, dan rute alternatif).",
      modernApplication: "Iman dan tawakal tidak pernah menafikan perencanaan profesional. Eksekusi matang dan kehati-hatian teknis adalah wujud nyata dari keimanan yang bertanggung jawab."
    },
    quranRef: "QS. At-Taubah: 40"
  },
  {
    id: "piagam-madinah",
    title: "Piagam Madinah & Ta'akhi Muhajirin-Anshar",
    arabicTitle: "وَثِيقَةُ الْمَدِينَةِ وَالْمُوَاخَاةُ",
    yearM: 622,
    yearH: 1,
    dateString: "Tahun 1 Hijriyah (622 M)",
    phase: "madinah",
    category: "treaty",
    locationId: "yatsrib",
    summary: "Penyusunan konstitusi tertulis pertama di dunia yang menjamin hak asasi warga lintas suku dan agama, serta persaudaraan tulus Muhajirin-Anshar.",
    detailedStory: "Nabi mempersaudarakan kaum Muhajirin yang miskin tanpa harta dengan kaum Anshar Madinah yang berjiwa mulia, hingga mereka rela membagi rumah dan ladang mereka. Piagam Madinah menyatukan 47 pasal etika kewarganegaraan, toleransi beragama bagi Yahudi, dan pertahanan bersama.",
    leadership: {
      title: "Rekayasa Sosial & Konstitusionalisme Modern",
      lesson: "Membangun negara harus dimulai dengan merekatkan kohesi sosial internal (ukhuwah) dan meletakkan supremasi hukum yang inklusif bagi seluruh elemen warga majemuk.",
      modernApplication: "Organisasi alumni dan bangsa hanya akan kokoh jika dibangun di atas rasa saling menopang dan aturan main yang adil bagi setiap anggotanya tanpa diskriminasi."
    }
  },
  {
    id: "perang-badr",
    title: "Perang Badr Al-Kubra (Yaumul Furqan)",
    arabicTitle: "غَزْوَةُ بَدْرٍ الْكُبْرَى",
    yearM: 624,
    yearH: 2,
    dateString: "17 Ramadhan 2 H / 13 Maret 624 M",
    phase: "madinah",
    category: "battle",
    locationId: "badr",
    routeId: "badr-expedition",
    summary: "Pertempuran penentuan di lembah Badr: 313 pejuang muslimin mengalahkan 1.000 pasukan elit Quraisy bersenjata lengkap.",
    detailedStory: "Pasukan muslim kalah jumlah 1 banding 3 dan minim persenjataan. Nabi bermusyawarah dengan sahabat (menerima usulan Al-Hubab bin Al-Mundzir tentang penempatan sumur air), lalu bermunajat semalam suntuk di kemah hingga selendang beliau terjatuh. Allah menurunkan bala bantuan ribuan malaikat.",
    leadership: {
      title: "Musyawarah Lapangan & Kerendahan Hati Panglima",
      lesson: "Nabi tidak segan mengubah rencana taktis militer ketika bawahannya yang lebih ahli memberikan saran yang lebih obyektif. Doa khusyuk dipadukan dengan kesiapan tempur optimal.",
      modernApplication: "Pemimpin yang hebat tidak bersikap arogan merasa paling tahu; ia membuka telinga pada keahlian tim spesialis di lapangan demi kemenangan bersama."
    },
    quranRef: "QS. Ali 'Imran: 123"
  },
  {
    id: "perang-uhud",
    title: "Perang Uhud & Pelajaran Bukit Pemanah",
    arabicTitle: "غَزْوَةُ أُحُدٍ وَعِبْرَةُ الرُّمَاةِ",
    yearM: 625,
    yearH: 3,
    dateString: "7 Syawal 3 H / 23 Maret 625 M",
    phase: "madinah",
    category: "battle",
    locationId: "uhud",
    summary: "Ujian berat kaum muslimin di lereng Uhud akibat sebagian pemanah melanggar instruksi demi mengumpulkan harta ghanimah.",
    detailedStory: "Awalnya muslimin menang mutlak. Namun melihat musuh mundur, 40 dari 50 pemanah di Bukit Rumat meninggalkan pos mereka. Khalid bin Walid (saat itu masih musyrik) memutar balik pasukan berkuda Quraisy dan menyerang balik dari belakang. 70 sahabat gugur syahid termasuk paman Nabi, Hamzah.",
    leadership: {
      title: "Disiplin Taktis & Bahaya Terlena oleh Hasil Sementara",
      lesson: "Ketidakpatuhan pada SOP dan hilangnya fokus akibat godaan keuntungan materi sesaat dapat meruntuhkan keberhasilan besar dalam hitungan detik. Nabi menolak memarahi para pemanah, melainkan memaafkan dan menguatkan kembali mental mereka.",
      modernApplication: "Dalam eksekusi proyek atau bisnis, pelanggaran integritas dan kepatuhan sistem demi mengejar profit sesaat akan berujung malapetaka. Sikap pemimpin adalah mengevaluasi dengan bijak tanpa meremukkan semangat tim."
    },
    quranRef: "QS. Ali 'Imran: 152, 159"
  },
  {
    id: "perang-khandaq",
    title: "Perang Khandaq (Ahzab) & Strategi Parit",
    arabicTitle: "غَزْوَةُ الْخَنْدَقِ (الْأَحْزَابِ)",
    yearM: 627,
    yearH: 5,
    dateString: "Syawal 5 H / Februari 627 M",
    phase: "madinah",
    category: "battle",
    locationId: "khandaq",
    summary: "Pengepungan kota Madinah oleh 10.000 pasukan koalisi Ahzab yang digagalkan oleh parit galian dan badai angin topan Ilahi.",
    detailedStory: "Koalisi besar Quraisy, Ghathafan, dan kabilah Yahudi mengepung Madinah dari segala arah. Nabi menerima ide Salman Al-Farisi (kebudayaan Persia) untuk menggali parit lebar. Nabi turut serta mengayunkan cangkul memecahkan batu karang keras sambil membagikan janji kemenangan atas Romawi dan Persia.",
    leadership: {
      title: "Inovasi 'Out of the Box' & Leading by Example",
      lesson: "Keterbukaan mengadopsi teknologi atau strategi baru dari luar peradaban selama membawa kemaslahatan. Nabi memimpin dengan teladan nyata: ikut lapar, ikut memegang sekop, dan menghembuskan optimisme di tengah krisis pengepungan.",
      modernApplication: "Pemimpin sejati tidak berdiam diri di ruang ber-AC saat timnya pontang-panting di garis depan; ia bekerja berdampingan dan membakar api optimisme di masa-masa tersulit."
    },
    quranRef: "QS. Al-Ahzab: 9-25"
  },
  {
    id: "perjanjian-hudaibiyah",
    title: "Perjanjian Hudaibiyah (Fathan Mubina)",
    arabicTitle: "صُلْحُ الْحُدَيْبِيَةِ وَالْفَتْحُ الْمُبِينُ",
    yearM: 628,
    yearH: 6,
    dateString: "Dzulqa'dah 6 H / Maret 628 M",
    phase: "madinah",
    category: "treaty",
    locationId: "hudaibiyah",
    summary: "Perjanjian damai gencatan senjata 10 tahun dengan klausul yang tampak merugikan secara lahiriah namun membuka gelombang ekspansi dakwah terbesar.",
    detailedStory: "Rombongan 1.400 muslim berniat umrah damai dihadang di Hudaibiyah. Dalam negosiasi alot dengan Suhail bin Amr, Nabi setuju menghapus tulisan 'Rasulullah' menjadi 'Muhammad bin Abdullah' dan menerima klausul yang diprotes sahabat (termasuk Umar bin Khattab). Allah menurunkan Surah Al-Fath: 'Sesungguhnya Kami telah memberikan kepadamu kemenangan yang nyata.'",
    leadership: {
      title: "Visi Strategis Jangka Panjang Mengalahkan Ego Sesaat",
      lesson: "Pemimpin visioner bersedia mengalah pada simbol-simbol gengsi demi mengamankan substansi perdamaian yang memungkinkan ideologinya menyebar tanpa hambatan perang.",
      modernApplication: "Dalam negosiasi bisnis atau diplomasi, jangan terjebak perdebatan gengsi formalitas; fokuslah pada pencapaian tujuan jangka panjang dan penciptaan iklim kolaborasi yang kondusif."
    },
    quranRef: "QS. Al-Fath: 1-4"
  },
  {
    id: "fathu-makkah-event",
    title: "Fathu Makkah (Pembebasan Tanpa Darah)",
    arabicTitle: "فَتْحُ مَكَّةَ الْمُبَارَكُ",
    yearM: 630,
    yearH: 8,
    dateString: "20 Ramadhan 8 H / Januari 630 M",
    phase: "madinah",
    category: "milestone",
    locationId: "makkah",
    routeId: "fathu-makkah",
    summary: "Kembalinya Nabi ke Makkah memimpin 10.000 pasukan dengan menundukkan kepala penuh ketundukan dan memberikan amnesti umum kepada musuh.",
    detailedStory: "Menanggapi pelanggaran perjanjian oleh Quraisy, Nabi bergerak menuju Makkah. Memasuki kota suci di atas unta Qashwa' sambil menundukkan kepala hingga janggutnya menyentuh pelana tanda tawadhu'. 360 berhala di sekeliling Ka'bah dihancurkan. Di hadapan penduduk Makkah yang gemetar ketakutan menanti balas dendam, Nabi bersabda: 'Pergilah kalian semua, hari ini kalian bebas!'",
    leadership: {
      title: "Amnesti Agung & Kerendahan Hati Sang Pemenang",
      lesson: "Puncak kebesaran seorang pemimpin teruji saat ia berada di posisi menang mutlak. Bukan arak-arakan arogan atau balas dendam berdarah yang ia tebar, melainkan kemaafan luas dan pemulihan martabat manusia.",
      modernApplication: "Kemenangan sejati dalam kepemimpinan dan persaingan bisnis bukan meremukkan lawan hingga binasa, melainkan merangkul mereka kembali menjadi mitra kebaikan yang loyal."
    },
    quranRef: "QS. An-Nashr: 1-3"
  },
  {
    id: "ekspedisi-tabuk",
    title: "Ekspedisi Tabuk (Jaisyul Usyrah)",
    arabicTitle: "غَزْوَةُ تَبُوكَ (جَيْشُ الْعُسْرَةِ)",
    yearM: 630,
    yearH: 9,
    dateString: "Rajab 9 H / Oktober 630 M",
    phase: "madinah",
    category: "battle",
    locationId: "tabuk",
    summary: "Ujian pengorbanan tertinggi: menempuh ribuan kilometer di bawah sengatan matahari gurun membara untuk menunjukkan kesiapan umat.",
    detailedStory: "Utsman bin Affan mendonasikan 900 unta, 100 kuda, dan 1.000 dinar emas; Abu Bakr menyumbangkan seluruh hartanya. Di Tabuk, pasukan Romawi mundur teratur menyaksikan tekad baja 30.000 pasukan muslimin tanpa perlu melepaskan satu panah pun.",
    leadership: {
      title: "Deterrence Effect & Kekuatan Soliditas Internal",
      lesson: "Kekuatan pertahanan paling dahsyat bukan jumlah senjata, melainkan soliditas mental dan kerelaan berkorban dari seluruh anggota komunitas.",
      modernApplication: "Saat organisasi menghadapi tantangan makro yang menakutkan, persatuan tekad dan kontribusi sukarela dari tiap anggota akan membuat rintangan terbesar bubar dengan sendirinya."
    },
    quranRef: "QS. At-Taubah: 117-118"
  },
  {
    id: "haji-wada",
    title: "Haji Wada' (Piagam HAM Terakhir)",
    arabicTitle: "حَجَّةُ الْوَدَاعِ وَالْبَلَاغُ الْأَخِيرُ",
    yearM: 632,
    yearH: 10,
    dateString: "9 Dzulhijjah 10 H / Maret 632 M",
    phase: "madinah",
    category: "milestone",
    locationId: "makkah",
    summary: "Ibadah haji perpisahan dihadiri lebih dari 100.000 jamaah di Padang Arafah, mengumumkan deklarasi hak asasi manusia universal.",
    detailedStory: "Di Bukit Rahmah, Nabi menyampaikan Khutbah Wada': mengharamkan pertumpahan darah dan riba, mewasiatkan perlindungan hak-hak kaum wanita, menegaskan tidak ada kelebihan bangsa Arab atas non-Arab kecuali karena takwa, dan menyerukan umat berpegang teguh pada Al-Qur'an dan Sunnah.",
    leadership: {
      title: "Legasi Nilai Abadi & Rencana Suksesi",
      lesson: "Pemimpin paripurna tidak meninggalkan kekayaan materi untuk diperebutkan, melainkan meninggalkan fondasi nilai-nilai etik yang kokoh dan dapat dipahami secara transparan oleh seluruh generasi penerus.",
      modernApplication: "Tolak ukur keberhasilan seorang pendiri atau ketua organisasi adalah saat sistem dan nilai-nilai luhur yang ia bangun terus berjalan mandiri bahkan setelah kepemimpinannya berakhir."
    },
    quranRef: "QS. Al-Ma'idah: 3"
  },
  {
    id: "wafat-rasul",
    title: "Wafatnya Kekasih Allah & Warisan Peradaban",
    arabicTitle: "وَفَاةُ الرَّسُولِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ",
    yearM: 632,
    yearH: 11,
    dateString: "12 Rabi'ul Awwal 11 H / 8 Juni 632 M",
    phase: "madinah",
    category: "milestone",
    locationId: "yatsrib",
    summary: "Berpulangnya Nabi Muhammad SAW ke haribaan Ilahi pada usia 63 tahun, meninggalkan warisan peradaban cahaya yang abadi.",
    detailedStory: "Nabi wafat di pangkuan Sayyidah Aisyah RA dengan bisikan doa terakhir: 'Ilar-Rafiiqil A'laa' (Menuju Sahabat Tertinggi di Surga). Di tengah kepanikan sahabat, Abu Bakr berdiri tegak menenangkan umat dengan kata-kata bersejarah: 'Barang siapa menyembah Muhammad, sungguh Muhammad telah wafat. Dan barang siapa menyembah Allah, sesungguhnya Allah Maha Hidup dan tidak pernah mati.'",
    leadership: {
      title: "Institusionalisasi Gerakan & Kematangan Umat",
      lesson: "Sosok manusia pasti akan fana, namun cita-cita dakwah dan sistem peradaban yang dibangun atas dasar kebenaran abadi akan terus hidup dan melahirkan pemimpin-pemimpin baru di setiap zaman.",
      modernApplication: "Membangun institusi yang berakar pada prinsip, bukan kultus individu, sehingga estafet perjuangan dapat terus berlanjut melintasi generasi alumni angkatan."
    },
    quranRef: "QS. Ali 'Imran: 144"
  }
];
