export type MahfuzhatCategory = 'all' | 'success' | 'brotherhood' | 'adab' | 'knowledge' | 'wisdom';

export interface MahfuzhatQuiz {
  questionPart: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface MahfuzhatItem {
  id: string;
  number: number;
  arabic: string;
  latin: string;
  translation: string;
  syarah: string;
  category: 'success' | 'brotherhood' | 'adab' | 'knowledge' | 'wisdom';
  source?: string;
  quiz: MahfuzhatQuiz;
}

export const MAFHUZHAT_CATEGORIES: { key: MahfuzhatCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'Semua Hikmah', icon: '✨' },
  { key: 'success', label: 'Perjuangan & Sukses', icon: '⚡' },
  { key: 'knowledge', label: 'Ilmu & Waktu', icon: '📖' },
  { key: 'adab', label: 'Adab & Akhlak', icon: '💎' },
  { key: 'brotherhood', label: 'Ukhuwah & Sahabat', icon: '🤝' },
  { key: 'wisdom', label: 'Kebijaksanaan Hidup', icon: '🌙' },
];

export const MAFHUZHAT_DATA: MahfuzhatItem[] = [
  {
    id: 'mahfuzhat-1',
    number: 1,
    arabic: 'مَنْ جَدَّ وَجَدَ',
    latin: "Man jadda wajada",
    translation: "Barang siapa bersungguh-sungguh, dia pasti akan berhasil.",
    syarah: "Fondasi utama dari segala pencapaian besar dalam hidup dan peradaban. Kesungguhan (al-jiddiyah) bukan sekadar bekerja keras tanpa arah, melainkan konsistensi, totalitas fokus, dan daya juang yang tak gentar saat menghadapi tantangan karir, studi, maupun rintisan bisnis alumni.",
    category: 'success',
    source: 'Kaidah Hikmah Klasik Pesantren',
    quiz: {
      questionPart: 'مَنْ جَدَّ ...',
      options: ['وَجَدَ', 'ظَفِرَ', 'وَصَلَ', 'حَصَدَ'],
      answerIndex: 0,
      explanation: "Lanjutan kalimat adalah 'وَجَدَ' (wajada), yang bermakna 'ia pasti mendapati / berhasil'."
    }
  },
  {
    id: 'mahfuzhat-2',
    number: 2,
    arabic: 'مَنْ صَبَرَ ظَفِرَ',
    latin: "Man shabara zhafira",
    translation: "Barang siapa bersabar, dia pasti akan beruntung dan menang.",
    syarah: "Sabar adalah daya tahan mental (grit) untuk terus melangkah di saat hasil belum tampak di pelupuk mata. Dalam dunia profesional dan kepemimpinan, pemenang sejati bukanlah yang tercepat melesat, melainkan yang paling tangguh bertahan dalam badai.",
    category: 'success',
    source: 'Kaidah Hikmah Klasik Pesantren',
    quiz: {
      questionPart: 'مَنْ صَبَرَ ...',
      options: ['خَسِرَ', 'ظَفِرَ', 'سَارَ', 'عَلِمَ'],
      answerIndex: 1,
      explanation: "Lanjutan kalimat adalah 'ظَفِرَ' (zhafira), yang berarti 'dia akan beruntung / memperoleh kemenangan'."
    }
  },
  {
    id: 'mahfuzhat-3',
    number: 3,
    arabic: 'مَنْ سَارَ عَلَى الدَّرْبِ وَصَلَ',
    latin: "Man saara 'alad-darbi washala",
    translation: "Barang siapa berjalan pada jalurnya, dia pasti akan sampai ke tujuan.",
    syarah: "Visi yang tinggi memerlukan roadmap yang terarah. Selama kita tetap berada di rel integritas, disiplin proses, dan metode yang benar, maka jarak ribuan mil hanyalah soal akumulasi langkah-langkah konsisten setiap harinya.",
    category: 'success',
    source: 'Pepatah Arab Klasik',
    quiz: {
      questionPart: 'مَنْ سَارَ عَلَى الدَّرْبِ ...',
      options: ['فَرِحَ', 'رَجَعَ', 'وَصَلَ', 'نَجَحَ'],
      answerIndex: 2,
      explanation: "Lanjutan kalimat adalah 'وَصَلَ' (washala), bermakna 'ia akan sampai pada tujuannya'."
    }
  },
  {
    id: 'mahfuzhat-4',
    number: 4,
    arabic: 'مَنْ قَلَّ صِدْقُهُ قَلَّ صَدِيقُهُ',
    latin: "Man qalla shidquhu qalla shadiiquhu",
    translation: "Barang siapa sedikit kejujurannya, sedikit pula kawan sejatinya.",
    syarah: "Integritas adalah mata uang sosial paling bernilai. Kredibilitas seorang alumni diukur dari kesesuaian antara kata dan perbuatan. Saat kejujuran pudar, orang lain mungkin masih bersikap ramah di permukaan, tetapi kepercayaan sejati telah sirna.",
    category: 'brotherhood',
    source: 'Adab Pergaulan Salaf',
    quiz: {
      questionPart: 'مَنْ قَلَّ صِدْقُهُ ...',
      options: ['قَلَّ مَالُهُ', 'قَلَّ صَدِيقُهُ', 'كَثُرَ عَدُوُّهُ', 'طَالَ عُمْرُهُ'],
      answerIndex: 1,
      explanation: "Sambungan yang tepat adalah 'قَلَّ صَدِيقُهُ' (qalla shadiiquhu), sedikit pula temannya."
    }
  },
  {
    id: 'mahfuzhat-5',
    number: 5,
    arabic: 'جَالِسْ أَهْلَ الصِّدْقِ وَالْوَفَاءِ',
    latin: "Jaalis ahlash-shidqi wal-wafa'",
    translation: "Bergaullah dengan orang-orang yang jujur dan menepati janji.",
    syarah: "Lingkaran pertemanan membentuk masa depan seseorang (networking value). Berada di tengah sahabat-sahabat yang menjunjung tinggi kebenaran dan kesetiaan janji akan menjaga kompas moral serta menginspirasi kita untuk terus bertumbuh.",
    category: 'brotherhood',
    source: 'Diwan Al-Imam Asy-Syafi\'i',
    quiz: {
      questionPart: 'جَالِسْ أَهْلَ الصِّدْقِ ...',
      options: ['وَالْكَرَمِ', 'وَالْجَفَاءِ', 'وَالْوَفَاءِ', 'وَالْغِنَى'],
      answerIndex: 2,
      explanation: "Pasangan dari kata 'الصِّدْق' dalam mahfuzhat ini adalah 'وَالْوَفَاءِ' (dan yang menepati janji)."
    }
  },
  {
    id: 'mahfuzhat-6',
    number: 6,
    arabic: 'مَوَدَّةُ الصَّدِيقِ تَظْهَرُ وَقْتَ الضِّيقِ',
    latin: "Mawaddatush-shadiiqi tazhharu waqtadh-dhiiq",
    translation: "Ketulusan kasih sayang sahabat sejati terlihat nyata di saat sempit dan sulit.",
    syarah: "Banyak orang mendekat ketika kita berada di puncak kesuksesan, namun hanya sahabat sejati yang bersedia berdiri berdampingan ketika kita terpuruk dalam ujian hidup. Expedient 43 adalah ikatan persaudaraan yang saling menopang dalam suka dan duka.",
    category: 'brotherhood',
    source: 'Kalam Hikmah Arab',
    quiz: {
      questionPart: 'مَوَدَّةُ الصَّدِيقِ تَظْهَرُ وَقْتَ ...',
      options: ['الرَّخَاءِ', 'الضِّيقِ', 'السُّرُورِ', 'النَّوْمِ'],
      answerIndex: 1,
      explanation: "Kelanjutan kalimat adalah 'الضِّيقِ' (waktu sempit / masa krisis)."
    }
  },
  {
    id: 'mahfuzhat-7',
    number: 7,
    arabic: 'وَمَا اللَّذَّةُ إِلَّا بَعْدَ التَّعَبِ',
    latin: "Wa mal-ladzdzatu illaa ba'dat-ta'ab",
    translation: "Tidak ada kenikmatan sejati melainkan setelah kelelahan dan perjuangan.",
    syarah: "Kenikmatan instan tanpa perjuangan akan terasa hampa dan cepat menguap. Kepuasan batin seorang pembelajar atau pejuang terletak pada jerih payah, keringat, dan pengorbanan yang telah ia curahkan sebelum memetik buah kemenangan.",
    category: 'success',
    source: 'Kalam Al-Hukama',
    quiz: {
      questionPart: 'وَمَا اللَّذَّةُ إِلَّا بَعْدَ ...',
      options: ['الرَّاحَةِ', 'التَّعَبِ', 'النَّجَاحِ', 'اللَّعِبِ'],
      answerIndex: 1,
      explanation: "Lanjutan bait adalah 'التَّعَبِ' (kelelahan dan jerih payah)."
    }
  },
  {
    id: 'mahfuzhat-8',
    number: 8,
    arabic: 'الصَّبْرُ يُعِينُ عَلَى كُلِّ عَمَلٍ',
    latin: "Ash-shabru yu'iinu 'alaa kulli 'amalin",
    translation: "Kesabaran itu menolong dan memudahkan penyelesaian setiap pekerjaan.",
    syarah: "Proyek besar dan karya monumental tidak diciptakan dalam semalam. Kesabaran menghindarkan kita dari ketergesa-gesaan fatal, kecerobohan teknis, dan rasa frustrasi dini ketika hasil belum langsung terwujud.",
    category: 'success',
    source: 'Atsar Hikmah',
    quiz: {
      questionPart: 'الصَّبْرُ يُعِينُ عَلَى كُلِّ ...',
      options: ['سَفَرٍ', 'عَمَلٍ', 'يَوْمٍ', 'رَجُلٍ'],
      answerIndex: 1,
      explanation: "Kalimat lengkapnya adalah 'الصَّبْرُ يُعِينُ عَلَى كُلِّ عَمَلٍ' (kesabaran menolong tiap urusan/pekerjaan)."
    }
  },
  {
    id: 'mahfuzhat-9',
    number: 9,
    arabic: 'جَرِّبْ وَلَاحِظْ تَكُنْ عَارِفًا',
    latin: "Jarrib wa laahidz takun 'aarifan",
    translation: "Cobalah bereksperimen dan amatilah dengan seksama, niscaya engkau menjadi orang yang ahli.",
    syarah: "Kaidah emas metode ilmiah dan inovasi modern: 'Trial, Observe, and Learn'. Jangan takut mencoba ide baru; yang terpenting adalah kemampuan menganalisis umpan balik dan merefleksikannya menjadi keahlian praktis yang matang.",
    category: 'knowledge',
    source: 'Kaidah Pembelajaran Empiris',
    quiz: {
      questionPart: 'جَرِّبْ وَلَاحِظْ تَكُنْ ...',
      options: ['عَالِمًا', 'عَارِفًا', 'حَكِيمًا', 'غَنِيًّا'],
      answerIndex: 1,
      explanation: "Lanjutan kalimat adalah 'تَكُنْ عَارِفًا' (niscaya engkau menjadi orang yang berilmu/ahli mendalam)."
    }
  },
  {
    id: 'mahfuzhat-10',
    number: 10,
    arabic: 'اطْلُبِ الْعِلْمَ مِنَ الْمَهْدِ إِلَى اللَّحْدِ',
    latin: "Uthlubil-'ilma minal-mahdi ilal-lahdi",
    translation: "Tuntutlah ilmu semenjak dari buaian ibu hingga masuk ke liang lahad.",
    syarah: "Konsep pembelajar sepanjang hayat (lifelong learning). Gelar akademik dan kelulusan pesantren bukanlah garis akhir menuntut ilmu, melainkan tiket pembuka untuk terus memperbaharui wawasan dan beradaptasi dengan kemajuan zaman.",
    category: 'knowledge',
    source: 'Atsar Hikmah Pendidikan',
    quiz: {
      questionPart: 'اطْلُبِ الْعِلْمَ مِنَ الْمَهْدِ إِلَى ...',
      options: ['الْمَسْجِدِ', 'الْبَيْتِ', 'اللَّحْدِ', 'الشَّيْخِ'],
      answerIndex: 2,
      explanation: "Pasangan dari 'الْمَهْد' (buaian) adalah 'اللَّحْد' (liang kubur/lahad)."
    }
  },
  {
    id: 'mahfuzhat-11',
    number: 11,
    arabic: 'بَيْضَةُ الْيَوْمِ خَيْرٌ مِنْ دَجَاجَةِ الْغَدِ',
    latin: "Baidhatul-yaumi khairun min dajaajatil-ghad",
    translation: "Sebuthir telur hari ini lebih baik daripada seekor ayam esok hari.",
    syarah: "Menghargai peluang nyata di tangan saat ini daripada terbuai angan-angan kosong masa depan yang belum pasti. Prinsip ini mengajarkan eksekusi konkret, apresiasi modal yang ada, dan kehati-hatian dalam manajemen risiko.",
    category: 'wisdom',
    source: 'Amsal Arab',
    quiz: {
      questionPart: 'بَيْضَةُ الْيَوْمِ خَيْرٌ مِنْ ...',
      options: ['دَجَاجَةِ الْغَدِ', 'سَمَكَةِ الْبَحْرِ', 'ذَهَبِ الْأَمْسِ', 'طَعَامِ الْغَدِ'],
      answerIndex: 0,
      explanation: "Lanjutan pepatah adalah 'دَجَاجَةِ الْغَدِ' (seekor ayam esok hari)."
    }
  },
  {
    id: 'mahfuzhat-12',
    number: 12,
    arabic: 'الْوَقْتُ أَثْمَنُ مِنَ الذَّهَبِ',
    latin: "Al-waqtu atsmanu minadz-dzahab",
    translation: "Waktu itu jauh lebih berharga daripada bongkahan emas.",
    syarah: "Emas yang hilang masih dapat dicari penggantinya dengan berdagang atau bekerja, namun satu detik waktu yang berlalu tidak akan pernah bisa ditebus kembali oleh seluruh kekayaan yang ada di muka bumi.",
    category: 'knowledge',
    source: 'Kalam Al-Hukama',
    quiz: {
      questionPart: 'الْوَقْتُ أَثْمَنُ مِنَ ...',
      options: ['الْمَالِ', 'الْفِضَّةِ', 'الذَّهَبِ', 'الْمُلْكِ'],
      answerIndex: 2,
      explanation: "Lanjutan kalimat adalah 'الذَّهَبِ' (emas)."
    }
  },
  {
    id: 'mahfuzhat-13',
    number: 13,
    arabic: 'الْعَقْلُ السَّلِيمُ فِي الْجِسْمِ السَّلِيمِ',
    latin: "Al-'aqlus-saliimu fil-jismis-saliim",
    translation: "Pikiran dan akal yang sehat bersemayam di dalam tubuh yang sehat.",
    syarah: "Keseimbangan antara spiritualitas, ketajaman intelektual, dan kebugaran fisik. Menjaga pola makan, istirahat, dan olahraga teratur adalah bagian mutlak dari adab seorang santri demi ketahanan berpikir kritis dan produktivitas tinggi.",
    category: 'wisdom',
    source: 'Hikmah Thibbiyyah & Falsafah',
    quiz: {
      questionPart: 'الْعَقْلُ السَّلِيمُ فِي ...',
      options: ['الْبَيْتِ السَّلِيمِ', 'الْجِسْمِ السَّلِيمِ', 'الْقَلْبِ السَّلِيمِ', 'الْعِلْمِ السَّلِيمِ'],
      answerIndex: 1,
      explanation: "Lanjutan kalimat adalah 'الْجِسْمِ السَّلِيمِ' (tubuh yang sehat)."
    }
  },
  {
    id: 'mahfuzhat-14',
    number: 14,
    arabic: 'خَيْرُ جَلِيسٍ فِي الزَّمَانِ كِتَابٌ',
    latin: "Khairu jaliisin fiz-zamaani kitaab",
    translation: "Sebaik-baik teman duduk sepanjang zaman adalah buku / bahan bacaan bermutu.",
    syarah: "Buku adalah sahabat yang tidak pernah berkhianat, tidak pernah bosan berbagi rahasia ilmu, dan membuka gerbang dialog dengan pemikir-pemikir terhebat peradaban lintas abad dan geografi.",
    category: 'knowledge',
    source: 'Diwan Al-Mutanabbi',
    quiz: {
      questionPart: 'خَيْرُ جَلِيسٍ فِي الزَّمَانِ ...',
      options: ['صَدِيقٌ', 'كِتَابٌ', 'عَالِمٌ', 'قَلَمٌ'],
      answerIndex: 1,
      explanation: "Lanjutan bait syair Al-Mutanabbi adalah 'كِتَابٌ' (sebuah buku)."
    }
  },
  {
    id: 'mahfuzhat-15',
    number: 15,
    arabic: 'مَنْ يَزْرَعْ يَحْصُدْ',
    latin: "Man yazra' yahshud",
    translation: "Barang siapa menanam benih, dialah yang akan menuai hasil panennya.",
    syarah: "Hukum sebab akibat yang mutlak (Law of Karma / Sunnatullah). Apa yang kita tuai hari ini—baik itu reputasi, relasi, rezeki, ataupun ilmu—adalah bibit kebiasaan yang kita semai beberapa tahun yang lalu. Tanamlah kebaikan tanpa pamrih.",
    category: 'success',
    source: 'Amsal Arab Klasik',
    quiz: {
      questionPart: 'مَنْ يَزْرَعْ ...',
      options: ['يَأْكُلْ', 'يَنْجَحْ', 'يَحْصُدْ', 'يَفْرَحْ'],
      answerIndex: 2,
      explanation: "Lanjutan kalimat adalah 'يَحْصُدْ' (ia akan memanen/menuai)."
    }
  },
  {
    id: 'mahfuzhat-16',
    number: 16,
    arabic: 'خَيْرُ الْأَصْحَابِ مَنْ يَدُلُّكَ عَلَى الْخَيْرِ',
    latin: "Khairul-ash-haabi man yadulluka 'alal-khair",
    translation: "Sebaik-baik sahabat adalah yang selalu membimbing dan menunjukkanmu pada kebaikan.",
    syarah: "Sahabat sejati bukan yang selalu membenarkan kesalahan kita demi kenyamanan semu, melainkan yang berani menegur dengan kasih sayang dan menjadi kompas pengingat saat kita mulai melenceng dari jalan keridhaan Allah.",
    category: 'brotherhood',
    source: 'Adab Ash-Shuhbah',
    quiz: {
      questionPart: 'خَيْرُ الْأَصْحَابِ مَنْ يَدُلُّكَ عَلَى ...',
      options: ['الْمَالِ', 'الْخَيْرِ', 'الشَّرَفِ', 'النَّجَاحِ'],
      answerIndex: 1,
      explanation: "Lanjutan kalimat adalah 'الْخَيْرِ' (pada kebajikan)."
    }
  },
  {
    id: 'mahfuzhat-17',
    number: 17,
    arabic: 'لَوْلَا الْعِلْمُ لَكَانَ النَّاسُ كَالْبَهَائِمِ',
    latin: "Lau lal-'ilmu lakaanat-naasu kal-bahaa'im",
    translation: "Seandainya bukan karena ilmu pengetahuan, niscaya manusia itu tak ubahnya bagaikan binatang ternak.",
    syarah: "Ilmu adalah cahaya yang membedakan manusia dari makhluk lainnya, memberikan akal budi, empati, moralitas, serta daya cipta untuk membangun keadaban dan tatanan masyarakat yang mulia.",
    category: 'knowledge',
    source: 'Ihya\' \'Ulumiddin - Imam Al-Ghazali',
    quiz: {
      questionPart: 'لَوْلَا الْعِلْمُ لَكَانَ النَّاسُ ...',
      options: ['كَالْحِجَارَةِ', 'كَالْبَهَائِمِ', 'كَالْأَشْجَارِ', 'كَالرِّيَاحِ'],
      answerIndex: 1,
      explanation: "Lanjutan kalimat adalah 'كَالْبَهَائِمِ' (laksana binatang ternak)."
    }
  },
  {
    id: 'mahfuzhat-18',
    number: 18,
    arabic: 'الْعِلْمُ فِي الصِّغَرِ كَالنَّقْشِ عَلَى الْحَجَرِ',
    latin: "Al-'ilmu fish-shighari kan-naqsyi 'alal-hajar",
    translation: "Belajar di masa muda laksana mengukir di atas batu karang.",
    syarah: "Fondasi adab, hafalan, dan kepribadian yang tertanam kuat sewaktu di pesantren akan terpatri abadi dalam jiwa dan alam bawah sadar, menjadi benteng kokoh di tengah hiruk-pikuk godaan dunia kedewasaan.",
    category: 'knowledge',
    source: 'Pepatah Tarbiyah Salaf',
    quiz: {
      questionPart: 'الْعِلْمُ فِي الصِّغَرِ كَالنَّقْشِ عَلَى ...',
      options: ['الْمَاءِ', 'الْحَجَرِ', 'الْوَرَقِ', 'الرَّمْلِ'],
      answerIndex: 1,
      explanation: "Lanjutan kalimat adalah 'الْحَجَرِ' (di atas batu)."
    }
  },
  {
    id: 'mahfuzhat-19',
    number: 19,
    arabic: 'لَنْ تَرْجِعَ الْأَيَّامُ الَّتِي مَضَتْ',
    latin: "Lan tarji'al-ayyaamullatii madhat",
    translation: "Tidak akan pernah kembali hari-hari dan waktu yang telah berlalu.",
    syarah: "Kesadaran akan kefanaan waktu. Masa muda, kesempatan berkumpul di asrama, dan momen-momen emas kebersamaan angkatan tidak akan terulang. Jadikan setiap detik saat ini bermakna dan penuh jejak amal shalih.",
    category: 'wisdom',
    source: 'Hikmah Az-Zaman',
    quiz: {
      questionPart: 'لَنْ تَرْجِعَ الْأَيَّامُ الَّتِي ...',
      options: ['أَقْبَلَتْ', 'مَضَتْ', 'جَاءَتْ', 'قَرُبَتْ'],
      answerIndex: 1,
      explanation: "Lanjutan kalimat adalah 'مَضَتْ' (yang telah berlalu)."
    }
  },
  {
    id: 'mahfuzhat-20',
    number: 20,
    arabic: 'تَعَلَّمَنْ صَغِيرًا وَاعْمَلْ بِهِ كَبِيرًا',
    latin: "Ta'allaman shaghiiran wa'mal bihi kabiiran",
    translation: "Belajarlah dengan sungguh-sungguh sewaktu kecil, dan amalkanlah ilmunya setelah engkau dewasa.",
    syarah: "Siklus pembinaan diri: menimbun bekal ilmu di masa muda dengan kerendahan hati, lalu mentransformasikannya menjadi karya nyata, kebermanfaatan umat, dan kontribusi sosial saat memegang amanah di masa dewasa.",
    category: 'knowledge',
    source: 'Nasihat Ulama Tarbiyah',
    quiz: {
      questionPart: 'تَعَلَّمَنْ صَغِيرًا وَاعْمَلْ بِهِ ...',
      options: ['سَرِيعًا', 'كَثِيرًا', 'كَبِيرًا', 'دَائِمًا'],
      answerIndex: 2,
      explanation: "Pasangan kata 'صَغِيرًا' dalam kaidah ini adalah 'كَبِيرًا' (di waktu dewasa)."
    }
  },
  {
    id: 'mahfuzhat-21',
    number: 21,
    arabic: 'الْعِلْمُ بِلَا عَمَلٍ كالشَّجَرِ بِلَا ثَمَرٍ',
    latin: "Al-'ilmu bilaa 'amalin kasy-syajari bilaa tsamar",
    translation: "Ilmu tanpa pengamalan nyata laksana pohon rimbun yang tak pernah berbuah.",
    syarah: "Teori yang muluk-muluk tidak ada artinya jika tidak diterjemahkan ke dalam aksi, integritas perbuatan, dan kemaslahatan nyata bagi keluarga, masyarakat, dan almamater tercinta.",
    category: 'knowledge',
    source: 'Kalam Al-Hasan Al-Bashri',
    quiz: {
      questionPart: 'الْعِلْمُ بِلَا عَمَلٍ كالشَّجَرِ بِلَا ...',
      options: ['مَاءٍ', 'ظِلِّ', 'ثَمَرٍ', 'وَرَقٍ'],
      answerIndex: 2,
      explanation: "Lanjutan kalimat adalah 'ثَمَرٍ' (buah)."
    }
  },
  {
    id: 'mahfuzhat-22',
    number: 22,
    arabic: 'الِاتِّحَادُ أَسَاسُ النَّجَاحِ',
    latin: "Al-ittihaadu asaasun-najaah",
    translation: "Persatuan dan soliditas adalah fondasi utama setiap kesuksesan.",
    syarah: "Kekuatan sinergi angkatan (Expedient 43). Kesuksesan kolektif tercipta ketika seluruh potensi alumni dipadukan, saling mengisi celah kekurangan, dan melangkah serentak bagaikan satu bangunan yang kokoh.",
    category: 'brotherhood',
    source: 'Mabadi\' Al-Ijtima\'',
    quiz: {
      questionPart: 'الِاتِّحَادُ أَسَاسُ ...',
      options: ['الْفَلَاحِ', 'النَّجَاحِ', 'الْقُوَّةِ', 'الْمَجْدِ'],
      answerIndex: 1,
      explanation: "Lanjutan kalimat adalah 'النَّجَاحِ' (kesuksesan / keberhasilan)."
    }
  },
  {
    id: 'mahfuzhat-23',
    number: 23,
    arabic: 'لَا تَحْتَقِرْ مِسْكِينًا وَكُنْ لَهُ مُعِينًا',
    latin: "Laa tahtaqir miskiinan wa kun lahu mu'iina",
    translation: "Jangan sekali-kali meremehkan orang yang serba kekurangan, dan jadilah penolong baginya.",
    syarah: "Karakter sejati santri adalah welas asih dan kepedulian sosial. Pangkat dan keberhasilan materi tidak boleh membuat dada membusung sombong; justru harus menjadikan tangan kita lebih ringan mengulur bantuan.",
    category: 'adab',
    source: 'Nasihat Akhlak Al-Islam',
    quiz: {
      questionPart: 'لَا تَحْتَقِرْ مِسْكِينًا وَكُنْ لَهُ ...',
      options: ['مُعِينًا', 'صَدِيقًا', 'شَفِيقًا', 'رَفِيقًا'],
      answerIndex: 0,
      explanation: "Rima dan lafazh yang tepat adalah 'مُعِينًا' (penolong baginya)."
    }
  },
  {
    id: 'mahfuzhat-24',
    number: 24,
    arabic: 'الشَّرَفُ بِالْأَدَبِ لَا بِالنَّسَبِ',
    latin: "Asy-syarafu bil-adabi laa bin-nasab",
    translation: "Kemuliaan sejati seseorang ditentukan oleh tingginya adab budi pekerti, bukan semata nasab keturunan.",
    syarah: "Bukan darah biru atau kebanggaan trah keluarga yang mengangkat martabat seseorang, melainkan keluhuran budi, kerendahan hati, kejujuran lisan, dan manfaat yang ia tebarkan kepada sesama manusia.",
    category: 'adab',
    source: 'Kalam Amirul Mukminin Ali bin Abi Thalib',
    quiz: {
      questionPart: 'الشَّرَفُ بِالْأَدَبِ لَا ...',
      options: ['بِالْمَالِ', 'بِالنَّسَبِ', 'بِالْجَاهِ', 'بِالذَّهَبِ'],
      answerIndex: 1,
      explanation: "Pasangan antitesis dalam kaidah ini adalah 'لَا بِالنَّسَبِ' (bukan karena faktor garis keturunan)."
    }
  },
  {
    id: 'mahfuzhat-25',
    number: 25,
    arabic: 'سَلَامَةُ الْإِنْسَانِ فِي حِفْظِ اللِّسَانِ',
    latin: "Salaamatul-insaani fii hifzhil-lisaan",
    translation: "Keselamatan seorang insan terletak pada kepiawaiannya menjaga lisan dan tutur katanya.",
    syarah: "Di era digital saat ini, lisan bermutasi menjadi jempol, postingan, dan komentar. Menjaga ucapan dari fitnah, ghibah, adu domba, dan sarkasme adalah benteng utama keselamatan hubungan sosial dan kedamaian batin.",
    category: 'adab',
    source: 'Atsar Nabawi & Hikmah Salaf',
    quiz: {
      questionPart: 'سَلَامَةُ الْإِنْسَانِ فِي حِفْظِ ...',
      options: ['الْقَلْبِ', 'الْيَدِ', 'اللِّسَانِ', 'الْعَيْنِ'],
      answerIndex: 2,
      explanation: "Lafazh yang masyhur adalah 'اللِّسَانِ' (lisan / perkataan)."
    }
  },
  {
    id: 'mahfuzhat-26',
    number: 26,
    arabic: 'آدَابُ الْمَرْءِ خَيْرٌ مِنْ ذَهَبِهِ',
    latin: "Aadaabul-mar'i khairun min dzahabihi",
    translation: "Ketinggian adab sopan santun seseorang jauh lebih berharga daripada simpanan emas kekayaannya.",
    syarah: "Kekayaan materi bisa habis terkikis inflasi atau musibah, namun akhlak mulia dan ketulusan adab akan senantiasa membuka pintu-pintu cinta, keberkahan, dan penghormatan tulus di manapun kita berada.",
    category: 'adab',
    source: 'Hikmah Ahlul Adab',
    quiz: {
      questionPart: 'آدَابُ الْمَرْءِ خَيْرٌ مِنْ ...',
      options: ['عِلْمِهِ', 'ذَهَبِهِ', 'قُوَّتِهِ', 'مَالِهِ'],
      answerIndex: 1,
      explanation: "Lafazh yang selaras adalah 'ذَهَبِهِ' (emas dan harta bendanya)."
    }
  },
  {
    id: 'mahfuzhat-27',
    number: 27,
    arabic: 'سُوءُ الْخُلُقِ يُعْدِي',
    latin: "Suu'ul-khuluqi yu'dii",
    translation: "Perangai dan budi pekerti yang buruk itu bersifat menular.",
    syarah: "Peringatan psikologis yang sangat mendalam. Sikap sinis, pesimisme, iri dengki, dan toksisitas lingkungan kerja atau pergaulan dapat meracuni jiwa kita tanpa disadari. Lindungi diri dengan selalu mendekat pada energi positif.",
    category: 'adab',
    source: 'Kaidah Nafsiyyah',
    quiz: {
      questionPart: 'سُوءُ الْخُلُقِ ...',
      options: ['يَهْلِكُ', 'يُفْسِدُ', 'يُعْدِي', 'يَزُولُ'],
      answerIndex: 2,
      explanation: "Lafazh yang tepat adalah 'يُعْدِي' (menular / mengontaminasi)."
    }
  },
  {
    id: 'mahfuzhat-28',
    number: 28,
    arabic: 'آفَةُ الْعِلْمِ النِّسْيَانُ',
    latin: "Aafatul-'ilmi an-nisyaan",
    translation: "Bencana dan perusak ilmu pengetahuan adalah penyakit lupa.",
    syarah: "Kiat menjaga hafalan dan pemahaman adalah dengan terus mengulang (muraja'ah), mengajarkannya kepada orang lain, dan mendokumentasikannya. Pengabaian muraja'ah akan membuat mutiara ilmu perlahan memudar.",
    category: 'knowledge',
    source: 'Kalam Ad-Dhahhak & Az-Zuhri',
    quiz: {
      questionPart: 'آفَةُ الْعِلْمِ ...',
      options: ['الْجَهْلُ', 'الْكِبْرُ', 'النِّسْيَانُ', 'الْفَقْرُ'],
      answerIndex: 2,
      explanation: "Lafazh yang masyhur adalah 'النِّسْيَانُ' (kelupaan / alpa)."
    }
  },
  {
    id: 'mahfuzhat-29',
    number: 29,
    arabic: 'إِذَا صَدَقَ الْعَزْمُ وَضَحَ السَّبِيلُ',
    latin: "Idzaa shadaqal-'azmu wadlahas-sabiil",
    translation: "Apabila niat dan tekad telah bulat serta tulus, maka jalan keluar akan menjadi terang benderang.",
    syarah: "Seringkali yang menghalangi kita bukan tidak adanya jalan, melainkan keraguan hati dan ketiadaan tekad baja. Saat tekad membaja diiringi tawakal kepada Allah, semesta akan membukakan pintu-pintu kemudahan yang tak terduga.",
    category: 'wisdom',
    source: 'Hikmah Iradah wal Himmah',
    quiz: {
      questionPart: 'إِذَا صَدَقَ الْعَزْمُ وَضَحَ ...',
      options: ['الْحَقُّ', 'السَّبِيلُ', 'الْأَمْرُ', 'الْفَرَجُ'],
      answerIndex: 1,
      explanation: "Lanjutan kalimat adalah 'السَّبِيلُ' (jalan / cara penyelesaian)."
    }
  },
  {
    id: 'mahfuzhat-30',
    number: 30,
    arabic: 'لَا تَحْتَقِرْ مَنْ دُونَكَ فَلِكُلِّ شَيْءٍ مَزِيَّةٌ',
    latin: "Laa tahtaqir man duunaka fa likulli syai'in maziyyah",
    translation: "Jangan meremehkan siapa pun di bawahmu, karena setiap makhluk memiliki keistimewaan tersendiri.",
    syarah: "Setiap alumni memiliki takdir, kecerdasan, dan medan juang masing-masing. Jangan pernah menilai rendah profesi atau jalan hidup saudara kita; boleh jadi di balik kesahajaannya tersimpan keistimewaan dan kemuliaan agung yang tak kita ketahui.",
    category: 'wisdom',
    source: 'Adab Al-Mu\'asyarah',
    quiz: {
      questionPart: 'لَا تَحْتَقِرْ مَنْ دُونَكَ فَلِكُلِّ شَيْءٍ ...',
      options: ['قَدْرٌ', 'مَزِيَّةٌ', 'نِهَايَةٌ', 'فَائِدَةٌ'],
      answerIndex: 1,
      explanation: "Lafazh penutup bait ini adalah 'مَزِيَّةٌ' (keistimewaan / kelebihan tersendiri)."
    }
  }
];

export const PESANTREN_RANKS = [
  { minScore: 100, title: 'Mustahiq Mumtaz (Syahadah Emas)', desc: 'Sempurna! Daya ingat dan ketajaman Mahfuzhat Anda setingkat mutafawwiq pesantren.', badge: '👑' },
  { minScore: 80, title: 'Hafizh Mahfuzhat (Jayyid Jiddan)', desc: 'Luar biasa! Refleks dan pemahaman hikmah Anda sangat mendalam.', badge: '⭐' },
  { minScore: 60, title: 'Thalib Mujtahid (Jayyid)', desc: 'Bagus! Fondasi kuat, tinggal sedikit lagi muraja\'ah untuk meraih kesempurnaan.', badge: '📚' },
  { minScore: 40, title: 'Mubtadi\' Shalih (Maqbul)', desc: 'Cukup baik, mari tingkatkan muraja\'ah dan hayati kembali untaian mutiara kata.', badge: '🌱' },
  { minScore: 0, title: 'Musytaq Ilal-Ma\'had (Rindu Pesantren)', desc: 'Yuk buka kembali catatan kenangan asrama dan muraja\'ah santai bersama kawan!', badge: '🕌' },
];
