export type AsmaCategory = 'all' | 'mercy' | 'majesty' | 'wisdom' | 'provision' | 'peace';

export interface AsmaulHusnaItem {
  number: number;
  arabic: string;
  latin: string;
  translation: string;
  category: 'mercy' | 'majesty' | 'wisdom' | 'provision' | 'peace';
  quranRef: string;
  meaning: string;
  dhikrBenefit: string;
}

export const ASMA_CATEGORIES: { key: AsmaCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'Semua (99)', icon: '✨' },
  { key: 'mercy', label: 'Kasih Sayang & Kebaikan', icon: '❤️' },
  { key: 'provision', label: 'Rezeki & Kemudahan', icon: '💎' },
  { key: 'wisdom', label: 'Ilmu & Kebijaksanaan', icon: '📖' },
  { key: 'majesty', label: 'Keagungan & Kekuasaan', icon: '👑' },
  { key: 'peace', label: 'Kedamaian & Perlindungan', icon: '🛡️' },
];

export const ASMAUL_HUSNA_DATA: AsmaulHusnaItem[] = [
  {
    number: 1,
    arabic: "الرَّحْمَنُ",
    latin: "Ar-Rahman",
    translation: "Yang Maha Pengasih",
    category: "mercy",
    quranRef: "QS. Al-Fatihah: 3",
    meaning: "Allah melimpahkan kasih sayang yang tak terbatas kepada seluruh makhluk di alam semesta tanpa terkecuali, baik yang beriman maupun yang ingkar, dalam kehidupan duniawi.",
    dhikrBenefit: "Membaca 'Ya Rahman' 100x setiap selesai shalat fardhu dapat melembutkan hati yang keras, menumbuhkan empati, dan mendatangkan ketenangan batin."
  },
  {
    number: 2,
    arabic: "الرَّحِيمُ",
    latin: "Ar-Rahim",
    translation: "Yang Maha Penyayang",
    category: "mercy",
    quranRef: "QS. Al-Baqarah: 143",
    meaning: "Kasih sayang khusus dan kekal yang Allah anugerahkan kepada hamba-hamba-Nya yang beriman, terutama dalam kehidupan akhirat yang penuh kenikmatan abadi.",
    dhikrBenefit: "Mendawamkan 'Ya Rahim' 100x setiap fajar mengundang perlindungan Ilahi dari marabahaya dan memudahkan diterimanya doa-doa hajat."
  },
  {
    number: 3,
    arabic: "الْمَلِكُ",
    latin: "Al-Malik",
    translation: "Yang Maha Merajai / Menguasai",
    category: "majesty",
    quranRef: "QS. Al-Mu'minun: 116",
    meaning: "Pemilik kedaulatan mutlak atas seluruh alam semesta. Tidak ada satu kekuasaan pun di bumi maupun di langit yang lepas dari kendali dan kepemilikan-Nya.",
    dhikrBenefit: "Dianjurkan dibaca oleh para pemimpin atau penanggung jawab amanah agar diberi wibawa, kebijaksanaan, dan keadilan dalam mengambil keputusan."
  },
  {
    number: 4,
    arabic: "الْقُدُّوسُ",
    latin: "Al-Quddus",
    translation: "Yang Maha Suci",
    category: "majesty",
    quranRef: "QS. Al-Jumu'ah: 1",
    meaning: "Tersuci dari segala aib, kekurangan, cacat, dan prasangka buruk makhluk. Kesucian Allah adalah kemutlakan tanpa cela sedikit pun.",
    dhikrBenefit: "Membaca 'Ya Quddus' 100x di waktu sepi dapat membersihkan kalbu dari penyakit hati seperti riya, hasad, dendam, dan kecemasan duniawi."
  },
  {
    number: 5,
    arabic: "السَّلاَمُ",
    latin: "As-Salam",
    translation: "Yang Maha Memberi Kesejahteraan & Kedamaian",
    category: "peace",
    quranRef: "QS. Al-Hasyr: 23",
    meaning: "Sumber segala kedamaian sejati, kesejahteraan jiwa, dan keselamatan bagi hamba-hamba-Nya dari keburukan lahir maupun batin.",
    dhikrBenefit: "Membaca 'Ya Salam' 160x kepada orang yang sedang gelisah atau sakit dapat menghadirkan ketenangan jiwa dan mempercepat kesembuhan biidznillah."
  },
  {
    number: 6,
    arabic: "الْمُؤْمِنُ",
    latin: "Al-Mu'min",
    translation: "Yang Maha Memberi Keamanan",
    category: "peace",
    quranRef: "QS. Al-Hasyr: 23",
    meaning: "Dzat yang membenarkan janji-janji-Nya dan menganugerahkan rasa aman dari ketakutan serta siksaan bagi siapa saja yang bertawakal kepada-Nya.",
    dhikrBenefit: "Membaca 'Ya Mu'min' 136x mendatangkan rasa aman dari ancaman fitnah, kezaliman manusia, dan gangguan rasa takut di malam hari."
  },
  {
    number: 7,
    arabic: "الْمُهَيْمِنُ",
    latin: "Al-Muhaymin",
    translation: "Yang Maha Memelihara / Mengawasi",
    category: "peace",
    quranRef: "QS. Al-Hasyr: 23",
    meaning: "Maha Mengawasi seluruh gerak-gerik alam semesta, memelihara kelangsungan ciptaan-Nya, dan saksi abadi atas setiap perbuatan manusia.",
    dhikrBenefit: "Mendawamkan 'Ya Muhaymin' setelah berwudhu menyinari batin dan menajamkan intuisi spiritual dalam menghadapi problematika hidup."
  },
  {
    number: 8,
    arabic: "الْعَزِيزُ",
    latin: "Al-Aziz",
    translation: "Yang Maha Perkasa / Mulia",
    category: "majesty",
    quranRef: "QS. Al-Hasyr: 23",
    meaning: "Kekuatan dan kemuliaan yang tidak terkalahkan oleh siapapun. Keperkasaan Allah mengatasi segala daya dan tipu daya makhluk di muka bumi.",
    dhikrBenefit: "Membaca 'Ya Aziz' 41x setelah shalat Subuh selama 40 hari diyakini menjauhkan seseorang dari kehinaan dan ketergantungan pada belas kasihan manusia."
  },
  {
    number: 9,
    arabic: "الْجَبَّارُ",
    latin: "Al-Jabbar",
    translation: "Yang Maha Memaksa / Berkehendak Mutlak",
    category: "majesty",
    quranRef: "QS. Al-Hasyr: 23",
    meaning: "Kehendak-Nya terlaksana tanpa ada yang sanggup menentang, sekaligus Dzat yang menyembuhkan hati yang patah dan memperbaiki urusan yang hancur.",
    dhikrBenefit: "Dzikir 'Ya Jabbar' menguatkan mental orang yang sedang terpuruk, membantu memulihkan luka batin dan mematahkan kezaliman musuh."
  },
  {
    number: 10,
    arabic: "الْمُتَكَبِّرُ",
    latin: "Al-Mutakabbir",
    translation: "Yang Maha Megah / Memiliki Kebesaran",
    category: "majesty",
    quranRef: "QS. Al-Hasyr: 23",
    meaning: "Pemilik hak prerogatif atas segala keagungan. Hanya Allah yang layak memiliki sifat takabur (kebesaran), sementara makhluk yang sombong akan dihinakan-Nya.",
    dhikrBenefit: "Mengingatkan kita untuk senantiasa rendah hati (tawadhu') dan memohon kemuliaan sejati di mata Allah SWT."
  },
  {
    number: 11,
    arabic: "الْخَالِقُ",
    latin: "Al-Khaliq",
    translation: "Yang Maha Pencipta",
    category: "provision",
    quranRef: "QS. Al-Hasyr: 24",
    meaning: "Menciptakan segala sesuatu dari ketiadaan menjadi ada dengan ketetapan ukuran, hikmah, dan harmoni yang sempurna.",
    dhikrBenefit: "Membaca 'Ya Khaliq' di waktu malam menerangi akal budi dan membuka jalan bagi para inovator, kreator, dan pemikir dalam melahirkan gagasan besar."
  },
  {
    number: 12,
    arabic: "الْبَارِئُ",
    latin: "Al-Bari'",
    translation: "Yang Maha Mengadakan dari Ketiadaan",
    category: "provision",
    quranRef: "QS. Al-Hasyr: 24",
    meaning: "Menjadikan ciptaan berwujud nyata dan seimbang dari rencana yang telah ditentukan, bebas dari kekeliruan arsitektur semesta.",
    dhikrBenefit: "Membaca 'Ya Bari'' bermanfaat untuk kelancaran tugas-tugas berat dan kesembuhan dari penyakit jasmani yang sulit diobati."
  },
  {
    number: 13,
    arabic: "الْمُصَوِّرُ",
    latin: "Al-Mushawwir",
    translation: "Yang Maha Membentuk Rupa",
    category: "provision",
    quranRef: "QS. Al-Hasyr: 24",
    meaning: "Memberikan rupa, warna, ciri khas, dan karakteristik unik pada setiap ciptaan-Nya sehingga tidak ada dua makhluk yang identik seutuhnya.",
    dhikrBenefit: "Bagi pasangan yang mendambakan keturunan shalih/shalihah atau para seniman/arsitek dalam merancang karya yang indah penuh berkah."
  },
  {
    number: 14,
    arabic: "الْغَفَّارُ",
    latin: "Al-Ghaffar",
    translation: "Yang Maha Pengampun",
    category: "mercy",
    quranRef: "QS. Thaha: 82",
    meaning: "Menutupi dosa-dosa hamba-Nya di dunia dan menghapuskan hukumannya di akhirat jika hamba tersebut bertaubat dengan tulus.",
    dhikrBenefit: "Membaca 'Ya Ghaffar' 100x selepas shalat Jumat menghapuskan penyesalan dosa masa lalu dan membukakan pintu ridha Ilahi."
  },
  {
    number: 15,
    arabic: "الْقَهَّارُ",
    latin: "Al-Qahhar",
    translation: "Yang Maha Menundukkan Segala Sesuatu",
    category: "majesty",
    quranRef: "QS. Ar-Ra'd: 16",
    meaning: "Segala makhluk takluk di bawah kekuasaan-Nya. Tidak ada satu pun tirani di dunia yang tidak dapat dihancurkan oleh kehendak-Nya.",
    dhikrBenefit: "Membantu menundukkan hawa nafsu ammarah yang liar dan membebaskan diri dari kecanduan hal-hal negatif."
  },
  {
    number: 16,
    arabic: "الْوَهَّابُ",
    latin: "Al-Wahhab",
    translation: "Yang Maha Pemberi Karunia",
    category: "provision",
    quranRef: "QS. Ali 'Imran: 8",
    meaning: "Menganugerahkan karunia nikmat, kesehatan, ilmu, dan kekayaan secara berlimpah tanpa mengharapkan imbalan apapun dari makhluk-Nya.",
    dhikrBenefit: "Membaca 'Ya Wahhab' 7x dalam sujud terakhir shalat sunnah mengundang kemudahan rezeki tak terduga dan pelunasan hutang."
  },
  {
    number: 17,
    arabic: "الرَّزَّاقُ",
    latin: "Ar-Razzaq",
    translation: "Yang Maha Pemberi Rezeki",
    category: "provision",
    quranRef: "QS. Adz-Dzariyat: 58",
    meaning: "Menjamin sarana kehidupan bagi setiap makhluk bernyawa di muka bumi, mencakup rezeki materi (harta, pangan) maupun spiritual (ilmu, keimanan).",
    dhikrBenefit: "Membaca 'Ya Razzaq' 100x setiap pagi sebelum beraktivitas membukakan pintu keberkahan berniaga dan kelancaran karir."
  },
  {
    number: 18,
    arabic: "الْفَتَّاحُ",
    latin: "Al-Fattah",
    translation: "Yang Maha Pembuka Pintu Kebaikan & Keputusan",
    category: "provision",
    quranRef: "QS. Saba': 26",
    meaning: "Membukakan segala pintu rezeki, kemudahan dari kesulitan, jalan keluar dari kebuntuan, serta pemutus perkara secara adil.",
    dhikrBenefit: "Membaca 'Ya Fattah' 70x sambil meletakkan tangan di dada kanan setelah Subuh menerangi hati dan memudahkan pemahaman ilmu."
  },
  {
    number: 19,
    arabic: "الْعَلِيمُ",
    latin: "Al-'Alim",
    translation: "Yang Maha Mengetahui",
    category: "wisdom",
    quranRef: "QS. Al-Baqarah: 29",
    meaning: "Mengetahui segala rahasia di masa lalu, kini, dan mendatang hingga lintasan hati yang paling tersembunyi tanpa batas.",
    dhikrBenefit: "Membaca 'Ya 'Alim' 100x mempertajam daya ingat, kefasihan berpikir, dan memudahkan penyerapan ilmu agama maupun sains."
  },
  {
    number: 20,
    arabic: "الْقَابِضُ",
    latin: "Al-Qabidh",
    translation: "Yang Maha Menyempitkan",
    category: "majesty",
    quranRef: "QS. Al-Baqarah: 245",
    meaning: "Menyempitkan rezeki atau menahan nyawa seseorang menurut hikmah keadilan-Nya demi menguji kesabaran dan keimanan hamba.",
    dhikrBenefit: "Mengingatkan kita untuk tidak terlena dalam kelapangan dan melatih kesabaran tinggi saat menghadapi masa-masa sempit."
  },
  {
    number: 21,
    arabic: "الْبَاسِطُ",
    latin: "Al-Basith",
    translation: "Yang Maha Melapangkan",
    category: "provision",
    quranRef: "QS. Al-Baqarah: 245",
    meaning: "Melapangkan rezeki, memperluas hati dengan kebahagiaan, dan meniupkan ruh kehidupan ke dalam tubuh makhluk.",
    dhikrBenefit: "Membaca 'Ya Basith' 10x setelah shalat Dhuha dengan kedua tangan menengadah mengangkat beban depresi dan melapangkan penghidupan."
  },
  {
    number: 22,
    arabic: "الْخَافِضُ",
    latin: "Al-Khafidh",
    translation: "Yang Maha Merendahkan",
    category: "majesty",
    quranRef: "QS. Al-Waqi'ah: 3",
    meaning: "Merendahkan derajat orang-orang yang durhaka, zalim, dan menyombongkan diri terhadap perintah-Nya.",
    dhikrBenefit: "Mendekatkan diri pada sikap rendah hati (tawadhu') agar tidak dihinakan oleh Allah dalam pergaulan dunia dan akhirat."
  },
  {
    number: 23,
    arabic: "الرَّافِعُ",
    latin: "Ar-Rafi'",
    translation: "Yang Maha Meninggikan Derajat",
    category: "majesty",
    quranRef: "QS. Al-An'am: 165",
    meaning: "Mengangkat kedudukan orang-orang yang beriman, berilmu, beradab, dan beramal shalih ke derajat kemuliaan tinggi.",
    dhikrBenefit: "Membaca 'Ya Rafi'' 100x di pertengahan malam mengangkat wibawa spiritual dan memudahkan promosi karir yang berkah."
  },
  {
    number: 24,
    arabic: "الْمُعِزُّ",
    latin: "Al-Mu'izz",
    translation: "Yang Maha Memuliakan",
    category: "majesty",
    quranRef: "QS. Ali 'Imran: 26",
    meaning: "Menganugerahkan kemuliaan hakiki dan perlindungan kehormatan kepada hamba-hamba yang taat kepada-Nya.",
    dhikrBenefit: "Membaca 'Ya Mu'izz' 140x pada malam Senin atau Jumat menumbuhkan rasa percaya diri yang berlandaskan tawakal kepada Allah."
  },
  {
    number: 25,
    arabic: "الْمُذِلُّ",
    latin: "Al-Mudzill",
    translation: "Yang Maha Menghinakan",
    category: "majesty",
    quranRef: "QS. Ali 'Imran: 26",
    meaning: "Menghinakan kaum pembangkang dan pencela kebenaran dengan mencabut kenikmatan dan wibawa mereka di hadapan sesama.",
    dhikrBenefit: "Dibaca 75x dalam sujud untuk memohon perlindungan dari kejahatan orang-orang yang bermaksud menganiaya atau memfitnah kita."
  },
  {
    number: 26,
    arabic: "السَّمِيعُ",
    latin: "As-Sami'",
    translation: "Yang Maha Mendengar",
    category: "wisdom",
    quranRef: "QS. Al-Baqarah: 127",
    meaning: "Mendengar segala desah nafas, bisikan batin, dan rintihan doa setiap makhluk di seluruh alam semesta tanpa penghalang apapun.",
    dhikrBenefit: "Membaca 'Ya Sami'' 500x setiap hari Kamis setelah Dhuha memudahkan terkabulnya doa-doa hajat yang mendesak."
  },
  {
    number: 27,
    arabic: "الْبَصِيرُ",
    latin: "Al-Bashir",
    translation: "Yang Maha Melihat",
    category: "wisdom",
    quranRef: "QS. Al-Hujurat: 18",
    meaning: "Menyaksikan segala perbuatan terang maupun tersembunyi, hingga semut hitam di atas batu hitam pada malam yang kelam.",
    dhikrBenefit: "Membaca 'Ya Bashir' 100x sebelum shalat Jumat menajamkan mata batin dan mengikis sifat suka melihat maksiat."
  },
  {
    number: 28,
    arabic: "الْحَكَمُ",
    latin: "Al-Hakam",
    translation: "Yang Maha Menetapkan Hukum",
    category: "wisdom",
    quranRef: "QS. Al-An'am: 114",
    meaning: "Hakim tertinggi yang keadilan putusan-Nya mutlak, tidak pernah berbuat zalim sedikit pun pada setiap perkara makhluk-Nya.",
    dhikrBenefit: "Dzikir 'Ya Hakam' 99x di hening malam membukakan petunjuk Ilahi ketika kita berada di persimpangan keputusan pelik."
  },
  {
    number: 29,
    arabic: "الْعَدْلُ",
    latin: "Al-'Adl",
    translation: "Yang Maha Adil",
    category: "wisdom",
    quranRef: "QS. Al-An'am: 115",
    meaning: "Menempatkan segala sesuatu tepat pada tempatnya secara seimbang, adil tanpa kecenderungan berlebih ataupun berkurang.",
    dhikrBenefit: "Mengilhami diri agar senantiasa bersikap obyektif, menjauhi kezaliman kepada bawahan, pasangan, maupun sesama alumni."
  },
  {
    number: 30,
    arabic: "اللَّطِيفُ",
    latin: "Al-Lathif",
    translation: "Yang Maha Lembut & Maha Halus",
    category: "mercy",
    quranRef: "QS. Al-Mulk: 14",
    meaning: "Mengetahui detail terhalus dari urusan makhluk dan menyampaikan kebaikan serta rezeki melalui cara-cara yang tak terduga penuh kelembutan.",
    dhikrBenefit: "Membaca 'Ya Lathif' 129x adalah dzikir masyhur para santri untuk meredakan ketegangan, melunakkan masalah rumit, dan memudahkan jodoh/karir."
  },
  {
    number: 31,
    arabic: "الْخَبِيرُ",
    latin: "Al-Khabir",
    translation: "Yang Maha Mengenal Segala Rahasia",
    category: "wisdom",
    quranRef: "QS. Al-An'am: 18",
    meaning: "Mengetahui hakikat terdalam dari segala perkara, motif tersembunyi dalam hati, dan konsekuensi dari setiap perbuatan.",
    dhikrBenefit: "Membaca 'Ya Khabir' secara istiqomah menjauhkan diri dari tipuan orang munafik dan membimbing kita menuju kebenaran."
  },
  {
    number: 32,
    arabic: "الْحَلِيمُ",
    latin: "Al-Halim",
    translation: "Yang Maha Penyantun",
    category: "mercy",
    quranRef: "QS. Al-Baqarah: 225",
    meaning: "Tidak tergesa-gesa menjatuhkan azab kepada orang yang berbuat dosa, melainkan memberi kesempatan luas bagi mereka untuk bertaubat.",
    dhikrBenefit: "Dzikir 'Ya Halim' memadamkan api kemarahan, meredam emosi tak terkontrol, dan menumbuhkan kesabaran dalam mendidik keluarga."
  },
  {
    number: 33,
    arabic: "الْعَظِيمُ",
    latin: "Al-'Azhim",
    translation: "Yang Maha Agung",
    category: "majesty",
    quranRef: "QS. Al-Baqarah: 255",
    meaning: "Keagungan yang tiada tara, melampaui segala batas logika akal manusia. Segala sesuatu selain-Nya adalah kecil dan fana.",
    dhikrBenefit: "Membaca 'Ya 'Azhim' mendatangkan rasa takzim kepada Allah dan menumbuhkan wibawa kepemimpinan di hadapan publik."
  },
  {
    number: 34,
    arabic: "الْغَفُورُ",
    latin: "Al-Ghafur",
    translation: "Yang Maha Pengampun",
    category: "mercy",
    quranRef: "QS. Al-Baqarah: 173",
    meaning: "Mengampuni dosa berulang kali seluas samudera bagi hamba-Nya yang kembali bersimpuh memohon ampunan-Nya.",
    dhikrBenefit: "Membaca 'Ya Ghafur' 100x menyembuhkan rasa sesak akibat rasa bersalah dan memperbaharui ikatan taubat kepada Allah."
  },
  {
    number: 35,
    arabic: "الشَّكُورُ",
    latin: "Asy-Syakur",
    translation: "Yang Maha Menghargai & Mensyukuri Amal",
    category: "provision",
    quranRef: "QS. Fathir: 30",
    meaning: "Membalas amal ibadah yang sedikit dengan pahala yang berlipat ganda, dan melipatgandakan nikmat bagi hamba yang bersyukur.",
    dhikrBenefit: "Membaca 'Ya Syakur' 41x saat menghadapi krisis ekonomi membukakan jalan kemudahan dan menumbuhkan rasa qana'ah."
  },
  {
    number: 36,
    arabic: "الْعَلِيُّ",
    latin: "Al-'Aliyy",
    translation: "Yang Maha Tinggi",
    category: "majesty",
    quranRef: "QS. Al-Baqarah: 255",
    meaning: "Derajat, kedudukan, dan sifat-sifat-Nya berada di puncak tertinggi, suci dari keserupaan dengan makhluk.",
    dhikrBenefit: "Membaca 'Ya 'Aliyy' secara rutin mengangkat cita-cita, memperluas wawasan keilmuan, dan menjauhkan dari perbuatan rendah."
  },
  {
    number: 37,
    arabic: "الْكَبِيرُ",
    latin: "Al-Kabir",
    translation: "Yang Maha Besar",
    category: "majesty",
    quranRef: "QS. Ar-Ra'd: 9",
    meaning: "Kebesaran Dzat dan sifat-Nya yang tidak terbatas, mengatasi seluruh langit, bumi, dan apa yang ada di antara keduanya.",
    dhikrBenefit: "Mendawamkan 'Ya Kabir' 100x mempertebal tauhid sehingga kita tidak gentar menghadapi rintangan sebesar apapun di dunia."
  },
  {
    number: 38,
    arabic: "الْحَفِيظُ",
    latin: "Al-Hafizh",
    translation: "Yang Maha Memelihara & Menjaga",
    category: "peace",
    quranRef: "QS. Hud: 57",
    meaning: "Menjaga keteraturan alam semesta dan memelihara hamba-hamba-Nya dari bencana, mara bahaya, serta godaan syaitan.",
    dhikrBenefit: "Membaca 'Ya Hafizh' 16x sehari melindungi diri, anak cucu, dan harta benda dari kecelakaan, pencurian, dan marabahaya."
  },
  {
    number: 39,
    arabic: "الْمُقِيتُ",
    latin: "Al-Muqit",
    translation: "Yang Maha Memberi Kekuatan & Kecukupan",
    category: "provision",
    quranRef: "QS. An-Nisa': 85",
    meaning: "Menyediakan pangan jasmani dan nutrisi rohani yang cukup bagi kelangsungan hidup setiap makhluk ciptaan-Nya.",
    dhikrBenefit: "Membaca 'Ya Muqit' pada segelas air lalu meminumkannya kepada anak dapat menguatkan daya tahan tubuh dan menenangkan perangai rewel."
  },
  {
    number: 40,
    arabic: "الْحَسِيبُ",
    latin: "Al-Hasib",
    translation: "Yang Maha Membuat Perhitungan",
    category: "wisdom",
    quranRef: "QS. An-Nisa': 6",
    meaning: "Mencukupi seluruh kebutuhan hamba-Nya dan memperhitungkan amal perbuatan sekecil biji sawi dengan akurasi mutlak.",
    dhikrBenefit: "Membaca 'Hasbiyallah' dan 'Ya Hasib' 77x melindungi seseorang dari rasa takut menghadapi masa depan atau intimidasi lawan."
  },
  {
    number: 41,
    arabic: "الْجَلِيلُ",
    latin: "Al-Jalil",
    translation: "Yang Maha Luhur / Memiliki Keagungan",
    category: "majesty",
    quranRef: "QS. Ar-Rahman: 27",
    meaning: "Memiliki segala sifat kesempurnaan dan keagungan yang memancarkan rasa segan serta penghormatan dari seluruh alam.",
    dhikrBenefit: "Membaca 'Ya Jalil' memancarkan aura wibawa yang sejuk, disegani kawan maupun lawan tanpa perlu bersikap otoriter."
  },
  {
    number: 42,
    arabic: "الْكَرِيمُ",
    latin: "Al-Karim",
    translation: "Yang Maha Pemurah / Dermawan",
    category: "mercy",
    quranRef: "QS. Al-Infitar: 6",
    meaning: "Memberi tanpa diminta, memaafkan sebelum dimohonkan, dan tidak pernah mengecewakan siapapun yang mengetuk pintu rahmat-Nya.",
    dhikrBenefit: "Membaca 'Ya Karim' sebelum tidur menenangkan batin dan menjemput kemurahan rezeki serta kemudahan urusan esok hari."
  },
  {
    number: 43,
    arabic: "الرَّقِيبُ",
    latin: "Ar-Raqib",
    translation: "Yang Maha Mengawasi",
    category: "peace",
    quranRef: "QS. Al-Ahzab: 52",
    meaning: "Pengawasan-Nya tidak pernah lengah walau sekejap mata, mengamati degup jantung dan gerak sembunyi setiap ciptaan.",
    dhikrBenefit: "Dzikir 'Ya Raqib' 50x sehari menjaga keluarga dan amanah yang kita tinggalkan saat bepergian jauh dari hal-hal buruk."
  },
  {
    number: 44,
    arabic: "الْمُجِيبُ",
    latin: "Al-Mujib",
    translation: "Yang Maha Mengabulkan Doa",
    category: "mercy",
    quranRef: "QS. Hud: 61",
    meaning: "Senantiasa menyambut dan mengabulkan permohonan hamba-Nya yang berdoa dengan penuh kesungguhan dan kerendahan hati.",
    dhikrBenefit: "Membaca 'Ya Mujib' 55x di saat bersujud atau di waktu mustajab menjadi wasilah tercepat diijabahnya doa-doa khusus."
  },
  {
    number: 45,
    arabic: "الْوَاسِعُ",
    latin: "Al-Wasi'",
    translation: "Yang Maha Luas Rahmat & Ilmu-Nya",
    category: "provision",
    quranRef: "QS. Al-Baqarah: 115",
    meaning: "Kapasitas rahmat, ampunan, kekayaan, dan ilmu-Nya tidak memiliki batas tapal, meliputi segala penjuru ruang dan waktu.",
    dhikrBenefit: "Membaca 'Ya Wasi'' 100x melapangkan kesempitan rezeki, menghilangkan rasa sesak dada, dan memperluas kapasitas berpikir."
  },
  {
    number: 46,
    arabic: "الْحَكِيمُ",
    latin: "Al-Hakim",
    translation: "Yang Maha Bijaksana",
    category: "wisdom",
    quranRef: "QS. Al-Baqarah: 32",
    meaning: "Seluruh ketetapan dan penciptaan-Nya sarat dengan hikmah mendalam, tidak ada satupun yang sia-sia atau sembrono.",
    dhikrBenefit: "Membaca 'Ya Hakim' membuahkan hikmah dalam berbicara, menuntun langkah bisnis, dan menghindari penyesalan keputusan."
  },
  {
    number: 47,
    arabic: "الْوَدُودُ",
    latin: "Al-Wadud",
    translation: "Yang Maha Pecinta / Pengasih Tulus",
    category: "mercy",
    quranRef: "QS. Al-Buruj: 14",
    meaning: "Mencintai hamba-hamba-Nya yang shalih dengan cinta yang suci dan murni, serta menanamkan cinta di antara sesama hamba beriman.",
    dhikrBenefit: "Membaca 'Ya Wadud' 1000x adalah amalan masyhur untuk merekatkan kembali keretakan rumah tangga dan ukhuwah persaudaraan."
  },
  {
    number: 48,
    arabic: "الْمَجِيدُ",
    latin: "Al-Majid",
    translation: "Yang Maha Mulia / Terpuji",
    category: "majesty",
    quranRef: "QS. Hud: 73",
    meaning: "Puncak segala kemuliaan, kehormatan, dan keluhuran sifat yang senantiasa dipuji oleh seluruh penghuni langit dan bumi.",
    dhikrBenefit: "Membaca 'Ya Majid' menyinari paras dengan keteduhan dan mengangkat derajat sosial seseorang di mata masyarakat."
  },
  {
    number: 49,
    arabic: "الْبَاعِثُ",
    latin: "Al-Ba'its",
    translation: "Yang Maha Membangkitkan",
    category: "majesty",
    quranRef: "QS. Al-Hajj: 7",
    meaning: "Membangkitkan seluruh manusia dari kubur pada Hari Pembalasan, serta membangkitkan tekad dan semangat dalam jiwa yang redup.",
    dhikrBenefit: "Membaca 'Ya Ba'its' 100x dengan tangan di dada menyalakan kembali gairah hidup, membuang kemalasan, dan membangkitkan himmah juang."
  },
  {
    number: 50,
    arabic: "الشَّهِيدُ",
    latin: "Asy-Syahid",
    translation: "Yang Maha Menyaksikan",
    category: "wisdom",
    quranRef: "QS. Al-Ma'idah: 117",
    meaning: "Hadir dan menyaksikan secara langsung segala kejadian di alam semesta tanpa ada selubung yang menghalangi pandangan-Nya.",
    dhikrBenefit: "Membaca 'Ya Syahid' menumbuhkan rasa muraqabah (senantiasa merasa diawasi Allah) sehingga terjaga dari perbuatan maksiat."
  },
  {
    number: 51,
    arabic: "الْحَقُّ",
    latin: "Al-Haqq",
    translation: "Yang Maha Benar",
    category: "wisdom",
    quranRef: "QS. Al-Hajj: 6",
    meaning: "Kebenaran hakiki yang mutlak dan abadi. Janji-Nya benar, firman-Nya benar, dan perjumpaan dengan-Nya adalah kepastian.",
    dhikrBenefit: "Membaca 'La ilaha illallahul Malikul Haqqul Mubin' 100x melapangkan rezeki dan mengukuhkan keyakinan iman."
  },
  {
    number: 52,
    arabic: "الْوَكِيلُ",
    latin: "Al-Wakil",
    translation: "Yang Maha Memelihara Penyerahan Urusan",
    category: "peace",
    quranRef: "QS. Ali 'Imran: 173",
    meaning: "Sebaik-baik tempat bersandar dan menyerahkan seluruh urusan. Siapa yang bertawakal kepada-Nya, niscaya dicukupi segala keperluannya.",
    dhikrBenefit: "Membaca 'Hasbunallah wa ni'mal wakil' dan 'Ya Wakil' menghilangkan kecemasan, rasa terancam, dan mendatangkan pertolongan kilat."
  },
  {
    number: 53,
    arabic: "الْقَوِيُّ",
    latin: "Al-Qawiyy",
    translation: "Yang Maha Kuat",
    category: "majesty",
    quranRef: "QS. Asy-Syura: 19",
    meaning: "Memiliki kekuatan yang sempurna tanpa batas, tidak pernah mengenal letih, lemah, atau berkurang kekuatannya sepanjang masa.",
    dhikrBenefit: "Membaca 'Ya Qawiyy' menguatkan fisik yang lemas, memberi ketahanan tubuh, dan membentengi diri dari niat jahat orang zalim."
  },
  {
    number: 54,
    arabic: "الْمَتِينُ",
    latin: "Al-Matin",
    translation: "Yang Maha Kokoh",
    category: "majesty",
    quranRef: "QS. Adz-Dzariyat: 58",
    meaning: "Kekokohan yang tak tergoyahkan, teguh tanpa tandingan, dan tidak dapat dihentikan oleh kekuatan apapun di jagat raya.",
    dhikrBenefit: "Mendawamkan 'Ya Matin' mengokohkan istiqomah dalam ibadah, menjaga prinsip integritas, dan menenangkan jiwa anak yang gelisah."
  },
  {
    number: 55,
    arabic: "الْوَلِيُّ",
    latin: "Al-Waliyy",
    translation: "Yang Maha Melindungi / Menolong",
    category: "peace",
    quranRef: "QS. Al-Baqarah: 257",
    meaning: "Sahabat setia dan pelindung utama bagi orang-orang beriman, membimbing mereka keluar dari kegelapan menuju cahaya terang benderang.",
    dhikrBenefit: "Membaca 'Ya Waliyy' mengundang pertolongan Allah dalam urusan hukum, kemitraan bisnis, dan persahabatan sejati."
  },
  {
    number: 56,
    arabic: "الْحَمِيدُ",
    latin: "Al-Hamid",
    translation: "Yang Maha Terpuji",
    category: "mercy",
    quranRef: "QS. Ibrahim: 1",
    meaning: "Berhak atas segala pujian murni di alam semesta karena keagungan Dzat-Nya, kebaikan nikmat-Nya, dan keadilan takdir-Nya.",
    dhikrBenefit: "Membaca 'Ya Hamid' 100x setiap hari membersihkan lisan dari perkataan kotor, ghibah, dan mendatangkan kecintaan orang lain."
  },
  {
    number: 57,
    arabic: "الْمُحْصِي",
    latin: "Al-Muhshi",
    translation: "Yang Maha Memperhitungkan / Menghitung",
    category: "wisdom",
    quranRef: "QS. Maryam: 94",
    meaning: "Menghitung secara detail setiap butir pasir, tetes hujan, helai daun, dan hembusan nafas tanpa ada yang luput satupun.",
    dhikrBenefit: "Dzikir 'Ya Muhshi' memudahkan seseorang dalam ketelitian manajemen keuangan, akuntansi, dan menjaga amanah organisasi."
  },
  {
    number: 58,
    arabic: "الْمُبْدِئُ",
    latin: "Al-Mubdi'",
    translation: "Yang Maha Memulai Penciptaan",
    category: "provision",
    quranRef: "QS. Al-Buruj: 13",
    meaning: "Memulai penciptaan alam semesta dan kehidupan pertama kali dari ketiadaan tanpa adanya contoh cetak biru terdahulu.",
    dhikrBenefit: "Membaca 'Ya Mubdi'' sebelum merintis proyek bisnis atau karya baru membawa berkah dan kelancaran fase awal eksekusi."
  },
  {
    number: 59,
    arabic: "الْمُعِيدُ",
    latin: "Al-Mu'id",
    translation: "Yang Maha Mengembalikan Kehidupan",
    category: "majesty",
    quranRef: "QS. Al-Buruj: 13",
    meaning: "Mengembalikan ciptaan setelah hancur menjadi hidup kembali pada Hari Kiamat, serta mampu memulihkan nikmat yang sempat hilang.",
    dhikrBenefit: "Membaca 'Ya Mu'id' 70x saat kehilangan barang berharga atau mengalami kemunduran usaha mempermudah kembalinya peluang."
  },
  {
    number: 60,
    arabic: "الْمُحْيِي",
    latin: "Al-Muhyi",
    translation: "Yang Maha Menghidupkan",
    category: "provision",
    quranRef: "QS. Ar-Rum: 50",
    meaning: "Memberi nyawa dan menghidupkan sel-sel raga, serta menyuburkan tanah yang tandus dengan curahan air hujan yang berkah.",
    dhikrBenefit: "Membaca 'Ya Muhyi' 58x untuk kesembuhan penyakit kronis dan menghidupkan kembali hati yang gersang dari zikrullah."
  },
  {
    number: 61,
    arabic: "الْمُمِيتُ",
    latin: "Al-Mumit",
    translation: "Yang Maha Mematikan",
    category: "majesty",
    quranRef: "QS. Al-Mu'min: 68",
    meaning: "Menentukan ajal kematian setiap makhluk hidup sesuai ketetapan waktu yang tidak dapat dimajukan atau dimundurkan sedetik pun.",
    dhikrBenefit: "Mengingatkan kita akan hakikat kefanaan dunia dan mematikan hawa nafsu syahwat yang merusak kehormatan diri."
  },
  {
    number: 62,
    arabic: "الْحَيُّ",
    latin: "Al-Hayy",
    translation: "Yang Maha Hidup Abadi",
    category: "majesty",
    quranRef: "QS. Al-Baqarah: 255",
    meaning: "Hidup kekal abadi tanpa permulaan dan tanpa akhir, tidak pernah mengantuk, letih, atau mengenal kematian.",
    dhikrBenefit: "Membaca 'Ya Hayyu Ya Qayyum bi rahmatika astaghits' adalah doa mustajab Rasulullah SAW saat menghadapi kesulitan dahsyat."
  },
  {
    number: 63,
    arabic: "الْقَيُّومُ",
    latin: "Al-Qayyum",
    translation: "Yang Maha Mandiri & Mengurus Makhluk-Nya",
    category: "majesty",
    quranRef: "QS. Al-Baqarah: 255",
    meaning: "Berdiri sendiri tanpa membutuhkan bantuan apapun, sekaligus menopang dan mengurus kelangsungan seluruh eksistensi alam semesta.",
    dhikrBenefit: "Mendawamkan 'Ya Qayyum' mengikis kemalasan, memberi vitalitas energi, dan melancarkan penyelesaian tugas-tugas kompleks."
  },
  {
    number: 64,
    arabic: "الْوَاجِدُ",
    latin: "Al-Wajid",
    translation: "Yang Maha Menemukan / Mengadakan",
    category: "provision",
    quranRef: "QS. Adh-Dhuha: 7",
    meaning: "Tidak pernah kekurangan sesuatu apapun, mampu mewujudkan apa saja yang dikehendaki tanpa ada yang dapat menyembunyikan diri.",
    dhikrBenefit: "Membaca 'Ya Wajid' di setiap suapan makan menumbuhkan rasa syukur dan kecukupan hati dari kerakusan duniawi."
  },
  {
    number: 65,
    arabic: "الْمَاجِدُ",
    latin: "Al-Majid",
    translation: "Yang Maha Mulia & Dermawan",
    category: "majesty",
    quranRef: "QS. Hud: 73",
    meaning: "Kedermawanan-Nya yang melimpah dan keluhuran nama-Nya yang abadi menaungi seluruh jagat raya.",
    dhikrBenefit: "Dzikir 'Ya Majid' menerangi kalbu dengan kebersihan niat dan menjauhkan dari sifat kikir."
  },
  {
    number: 66,
    arabic: "الْوَاحِدُ",
    latin: "Al-Wahid",
    translation: "Yang Maha Tunggal",
    category: "majesty",
    quranRef: "QS. Al-Baqarah: 163",
    meaning: "Esa dalam Dzat-Nya, tiada berbilang, tiada sekutu, dan tidak tersusun dari bagian-bagian apapun.",
    dhikrBenefit: "Membaca 'Ya Wahid' 100x memurnikan keimanan tauhid dan menghilangkan rasa takut berlebihan kepada makhluk."
  },
  {
    number: 67,
    arabic: "الْأَحَدُ",
    latin: "Al-Ahad",
    translation: "Yang Maha Esa",
    category: "majesty",
    quranRef: "QS. Al-Ikhlas: 1",
    meaning: "Keberadaan-Nya mutlak satu-satunya, tiada tandingan, tiada banding, dan tiada tara dalam segala aspek kesempurnaan.",
    dhikrBenefit: "Membaca surah Al-Ikhlas dan 'Ya Ahad' 1000x membuka rahasia ketenangan batin dan benteng utama dari syirik."
  },
  {
    number: 68,
    arabic: "الصَّمَدُ",
    latin: "Ash-Shamad",
    translation: "Yang Menjadi Tumpuan Segala Kebutuhan",
    category: "provision",
    quranRef: "QS. Al-Ikhlas: 2",
    meaning: "Tempat bergantung seluruh makhluk dalam memenuhi hajat, menyelesaikan krisis, dan memohon keselamatan hidup.",
    dhikrBenefit: "Membaca 'Ya Shamad' 125x di waktu sahur menjauhkan diri dari kelaparan, dahaga, dan ketergantungan pada manusia."
  },
  {
    number: 69,
    arabic: "الْقَادِرُ",
    latin: "Al-Qadir",
    translation: "Yang Maha Menentukan / Berkuasa",
    category: "majesty",
    quranRef: "QS. Al-Baqarah: 20",
    meaning: "Mampu melakukan apa saja yang dikehendaki-Nya tanpa ada penghalang atau batasan kemampuan apapun.",
    dhikrBenefit: "Membaca 'Ya Qadir' 100x setelah shalat sunnah menguatkan mental dan memudahkan tercapainya cita-cita mulia."
  },
  {
    number: 70,
    arabic: "الْمُقْتَدِرُ",
    latin: "Al-Muqtadir",
    translation: "Yang Maha Berkuasa Penuh",
    category: "majesty",
    quranRef: "QS. Al-Qamar: 42",
    meaning: "Kekuasaan-Nya menembus dan menentukan takdir seluruh alam semesta secara mutlak tanpa tandingan.",
    dhikrBenefit: "Membaca 'Ya Muqtadir' saat bangun tidur membimbing kita terhindar dari rasa malas dan kelalaian berdzikir."
  },
  {
    number: 71,
    arabic: "الْمُقَدِّمُ",
    latin: "Al-Muqaddim",
    translation: "Yang Maha Mendahulukan",
    category: "wisdom",
    quranRef: "QS. Qaf: 28",
    meaning: "Mendahulukan apa saja yang layak didahulukan menurut hikmah-Nya, seperti mendahulukan orang berilmu atas orang jahil.",
    dhikrBenefit: "Membaca 'Ya Muqaddim' dalam perjuangan atau kompetisi memberikan keunggulan moral dan mendahului dalam prestasi."
  },
  {
    number: 72,
    arabic: "الْمُؤَخِّرُ",
    latin: "Al-Mu'akhkhir",
    translation: "Yang Maha Mengakhirkan",
    category: "wisdom",
    quranRef: "QS. Ibrahim: 42",
    meaning: "Menunda atau mengakhirkan apa saja menurut keadilan-Nya, memberi kesempatan bagi orang berdosa untuk bertaubat.",
    dhikrBenefit: "Membaca 'Ya Mu'akhkhir' 100x menjauhkan godaan tergesa-gesa dan mengajarkan tawakal pada waktu terbaik menurut Allah."
  },
  {
    number: 73,
    arabic: "الْأَوَّلُ",
    latin: "Al-Awwal",
    translation: "Yang Maha Awal Tanpa Permulaan",
    category: "majesty",
    quranRef: "QS. Al-Hadid: 3",
    meaning: "Ada sebelum segala sesuatu ada, tanpa permulaan masa dan tanpa sebab yang mendahului keberadaan-Nya.",
    dhikrBenefit: "Membaca 'Ya Awwal' 37x sehari mempermudah kelancaran awal usaha dan mendatangkan keberkahan pada anak sulung."
  },
  {
    number: 74,
    arabic: "الْآخِرُ",
    latin: "Al-Akhir",
    translation: "Yang Maha Akhir Tanpa Kesudahan",
    category: "majesty",
    quranRef: "QS. Al-Hadid: 3",
    meaning: "Kekal abadi setelah seluruh alam semesta hancur binasa, tiada akhir dan tiada batas bagi keberadaan-Nya.",
    dhikrBenefit: "Membaca 'Ya Akhir' 100x membersihkan hati dari cinta dunia yang berlebihan dan memohon husnul khatimah di akhir hayat."
  },
  {
    number: 75,
    arabic: "الظَّاهِرُ",
    latin: "Azh-Zhahir",
    translation: "Yang Maha Nyata",
    category: "wisdom",
    quranRef: "QS. Al-Hadid: 3",
    meaning: "Keberadaan-Nya sangat nyata dan terbukti terang benderang melalui tanda-tanda kebesaran ciptaan-Nya di alam raya.",
    dhikrBenefit: "Membaca 'Ya Zhahir' setelah shalat Isyraq menerangi mata hati dengan hikmah dan ma'rifatullah."
  },
  {
    number: 76,
    arabic: "الْبَاطِنُ",
    latin: "Al-Bathin",
    translation: "Yang Maha Tersembunyi",
    category: "wisdom",
    quranRef: "QS. Al-Hadid: 3",
    meaning: "Dzat-Nya tidak dapat dijangkau oleh panca indera penglihatan duniawi, namun kehadiran-Nya terasa nyata dalam setiap jiwa.",
    dhikrBenefit: "Membaca 'Ya Bathin' 33x menumbuhkan ketenteraman batin dan membentengi rahasia kebaikan kita dari sifat pamer (riya)."
  },
  {
    number: 77,
    arabic: "الْوَالِي",
    latin: "Al-Wali",
    translation: "Yang Maha Memerintah & Mengelola",
    category: "majesty",
    quranRef: "QS. Ar-Ra'd: 11",
    meaning: "Penguasa tunggal yang mengelola, mengatur, dan merencanakan seluruh tatanan hukum kosmik alam semesta.",
    dhikrBenefit: "Membaca 'Ya Wali' melindungi rumah kediaman dari musibah dan menjaga stabilitas kepemimpinan."
  },
  {
    number: 78,
    arabic: "الْمُتَعَالِي",
    latin: "Al-Muta'ali",
    translation: "Yang Maha Tinggi / Suci dari Cacat",
    category: "majesty",
    quranRef: "QS. Ar-Ra'd: 9",
    meaning: "Maha Tinggi di atas segala sifat kekurangan makhluk, melampaui segala angan-angan dan konsepsi ciptaan-Nya.",
    dhikrBenefit: "Dzikir 'Ya Muta'ali' memudahkan seseorang memperoleh kemuliaan akhlak dan dihormati dalam musyawarah."
  },
  {
    number: 79,
    arabic: "الْبَرُّ",
    latin: "Al-Barr",
    translation: "Yang Maha Penderma / Sumber Kebajikan",
    category: "mercy",
    quranRef: "QS. Ath-Thur: 28",
    meaning: "Sumber segala kebaikan, santun kepada hamba-Nya, dan melipatgandakan pahala kebaikan sekecil zarrah.",
    dhikrBenefit: "Membaca 'Ya Barr' 7x sehari menumbuhkan bakti tulus kepada orang tua dan menjauhkan anak-anak dari kenakalan."
  },
  {
    number: 80,
    arabic: "التَّوَّابُ",
    latin: "At-Tawwab",
    translation: "Yang Maha Menerima Taubat",
    category: "mercy",
    quranRef: "QS. Al-Baqarah: 37",
    meaning: "Senantiasa membukakan pintu ampunan bagi hamba yang bertaubat, tidak pernah jemu menerima kepulangan pendosa yang insyaf.",
    dhikrBenefit: "Membaca 'Ya Tawwab' 360x setelah shalat Dhuha melegakan hati yang tertekan oleh dosa dan meneguhkan taubatan nasuha."
  },
  {
    number: 81,
    arabic: "الْمُنْتَقِمُ",
    latin: "Al-Muntaqim",
    translation: "Yang Maha Pembalas Kezaliman",
    category: "majesty",
    quranRef: "QS. As-Sajdah: 22",
    meaning: "Menjatuhkan hukuman yang setimpal kepada kaum penindas yang melampaui batas setelah peringatan diabaikan.",
    dhikrBenefit: "Dibaca oleh orang yang terzalimi tanpa daya agar keadilan ditegakkan oleh Allah tanpa perlu menaruh dendam pribadi."
  },
  {
    number: 82,
    arabic: "العَفُوُّ",
    latin: "Al-'Afuww",
    translation: "Yang Maha Pemaaf",
    category: "mercy",
    quranRef: "QS. An-Nisa': 99",
    meaning: "Menghapuskan dosa hingga ke akar-akarnya seolah-olah dosa tersebut tidak pernah terjadi dalam catatan takdir.",
    dhikrBenefit: "Doa masyhur Lailatul Qadar: 'Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anni' (Ya Allah, Engkau Maha Pemaaf, cintai pemaafan, maka maafkanlah aku)."
  },
  {
    number: 83,
    arabic: "الرَّؤُوفُ",
    latin: "Ar-Ra'uf",
    translation: "Yang Maha Pengasih & Berbelas Kasih",
    category: "mercy",
    quranRef: "QS. Al-Baqarah: 207",
    meaning: "Tingkat kasih sayang tertinggi yang disertai kelembutan mendalam, melindungi hamba dari kesengsaraan yang memberatkan.",
    dhikrBenefit: "Membaca 'Ya Ra'uf' 10x menumbuhkan kasih sayang dalam rumah tangga dan melembutkan hati orang yang bersikap keras."
  },
  {
    number: 84,
    arabic: "مَالِكُ الْمُلْكِ",
    latin: "Malikul Mulk",
    translation: "Penguasa Kedaulatan Semesta Abadi",
    category: "majesty",
    quranRef: "QS. Ali 'Imran: 26",
    meaning: "Pemilik mutlak seluruh kerajaan langit dan bumi, memberikan kekuasaan kepada yang dikehendaki dan mencabutnya menurut keadilan-Nya.",
    dhikrBenefit: "Membaca 'Ya Malikul Mulk' 212x menjauhkan seseorang dari kebangkrutan usaha dan menjaga kemapanan rezeki yang berkah."
  },
  {
    number: 85,
    arabic: "ذُو الْجَلاَلِ وَالإِكْرَامِ",
    latin: "Dzul Jalali wal Ikram",
    translation: "Pemilik Keagungan & Kemuliaan",
    category: "majesty",
    quranRef: "QS. Ar-Rahman: 27",
    meaning: "Dzat yang memiliki keagungan yang mempesona sekaligus kemurahan yang melimpah, layak ditakuti dan dicintai seutuhnya.",
    dhikrBenefit: "Dianjurkan Rasulullah SAW untuk didawamkan dalam doa: 'Alzhimm bi Ya Dzal Jalali wal Ikram' agar permohonan lekas dikabulkan."
  },
  {
    number: 86,
    arabic: "الْمُقْسِطُ",
    latin: "Al-Muqsit",
    translation: "Yang Maha Adil & Menegakkan Keseimbangan",
    category: "wisdom",
    quranRef: "QS. Al-Anbiyya': 47",
    meaning: "Menegakkan keadilan dengan seimbang, menyelamatkan orang yang terzalimi dan mengembalikan hak kepada pemiliknya.",
    dhikrBenefit: "Membaca 'Ya Muqsit' 100x membuang sifat was-was saat beribadah dan mempermudah konsentrasi dalam pekerjaan."
  },
  {
    number: 87,
    arabic: "الْجَامِعُ",
    latin: "Al-Jami'",
    translation: "Yang Maha Mengumpulkan",
    category: "peace",
    quranRef: "QS. Ali 'Imran: 9",
    meaning: "Mengumpulkan seluruh makhluk pada Hari Kiamat, serta mampu menyatukan hati-hati yang tercerai berai dalam persaudaraan.",
    dhikrBenefit: "Membaca 'Ya Jami'' saat mencari barang hilang atau merindukan kumpul reuni keluarga besar alumni yang lama berpisah."
  },
  {
    number: 88,
    arabic: "الْغَنِيُّ",
    latin: "Al-Ghaniyy",
    translation: "Yang Maha Kaya / Tidak Memerlukan Apapun",
    category: "provision",
    quranRef: "QS. Al-Baqarah: 267",
    meaning: "Kaya mutlak tanpa membutuhkan persembahan atau bantuan apapun dari makhluk, sedangkan seluruh makhluk fakir di hadapan-Nya.",
    dhikrBenefit: "Membaca 'Ya Ghaniyy' 70x sehari membebaskan diri dari jeratan hutang dan menumbuhkan kekayaan batin (ghina an-nafs)."
  },
  {
    number: 89,
    arabic: "الْمُغْنِي",
    latin: "Al-Mughni",
    translation: "Yang Maha Menganugerahkan Kekayaan",
    category: "provision",
    quranRef: "QS. An-Najm: 48",
    meaning: "Menganugerahkan kecukupan materi dan spiritual kepada siapa saja yang dikehendaki-Nya menurut takaran hikmah.",
    dhikrBenefit: "Membaca 'Ya Mughni' 1000x setiap malam Jumat memperlancar permodalan usaha dan membuka keran rezeki yang berkah."
  },
  {
    number: 90,
    arabic: "الْمَانِعُ",
    latin: "Al-Mani'",
    translation: "Yang Maha Mencegah / Membela",
    category: "peace",
    quranRef: "QS. Al-Mulk: 21",
    meaning: "Mencegah terjadinya bahaya atau menahan rezeki demi melindungi hamba dari kehancuran yang tidak disadarinya.",
    dhikrBenefit: "Membaca 'Ya Mani'' 20x sebelum tidur membentengi rumah tangga dari perselisihan dan godaan orang ketiga."
  },
  {
    number: 91,
    arabic: "الضَّارُّ",
    latin: "Adh-Dharr",
    translation: "Yang Maha Menimpakan Kemudharatan",
    category: "majesty",
    quranRef: "QS. Al-An'am: 17",
    meaning: "Segala mara bahaya, sakit, dan ujian hidup terjadi semata atas izin dan kehendak-Nya demi hikmah penyucian dosa.",
    dhikrBenefit: "Mengingatkan kita bahwa tidak ada satu makhluk pun yang dapat mencelakai kita tanpa izin Allah SWT."
  },
  {
    number: 92,
    arabic: "النَّافِعُ",
    latin: "An-Nafi'",
    translation: "Yang Maha Memberi Manfaat",
    category: "provision",
    quranRef: "QS. Yunus: 107",
    meaning: "Sumber segala kemaslahatan, kesehatan, dan keberkahan hidup. Kebaikan apapun yang kita terima sejatinya datang dari-Nya.",
    dhikrBenefit: "Membaca 'Ya Nafi'' sebelum memulai perjalanan atau meminum obat meningkatkan efektivitas manfaat dan kesembuhan."
  },
  {
    number: 93,
    arabic: "النُّورُ",
    latin: "An-Nur",
    translation: "Yang Maha Menerangi",
    category: "wisdom",
    quranRef: "QS. An-Nur: 35",
    meaning: "Cahaya langit dan bumi yang menyinari alam semesta dengan petunjuk Al-Qur'an dan menuntun hati keluar dari kegelapan jahiliyah.",
    dhikrBenefit: "Membaca surah An-Nur dan 'Ya Nur' 100x menyinari wajah dengan kecerahan spiritual dan menerangi akal dalam mencari solusi."
  },
  {
    number: 94,
    arabic: "الْهَادِي",
    latin: "Al-Hadi",
    translation: "Yang Maha Pemberi Petunjuk",
    category: "wisdom",
    quranRef: "QS. Al-Hajj: 54",
    meaning: "Membimbing hamba-hamba-Nya menuju jalan kebenaran (shirathal mustaqim), menganugerahkan hidayah taufiq kepada jiwa yang ikhlas.",
    dhikrBenefit: "Membaca 'Ya Hadi' 100x memohon keteguhan iman bagi diri sendiri, hidayah bagi anak keturunan, dan keputusan yang benar."
  },
  {
    number: 95,
    arabic: "الْبَدِيعُ",
    latin: "Al-Badi'",
    translation: "Yang Maha Pencipta Keindahan Tanpa Tandingan",
    category: "provision",
    quranRef: "QS. Al-Baqarah: 117",
    meaning: "Menciptakan mahakarya semesta dengan keindahan estetika yang menakjubkan tanpa ada contoh tiruan sebelumnya.",
    dhikrBenefit: "Membaca 'Ya Badi'as-samawati wal ardh' 70x melepaskan seseorang dari keputusasaan dan membuahkan ide-ide brilian yang unik."
  },
  {
    number: 96,
    arabic: "الْبَاقِي",
    latin: "Al-Baqi",
    translation: "Yang Maha Kekal",
    category: "majesty",
    quranRef: "QS. Ar-Rahman: 27",
    meaning: "Kekal abadi selamanya saat seluruh galaksi dan makhluk telah fana. Keabadian adalah milik-Nya semata.",
    dhikrBenefit: "Membaca 'Ya Baqi' 100x sebelum matahari terbit memelihara amal kebaikan dari kehancuran dan menjauhkan dari rasa duka cita."
  },
  {
    number: 97,
    arabic: "الْوَارِثُ",
    latin: "Al-Warits",
    translation: "Yang Maha Mewarisi",
    category: "majesty",
    quranRef: "QS. Al-Hijr: 23",
    meaning: "Pemilik sejati seluruh perbendaharaan langit dan bumi yang kembali kepada-Nya setelah semua pemilik fana meninggalkan dunia.",
    dhikrBenefit: "Membaca 'Ya Warits' 100x memohon keturunan shalih yang melanjutkan estafet perjuangan dakwah dan kebaikan hidup."
  },
  {
    number: 98,
    arabic: "الرَّشِيدُ",
    latin: "Ar-Rasyid",
    translation: "Yang Maha Cerdas & Pembimbing yang Lurus",
    category: "wisdom",
    quranRef: "QS. Al-Kahfi: 10",
    meaning: "Membimbing seluruh urusan alam semesta dengan ketepatan paripurna tanpa kesalahan dan tanpa perlu penasihat.",
    dhikrBenefit: "Membaca 'Ya Rasyid' 1000x antara Maghrib dan Isya mempertajam kecerdasan berpikir dan membuka jalan terang dalam karir."
  },
  {
    number: 99,
    arabic: "الصَّبُورُ",
    latin: "Ash-Shabur",
    translation: "Yang Maha Penyabar",
    category: "mercy",
    quranRef: "QS. Al-Baqarah: 153",
    meaning: "Tidak pernah tergesa-gesa menghukum orang yang berdosa, melimpahkan kesabaran agung dalam menata takdir seluruh makhluk-Nya.",
    dhikrBenefit: "Membaca 'Ya Shabur' 100x sebelum fajar menganugerahkan ketabahan baja dalam menghadapi cobaan berat dan meredakan amarah."
  }
];
