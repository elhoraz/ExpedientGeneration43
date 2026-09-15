/**
 * matsuratData.ts - Kumpulan Otentik Al-Ma'tsurat Dzikir Pagi & Petang
 * Expedient Generation 43 - Luxury Islamic Obsidian Gold & Royal Ivory
 */

export type MatsuratTime = "pagi" | "petang";
export type MatsuratType = "sughro" | "kubro";

export interface MatsuratItem {
  id: string;
  title: string;
  category: "ayat" | "doa" | "tasbih" | "rabithah";
  type: MatsuratType; // "sughro" (inti) atau "kubro" (lengkap)
  applicableTime: "both" | "pagi" | "petang";
  arabicPagi: string;
  arabicPetang?: string; // Jika ada lafadz khusus petang (asbahna vs amsayna)
  latinPagi: string;
  latinPetang?: string;
  meaningPagi: string;
  meaningPetang?: string;
  targetCount: number;
  fadhilah: string;
  source: string;
  audioUrl?: string;
}

export const MATSURAT_ITEMS: MatsuratItem[] = [
  // 1. Ta'awwudz
  {
    id: "taawwudz",
    title: "Ta'awwudz",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "أَعُوذُ بِاللَّهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
    latinPagi: "A'ūdzu billāhis-samī'il-'alīmi minasy-syaithānir-rajīm",
    meaningPagi: "Aku berlindung kepada Allah Yang Maha Mendengar lagi Maha Mengetahui dari godaan setan yang terkutuk.",
    targetCount: 1,
    fadhilah: "Membentengi diri dari bisikan dan tipu daya setan sebelum memulai rangkaian dzikir.",
    source: "QS. Al-A'raf: 200",
    audioUrl: "https://everyayah.com/data/Alafasy_128kbps/001001.mp3",
  },

  // 2. Surah Al-Fatihah
  {
    id: "fatihah",
    title: "Surah Al-Fatihah",
    category: "ayat",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    latinPagi: "Bismillāhir-raḥmānir-raḥīm. Al-ḥamdu lillāhi rabbil-'ālamīn. Ar-raḥmānir-raḥīm. Māliki yaumid-dīn. Iyyāka na'budu wa iyyāka nasta'īn. Ihdinaṣ-ṣirāṭal-mustaqīm. Ṣirāṭallażīna an'amta 'alaihim gairil-magḍūbi 'alaihim wa laḍ-ḍāllīn.",
    meaningPagi: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang. Segala puji bagi Allah, Tuhan semesta alam. Maha Pengasih lagi Maha Penyayang. Pemilik hari pembalasan. Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami memohon pertolongan. Tunjukilah kami jalan yang lurus, (yaitu) jalan orang-orang yang telah Engkau anugerahi nikmat, bukan jalan mereka yang dimurkai dan bukan pula jalan mereka yang sesat.",
    targetCount: 1,
    fadhilah: "Ummul Qur'an, pembuka segala kebaikan, dan penawar segala penyakit hati dan raga.",
    source: "QS. Al-Fatihah: 1-7",
  },

  // 3. Awal Surah Al-Baqarah
  {
    id: "baqarah_awal",
    title: "Surah Al-Baqarah (1-5)",
    category: "ayat",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "الم ۝ ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ ۝ الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ ۝ وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ ۝ أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ",
    latinPagi: "Alif-lām-mīm. Żālikal-kitābu lā raiba fīh, hudal lil-muttaqīn. Allażīna yu'minūna bil-gaibi wa yuqīmūnaṣ-ṣalāta wa mimmā razaqnāhum yunfiqūn. Wallażīna yu'minūna bimā unzila ilaika wa mā unzila min qablika wa bil-ākhirati hum yūqinūn. Ulā'ika 'alā hudam mir rabbihim wa ulā'ika humul-mufliḥūn.",
    meaningPagi: "Alif Lam Mim. Kitab (Al-Qur'an) ini tidak ada keraguan padanya; petunjuk bagi mereka yang bertakwa. (Yaitu) mereka yang beriman kepada yang gaib, mendirikan shalat, dan menafkahkan sebagian rezeki yang Kami anugerahkan kepada mereka. Dan mereka yang beriman kepada Kitab yang telah diturunkan kepadamu dan kitab-kitab yang telah diturunkan sebelummu, serta mereka yakin akan adanya (kehidupan) akhirat. Merekalah yang tetap mendapat petunjuk dari Tuhan mereka, dan merekalah orang-orang yang beruntung.",
    targetCount: 1,
    fadhilah: "Menjaga rumah dan hati dari gangguan setan serta meneguhkan aqidah orang beriman.",
    source: "QS. Al-Baqarah: 1-5 (HR. Ad-Darimi)",
  },

  // 4. Ayat Kursi
  {
    id: "ayat_kursi",
    title: "Ayat Kursi",
    category: "ayat",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    latinPagi: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā ta'khużuhū sinatuw wa lā na'ūm, lahū mā fis-samāwāti wa mā fil-arḍ, man żallażī yasyfa'u 'indahū illā bi'iżnih, ya'lamu mā baina aidīhim wa mā khalfahum, wa lā yuḥīṭūna bisyai'im min 'ilmihī illā bimā syā', wasi'a kursiyyuhus-samāwāti wal-arḍ, wa lā ya'ūduhū ḥifẓuhumā, wa huwal-'aliyyul-'aẓīm.",
    meaningPagi: "Allah, tidak ada Tuhan (yang berhak disembah) melainkan Dia Yang Hidup kekal lagi terus-menerus mengurus (makhluk-Nya); tidak mengantuk dan tidak tidur. Kepunyaan-Nya apa yang di langit dan di bumi. Tiada yang dapat memberi syafa'at di sisi Allah tanpa izin-Nya? Allah mengetahui apa-apa yang di hadapan mereka dan di belakang mereka, dan mereka tidak mengetahui apa-apa dari ilmu Allah melainkan apa yang dikehendaki-Nya. Kursi Allah meliputi langit dan bumi. Dan Allah tidak merasa berat memelihara keduanya, dan Allah Maha Tinggi lagi Maha Besar.",
    targetCount: 1,
    fadhilah: "Barangsiapa membacanya di pagi hari akan dilindungi dari setan hingga petang, dan jika dibaca petang akan dilindungi hingga pagi.",
    source: "QS. Al-Baqarah: 255 (HR. Al-Hakim & Thabrani)",
  },

  // 5. Akhir Surah Al-Baqarah
  {
    id: "baqarah_akhir",
    title: "Surah Al-Baqarah (284-286)",
    category: "ayat",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ ۝ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
    latinPagi: "Āmanar-rasūlu bimā unzila ilaihi mir rabbihī wal-mu'minūn, kullun āmana billāhi wa malā'ikatihī wa kutubihī wa rusulih, lā nufarriqu baina aḥadim mir rusulih, wa qālū sami'nā wa aṭa'nā gufrānaka rabbanā wa ilaikal-maṣīr. Lā yukallifullāhu nafsan illā wus'ahā, lahā mā kasabat wa 'alaihā maktasabat, rabbanā lā tu'ākhiżnā in nasīnā au akhṭa'nā, rabbanā wa lā taḥmil 'alainā iṣran kamā ḥamaltahū 'alallażīna min qablinā, rabbanā wa lā tuḥammilnā mā lā ṭāqata lanā bih, wa'fu 'annā wagfir lanā warḥamnā, anta maulānā fanṣurnā 'alal-qaumil-kāfirīn.",
    meaningPagi: "Rasul telah beriman kepada Al-Qur'an yang diturunkan kepadanya dari Tuhannya, demikian pula orang-orang yang beriman. Semuanya beriman kepada Allah, malaikat-malaikat-Nya, kitab-kitab-Nya dan rasul-rasul-Nya. (Mereka mengatakan): 'Kami tidak membeda-bedakan antara seseorang pun dari rasul-rasul-Nya', dan mereka mengatakan: 'Kami dengar dan kami taat'. (Mereka berdoa): 'Ampunilah kami ya Tuhan kami dan kepada Engkaulah tempat kembali'. Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya... Ya Tuhan kami, ampunilah kami dan rahmatilah kami; Engkaulah Penolong kami, maka tolonglah kami terhadap kaum yang kafir.",
    targetCount: 1,
    fadhilah: "Barangsiapa membaca dua ayat terakhir surat Al-Baqarah pada malam hari, maka cukuplah keduanya baginya (dari segala keburukan).",
    source: "QS. Al-Baqarah: 285-286 (HR. Bukhari & Muslim)",
  },

  // 6. Surah Al-Ikhlas (3x)
  {
    id: "ikhlas",
    title: "Surah Al-Ikhlas (3x)",
    category: "ayat",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
    latinPagi: "Bismillāhir-raḥmānir-raḥīm. Qul huwallāhu aḥad. Allāhuṣ-ṣamad. Lam yalid wa lam yūlad. Wa lam yakul lahū kufuwan aḥad.",
    meaningPagi: "Katakanlah: 'Dialah Allah, Yang Maha Esa. Allah adalah Tuhan yang bergantung kepada-Nya segala sesuatu. Dia tiada beranak dan tidak pula diperanakkan, dan tidak ada seorang pun yang setara dengan Dia.'",
    targetCount: 3,
    fadhilah: "Membacanya 3x setara dengan mengkhatamkan seluruh isi Al-Qur'an.",
    source: "QS. Al-Ikhlas: 1-4 (HR. Abu Dawud, Tirmidzi)",
  },

  // 7. Surah Al-Falaq (3x)
  {
    id: "falaq",
    title: "Surah Al-Falaq (3x)",
    category: "ayat",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    latinPagi: "Bismillāhir-raḥmānir-raḥīm. Qul a'ūżu birabbil-falaq. Min syarri mā khalaq. Wa min syarri gāsiqin iżā waqab. Wa min syarrin-naffāṡāti fil-'uqad. Wa min syarri ḥāsidin iżā ḥasad.",
    meaningPagi: "Katakanlah: 'Aku berlindung kepada Tuhan Yang Menguasai subuh, dari kejahatan makhluk-Nya, dan dari kejahatan malam apabila telah gelap gulita, dan dari kejahatan wanita-wanita tukang sihir yang menghembus pada buhul-buhul, dan dari kejahatan pendengki bila ia dengki.'",
    targetCount: 3,
    fadhilah: "Perlindungan mutlak dari sihir, kejahatan malam, dan bahaya mata dengki (hasad).",
    source: "QS. Al-Falaq: 1-5 (HR. Abu Dawud, Tirmidzi)",
  },

  // 8. Surah An-Nas (3x)
  {
    id: "nas",
    title: "Surah An-Nas (3x)",
    category: "ayat",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
    latinPagi: "Bismillāhir-raḥmānir-raḥīm. Qul a'ūżu birabbin-nās. Malikin-nās. Ilāhin-nās. Min syarril-waswāsil-khannās. Allażī yuwaswisu fī ṣudūrin-nās. Minal-jinnati wan-nās.",
    meaningPagi: "Katakanlah: 'Aku berlindung kepada Tuhan (yang memelihara dan menguasai) manusia. Raja manusia. Sembahan manusia. Dari kejahatan (bisikan) setan yang biasa bersembunyi, yang membisikkan (kejahatan) ke dalam dada manusia, dari (golongan) jin dan manusia.'",
    targetCount: 3,
    fadhilah: "Rasulullah SAW bersabda: 'Membaca Al-Ikhlas dan Al-Mu'awwidzatain (Al-Falaq & An-Nas) 3x pada pagi dan petang hari akan mencukupkanmu dari segala sesuatu.'",
    source: "QS. An-Nas: 1-6 (HR. Tirmidzi & Abu Dawud)",
  },

  // 9. Doa Pagi / Petang Utama
  {
    id: "doa_asbahna_amsayna",
    title: "Doa Kerajaan Milik Allah",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    arabicPetang: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    latinPagi: "Aṣbaḥnā wa aṣbaḥal-mulku lillāh, wal-ḥamdu lillāh, lā ilāha illallāhu waḥdahū lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli syai'in qadīr. Rabbi as'aluka khaira mā fī hāżal-yaumi wa khaira mā ba'dah, wa a'ūżu bika min syarri mā fī hāżal-yaumi wa syarri mā ba'dah. Rabbi a'ūżu bika minal-kasali wa sū'il-kibar, rabbi a'ūżu bika min 'ażābin fin-nāri wa 'ażābin fil-qabr.",
    latinPetang: "Amsaynā wa amsal-mulku lillāh, wal-ḥamdu lillāh, lā ilāha illallāhu waḥdahū lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli syai'in qadīr. Rabbi as'aluka khaira mā fī hāżihil-lailati wa khaira mā ba'dahā, wa a'ūżu bika min syarri mā fī hāżihil-lailati wa syarri mā ba'dahā. Rabbi a'ūżu bika minal-kasali wa sū'il-kibar, rabbi a'ūżu bika min 'ażābin fin-nāri wa 'ażābin fil-qabr.",
    meaningPagi: "Kami berpagi hari dan berpagi hari pula kerajaan milik Allah. Segala puji bagi Allah, tiada Tuhan selain Allah Yang Maha Esa tiada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya pujian, dan Dia Maha Kuasa atas segala sesuatu. Wahai Tuhanku, aku memohon kepada-Mu kebaikan yang ada pada hari ini dan kebaikan sesudahnya, dan aku berlindung kepada-Mu dari keburukan yang ada pada hari ini dan keburukan sesudahnya. Wahai Tuhanku, aku berlindung kepada-Mu dari kemalasan dan keburukan di hari tua. Wahai Tuhanku, aku berlindung kepada-Mu dari azab di neraka dan azab di kubur.",
    meaningPetang: "Kami berpetang hari dan berpetang hari pula kerajaan milik Allah. Segala puji bagi Allah, tiada Tuhan selain Allah Yang Maha Esa tiada sekutu bagi-Nya... Wahai Tuhanku, aku memohon kepada-Mu kebaikan malam ini dan kebaikan sesudahnya...",
    targetCount: 1,
    fadhilah: "Doa perlindungan menyeluruh dari kemalasan, usia tua yang rapuh, dan siksa kubur.",
    source: "HR. Muslim no. 2723",
  },

  // 10. Doa Fithrah Islam
  {
    id: "doa_fithrah",
    title: "Doa Fithrah & Ketulusan Iman",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
    arabicPetang: "أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
    latinPagi: "Aṣbaḥnā 'alā fiṭratil-islām, wa 'alā kalimatil-ikhlāṣ, wa 'alā dīni nabiyyinā Muḥammadin ṣallallāhu 'alaihi wa sallam, wa 'alā millati abīnā Ibrāhīma ḥanīfam muslimaw wa mā kāna minal-musyrikīn.",
    latinPetang: "Amsaynā 'alā fiṭratil-islām, wa 'alā kalimatil-ikhlāṣ, wa 'alā dīni nabiyyinā Muḥammadin ṣallallāhu 'alaihi wa sallam, wa 'alā millati abīnā Ibrāhīma ḥanīfam muslimaw wa mā kāna minal-musyrikīn.",
    meaningPagi: "Kami berpagi hari di atas fitrah Islam, di atas kalimat ikhlas (tauhid), di atas agama Nabi kami Muhammad SAW, dan di atas millah (ajaran) ayah kami Ibrahim yang lurus lagi berserah diri, dan dia bukanlah termasuk golongan orang-orang musyrik.",
    meaningPetang: "Kami berpetang hari di atas fitrah Islam, di atas kalimat ikhlas...",
    targetCount: 1,
    fadhilah: "Memperbaharui sumpah setia tauhid di pagi dan petang hari.",
    source: "HR. Ahmad no. 15367 & Ad-Darimi",
  },

  // 11. Doa Kenikmatan dan Penjagaan (3x)
  {
    id: "doa_nikmat",
    title: "Doa Penyempurnaan Nikmat & Penjagaan Aib",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "اللَّهُمَّ إِنِّي أَصْبَحْتُ مِنْكَ فِي نِعْمَةٍ وَعَافِيَةٍ وَسِتْرٍ، فَأَتِمَّ عَلَيَّ نِعْمَتَكَ وَعَافِيَتَكَ وَسِتْرَكَ فِي الدُّنْيَا وَالْآخِرَةِ",
    arabicPetang: "اللَّهُمَّ إِنِّي أَمْسَيْتُ مِنْكَ فِي نِعْمَةٍ وَعَافِيَةٍ وَسِتْرٍ، فَأَتِمَّ عَلَيَّ نِعْمَتَكَ وَعَافِيَتَكَ وَسِتْرَكَ فِي الدُّنْيَا وَالْآخِرَةِ",
    latinPagi: "Allāhumma innī aṣbaḥtu minka fī ni'matiw wa 'āfiyatiw wa sitr, fa'atimma 'alayya ni'mataka wa 'āfiyataka wa sitraka fid-dunyā wal-ākhirah.",
    latinPetang: "Allāhumma innī amsaytu minka fī ni'matiw wa 'āfiyatiw wa sitr, fa'atimma 'alayya ni'mataka wa 'āfiyataka wa sitraka fid-dunyā wal-ākhirah.",
    meaningPagi: "Ya Allah, sesungguhnya aku berpagi hari dari-Mu dalam kenikmatan, kesehatan, dan perlindungan aib. Maka sempurnakanlah atasku kenikmatan-Mu, kesehatan-Mu, dan perlindungan-Mu di dunia dan akhirat.",
    meaningPetang: "Ya Allah, sesungguhnya aku berpetang hari dari-Mu dalam kenikmatan, kesehatan, dan perlindungan aib...",
    targetCount: 3,
    fadhilah: "Barangsiapa membacanya 3x, maka hak bagi Allah untuk menyempurnakan nikmat, kesehatan, dan penjagaan aibnya.",
    source: "HR. Ibnu As-Sunni no. 55",
  },

  // 12. Doa Syukur Nikmat
  {
    id: "doa_syukur",
    title: "Doa Mensyukuri Seluruh Nikmat Hari Ini",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
    arabicPetang: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
    latinPagi: "Allāhumma mā aṣbaḥa bī min ni'matin au bi'aḥadim min khalqika faminka waḥdaka lā syarīka lak, falakal-ḥamdu wa lakasy-syukr.",
    latinPetang: "Allāhumma mā amsā bī min ni'matin au bi'aḥadim min khalqika faminka waḥdaka lā syarīka lak, falakal-ḥamdu wa lakasy-syukr.",
    meaningPagi: "Ya Allah, nikmat apa pun yang menyertaiku di pagi ini atau yang menyertai salah seorang dari makhluk-Mu, maka semata-mata berasal dari-Mu Yang Maha Esa, tiada sekutu bagi-Mu. Bagi-Mu segala puji dan bagi-Mu segala rasa syukur.",
    meaningPetang: "Ya Allah, nikmat apa pun yang menyertaiku di petang ini...",
    targetCount: 1,
    fadhilah: "Barangsiapa membacanya di pagi hari maka ia telah menunaikan kewajiban syukur harinya, dan jika dibaca petang hari ia telah menunaikan syukur malamnya.",
    source: "HR. Abu Dawud no. 5073 & An-Nasa'i",
  },

  // 13. Kepujian Bagi Allah (3x)
  {
    id: "pujian_agung",
    title: "Doa Kepujian Agung Bagi Keagungan Allah",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "يَا رَبِّ لَكَ الْحَمْدُ كَمَا يَنْبَغِي لِجَلَالِ وَجْهِكَ وَلِعَظِيمِ سُلْطَانِكَ",
    latinPagi: "Yā rabbi lakal-ḥamdu kamā yambagī lijalāli wajhika wa li'aẓīmi sulṭānik.",
    meaningPagi: "Wahai Tuhanku, bagi-Mu segala puji sebagaimana yang layak bagi keagungan wajah-Mu dan kebesaran kekuasaan-Mu.",
    targetCount: 3,
    fadhilah: "Pujian yang pahalanya begitu agung sehingga para malaikat pencatat bingung bagaimana menimbang kemuliaan pahalanya, lalu Allah sendiri yang menyempurnakannya.",
    source: "HR. Ibnu Majah no. 3801 & Ahmad",
  },

  // 14. Keridhaan Iman (3x)
  {
    id: "ridha_iman",
    title: "Ikrar Keridhaan Iman & Islam (3x)",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ نَبِيًّا وَرَسُولًا",
    latinPagi: "Raḍītu billāhi rabbā, wa bil-islāmi dīnā, wa bi-Muḥammadin nabiyyaw wa rasūlā.",
    meaningPagi: "Aku rela Allah sebagai Tuhanku, Islam sebagai agamaku, dan Muhammad sebagai nabi dan rasulku.",
    targetCount: 3,
    fadhilah: "Barangsiapa mengucapkannya 3x setiap pagi dan petang, maka adalah hak bagi Allah untuk meridhainya pada hari kiamat dan menuntunnya masuk surga.",
    source: "HR. Abu Dawud no. 5072 & Tirmidzi",
  },

  // 15. Tasbih Bilangan Makhluk (3x)
  {
    id: "tasbih_makhluk",
    title: "Tasbih Bilangan Seluruh Ciptaan (3x)",
    category: "tasbih",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ",
    latinPagi: "Subḥānallāhi wa biḥamdih, 'adada khalqih, wa riḍā nafsih, wa zinata 'arsyih, wa midāda kalimātih.",
    meaningPagi: "Maha Suci Allah dan segala puji bagi-Nya, sebanyak bilangan makhluk-Nya, menurut keridhaan diri-Nya, seberat timbangan 'Arsy-Nya, dan sebanyak tinta kalimat-kalimat-Nya.",
    targetCount: 3,
    fadhilah: "Pahalanya melampaui zikir berjam-jam dari subuh hingga terbit matahari.",
    source: "HR. Muslim no. 2726",
  },

  // 16. Perlindungan dari Bahaya (3x)
  {
    id: "bismillahilladzi",
    title: "Bismillahilladzi La Yadhurru (3x)",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    latinPagi: "Bismillāhillażī lā yaḍurru ma'asmihī syai'un fil-arḍi wa lā fis-samā'i wa huwas-samī'ul-'alīm.",
    meaningPagi: "Dengan nama Allah yang bersama nama-Nya tidak ada sesuatu pun di bumi maupun di langit yang dapat membahayakan, dan Dia Maha Mendengar lagi Maha Mengetahui.",
    targetCount: 3,
    fadhilah: "Barangsiapa membacanya 3x setiap pagi dan petang, niscaya tidak ada malapetaka, racun, atau mara bahaya apa pun yang dapat mencelakainya.",
    source: "HR. Abu Dawud no. 5088 & Tirmidzi",
  },

  // 17. Perlindungan dari Syirik (3x)
  {
    id: "doa_syirik",
    title: "Doa Perlindungan dari Kesyirikan (3x)",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "اللَّهُمَّ إِنَّا نَعُوذُ بِكَ مِنْ أَنْ نُشْرِكَ بِكَ شَيْئًا نَعْلَمُهُ، وَنَسْتَغْفِرُكَ لِمَا لَا نَعْلَمُهُ",
    latinPagi: "Allāhumma innā na'ūżu bika min an nusyrika bika syai'an na'lamuh, wa nastagfiruka limā lā na'lamuh.",
    meaningPagi: "Ya Allah, sesungguhnya kami berlindung kepada-Mu dari menyekutukan-Mu dengan sesuatu yang kami ketahui, dan kami memohon ampunan-Mu atas apa yang tidak kami ketahui.",
    targetCount: 3,
    fadhilah: "Menghapus kesyirikan yang samar, riya', dan sum'ah yang lebih tersembunyi daripada langkah semut hitam.",
    source: "HR. Ahmad no. 19606 & Thabrani",
  },

  // 18. Perlindungan dari Kejahatan Makhluk (3x)
  {
    id: "a_udzu_bikalimatillah",
    title: "Perlindungan Kalimat Allah yang Sempurna (3x)",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    latinPagi: "A'ūżu bikalimātillāhit-tāmmāti min syarri mā khalaq.",
    meaningPagi: "Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan apa-apa yang telah Dia ciptakan.",
    targetCount: 3,
    fadhilah: "Tidak akan disengat binatang berbisa atau diganggu makhluk jahat hingga waktu pagi/petang berlalu.",
    source: "HR. Muslim no. 2709 & Tirmidzi",
  },

  // 19. Doa Terbebas dari Hutang & Gelisah (3x)
  {
    id: "doa_bebas_hutang",
    title: "Doa Menghilangkan Gundah & Lilitan Hutang (3x)",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
    latinPagi: "Allāhumma innī a'ūżu bika minal-hammi wal-ḥazan, wa a'ūżu bika minal-'ajzi wal-kasal, wa a'ūżu bika minal-jubni wal-bukhl, wa a'ūżu bika min galabatid-daini wa qahrir-rijāl.",
    meaningPagi: "Ya Allah, sesungguhnya aku berlindung kepada-Mu dari rasa gundah dan duka cita, aku berlindung kepada-Mu dari kelemahan dan kemalasan, aku berlindung kepada-Mu dari sifat pengecut dan kikir, serta aku berlindung kepada-Mu dari lilitan hutang dan penindasan orang lain.",
    targetCount: 3,
    fadhilah: "Doa yang diajarkan Rasulullah kepada sahabat Abu Umamah saat dirundung kesedihan dan hutang, hingga Allah melunaskan hutangnya dan membukakan jalan rezeki.",
    source: "HR. Abu Dawud no. 1555",
  },

  // 20. Doa Kesehatan Raga & Pendengaran (3x)
  {
    id: "doa_afiyah",
    title: "Doa Kesehatan & Afiyah Badan (3x)",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ",
    latinPagi: "Allāhumma 'āfinī fī badanī, Allāhumma 'āfinī fī sam'ī, Allāhumma 'āfinī fī baṣarī. Allāhumma innī a'ūżu bika minal-kufri wal-faqr, Allāhumma innī a'ūżu bika min 'ażābil-qabr, lā ilāha illā anta.",
    meaningPagi: "Ya Allah, berikanlah kesehatan pada badanku. Ya Allah, berikanlah kesehatan pada pendengaranku. Ya Allah, berikanlah kesehatan pada penglihatanku. Ya Allah, aku berlindung kepada-Mu dari kekafiran dan kemiskinan. Ya Allah, aku berlindung kepada-Mu dari siksa kubur, tiada Tuhan selain Engkau.",
    targetCount: 3,
    fadhilah: "Memelihara kebugaran fisik, ketajaman panca indra, dan menjauhkan kefakiran dunia dan akhirat.",
    source: "HR. Abu Dawud no. 5090 & Ahmad",
  },

  // 21. Sayyidul Istighfar
  {
    id: "sayyidul_istighfar",
    title: "Sayyidul Istighfar (Penghulu Ampunan)",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    latinPagi: "Allāhumma anta rabbī lā ilāha illā anta, khalaqtanī wa anā 'abduk, wa anā 'alā 'ahdika wa wa'dika mastaṭa'tu, a'ūżu bika min syarri mā ṣana'tu, abū'u laka bini'matika 'alayya, wa abū'u biżambī fagfir lī fa'innahū lā yagfiruz-żunūba illā anta.",
    meaningPagi: "Ya Allah, Engkaulah Tuhanku, tiada Tuhan selain Engkau. Engkau yang menciptakan aku dan aku adalah hamba-Mu. Aku senantiasa dalam ikatan janji-Mu semampuku. Aku berlindung kepada-Mu dari keburukan yang telah kuperbuat. Aku mengakui nikmat-Mu atasku dan aku mengakui dosaku kepada-Mu, maka ampunilah aku, sesungguhnya tiada yang dapat mengampuni dosa selain Engkau.",
    targetCount: 1,
    fadhilah: "Rasulullah SAW bersabda: 'Barangsiapa membacanya di petang hari lalu meninggal di malamnya, ia masuk surga. Dan barangsiapa membacanya di pagi hari lalu meninggal di siangnya, ia termasuk penghuni surga.'",
    source: "HR. Bukhari no. 6306",
  },

  // 22. Istighfar & Taubat (3x / 100x)
  {
    id: "istighfar_100",
    title: "Istighfar dan Taubat",
    category: "tasbih",
    type: "kubro",
    applicableTime: "both",
    arabicPagi: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ",
    latinPagi: "Astaghfirullāhal-'aẓīm allażī lā ilāha illā huwal-ḥayyul-qayyūma wa atūbu ilaih.",
    meaningPagi: "Aku memohon ampun kepada Allah Yang Maha Agung, tiada Tuhan selain Dia Yang Hidup Kekal lagi terus-menerus mengurus makhluk-Nya, dan aku bertaubat kepada-Nya.",
    targetCount: 3,
    fadhilah: "Diampuni dosa-dosanya meskipun sebanyak buih di lautan atau sebanyak butiran pasir.",
    source: "HR. Abu Dawud & Tirmidzi",
  },

  // 23. Doa Hasbiyallah (7x)
  {
    id: "hasbiyallah",
    title: "Hasbiyallahu La Ilaha Illa Huwa (7x)",
    category: "doa",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    latinPagi: "Ḥasbiyallāhu lā ilāha illā huwa 'alaihi tawakkaltu wa huwa rabbul-'arsyil-'aẓīm.",
    meaningPagi: "Cukuplah Allah bagiku; tidak ada Tuhan selain Dia. Hanya kepada-Nya aku bertawakal dan Dia adalah Tuhan yang memiliki 'Arsy yang agung.",
    targetCount: 7,
    fadhilah: "Barangsiapa membacanya 7x di pagi dan petang hari, Allah akan mencukupkannya dari segala hal yang menyusahkan urusan dunia dan akhiratnya.",
    source: "HR. Abu Dawud no. 5081",
  },

  // 24. Shalawat Nabi (10x)
  {
    id: "shalawat_nabi",
    title: "Shalawat Atas Nabi Muhammad SAW (10x)",
    category: "tasbih",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى سَيِّدِنَا إِبْرَاهِيمَ وَعَلَى آلِ سَيِّدِنَا إِبْرَاهِيمَ، وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى سَيِّدِنَا إِبْرَاهِيمَ وَعَلَى آلِ سَيِّدِنَا إِبْرَاهِيمَ، فِي الْعَالَمِينَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
    latinPagi: "Allāhumma ṣalli 'alā sayyidinā Muḥammadiw wa 'alā āli sayyidinā Muḥammad, kamā ṣallayta 'alā sayyidinā Ibrāhīma wa 'alā āli sayyidinā Ibrāhīm, wa bārik 'alā sayyidinā Muḥammadiw wa 'alā āli sayyidinā Muḥammad, kamā bārakta 'alā sayyidinā Ibrāhīma wa 'alā āli sayyidinā Ibrāhīm, fil-'ālamīna innaka ḥamīdum majīd.",
    meaningPagi: "Ya Allah, limpahkanlah shalawat kepada junjungan kami Nabi Muhammad dan keluarganya, sebagaimana Engkau telah melimpahkan shalawat kepada Nabi Ibrahim dan keluarganya. Dan berkahilah Nabi Muhammad dan keluarganya, sebagaimana Engkau telah memberkahi Nabi Ibrahim dan keluarganya, di seluruh alam semesta, sesungguhnya Engkau Maha Terpuji lagi Maha Mulia.",
    targetCount: 10,
    fadhilah: "Rasulullah SAW bersabda: 'Barangsiapa bershalawat kepadaku 10x di pagi hari dan 10x di petang hari, ia akan mendapatkan syafaatku pada hari kiamat.'",
    source: "HR. Thabrani (Sanad Hasan)",
  },

  // 25. Tasbih, Tahmid, Tahlil, Takbir (100x)
  {
    id: "tasbih_100",
    title: "Tasbih & Tahmid (100x)",
    category: "tasbih",
    type: "kubro",
    applicableTime: "both",
    arabicPagi: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    latinPagi: "Subḥānallāhi wa biḥamdih, subḥānallāhil-'aẓīm.",
    meaningPagi: "Maha Suci Allah dengan segala puji bagi-Nya, Maha Suci Allah Yang Maha Agung.",
    targetCount: 100,
    fadhilah: "Barangsiapa mengucapkan Subhanallah wa bihamdihi 100x dalam sehari, akan diampuni kesalahan-kesalahannya sekalipun sebanyak buih lautan.",
    source: "HR. Bukhari no. 6405 & Muslim",
  },

  // 26. Tahlil Tauhid Sempurna (10x)
  {
    id: "tahlil_10",
    title: "Kalimat Tauhid Pembebas Belenggu (10x)",
    category: "tasbih",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    latinPagi: "Lā ilāha illallāhu waḥdahū lā syarīka lah, lahul-mulku wa lahul-ḥamd, yuḥyī wa yumītu wa huwa 'alā kulli syai'in qadīr.",
    meaningPagi: "Tiada Tuhan selain Allah Yang Maha Esa, tiada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala puji. Dia yang menghidupkan dan yang mematikan, dan Dia Maha Kuasa atas segala sesuatu.",
    targetCount: 10,
    fadhilah: "Setara dengan memerdekakan empat orang budak dari keturunan Nabi Ismail AS, dicatat 100 kebaikan dan dihapus 100 keburukan.",
    source: "HR. Bukhari no. 6404 & Muslim",
  },

  // 27. Doa Rabithah (Penutup Khas Al-Ma'tsurat & Ikatan Hati Alumni)
  {
    id: "doa_rabithah",
    title: "Doa Rabithah (Ikatan Persaudaraan Hati)",
    category: "rabithah",
    type: "sughro",
    applicableTime: "both",
    arabicPagi: "قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَن تَشَاءُ وَتَنزِعُ الْمُلْكَ مِمَّن تَشَاءُ وَتُعِزُّ مَن تَشَاءُ وَتُذِلُّ مَن تَشَاءُ ۖ بِيَدِكَ الْخَيْرُ ۖ إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ ۝ تُولِجُ اللَّيْلَ فِي النَّهَارِ وَتُولِجُ النَّهَارَ فِي اللَّيْلِ ۖ وَتُخْرِجُ الْحَيَّ مِنَ الْمَيِّتِ وَتُخْرِجُ الْمَيِّتَ مِنَ الْحَيِّ ۖ وَتَرْزُقُ مَن تَشَاءُ بِغَيْرِ حِسَابٍ\n\nاللَّهُمَّ إِنَّكَ تَعْلَمُ أَنَّ هَذِهِ الْقُلُوبَ قَدِ اجْتَمَعَتْ عَلَى مَحَبَّتِكَ، وَالْتَقَتْ عَلَى طَاعَتِكَ، وَتَوَحَّدَتْ عَلَى دَعْوَتِكَ، وَتَعَاهَدَتْ عَلَى نُصْرَةِ شَرِيعَتِكَ. فَوَثِّقِ اللَّهُمَّ رَابِطَتَهَا، وَأَدِمْ وُدَّهَا، وَاهْدِهَا سُبُلَهَا، وَامْلَأْهَا بِنُورِكَ الَّذِي لَا يَخْبُو، وَاشْرَحْ صُدُورَهَا بِفَيْضِ الْإِيمَانِ بِكَ وَجَمِيلِ التَّوَكُّلِ عَلَيْكَ، وَأَحْيِهَا بِمَعْرِفَتِكَ، وَأَمِتْهَا عَلَى الشَّهَادَةِ فِي سَبِيلِكَ، إِنَّكَ نِعْمَ الْمَوْلَى وَنِعْمَ النَّصِيرُ. اللَّهُمَّ آمِينَ، وَصَلِّ اللَّهُمَّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ",
    latinPagi: "Qulillāhumma mālikal-mulki tu'til-mulka man tasyā'u wa tanzi'ul-mulka mimman tasyā'u wa tu'izzu man tasyā'u wa tużillu man tasyā', biyadikal-khair, innaka 'alā kulli syai'in qadīr. Tūlijul-laila fin-nahāri wa tūlijun-nahāra fil-laili wa tukhrijul-ḥayya minal-mayyiti wa tukhrijul-mayyita minal-ḥayyi wa tarzuqu man tasyā'u bigairi ḥisāb.\n\nAllāhumma innaka ta'lamu anna hāżihil-qulūba qadijtama'at 'alā maḥabbatik, waltaqat 'alā ṭā'atik, wa tawaḥḥadat 'alā da'watik, wa ta'āhadat 'alā nuṣrati syarī'atik. Fawassiṣillāhumma rābiṭatahā, wa adim wuddahā, wahdihā subulahā, wamla'hā binūrikallażī lā yakhbū, wasyrah ṣudūrahā bifaiḍil-īmāni bik, wa jamīlit-tawakkuli 'alaik, wa aḥyihā bima'rifatik, wa amithā 'alasy-syahādati fī sabīlik, innaka ni'mal-maulā wa ni'man-naṣīr. Allāhumma āmīn, wa ṣallillāhumma 'alā sayyidinā Muḥammadiw wa 'alā ālihī wa ṣaḥbihī wa sallam.",
    meaningPagi: "Katakanlah: 'Wahai Tuhan Yang mempunyai kerajaan, Engkau berikan kerajaan kepada orang yang Engkau kehendaki... Ya Allah, sesungguhnya Engkau Maha Mengetahui bahwa hati-hati ini telah berkumpul atas dasar kecintaan kepada-Mu, bertemu dalam ketaatan kepada-Mu, bersatu dalam dakwah-Mu, dan berjanji setia membela syariat-Mu. Maka teguhkanlah ya Allah ikatannya, kekalkanlah kasih sayangnya, tunjukilah jalan-jalannya, penuhilah ia dengan cahaya-Mu yang tak pernah padam, lapangkanlah dadanya dengan limpahan iman kepada-Mu dan indahnya tawakal kepada-Mu, hidupkanlah ia dengan ma'rifat kepada-Mu, dan wafatkanlah ia dalam keadaan syahid di jalan-Mu. Sesungguhnya Engkau sebaik-baik Pelindung dan sebaik-baik Penolong.'",
    targetCount: 1,
    fadhilah: "Doa ikatan batin (*Rabithah*) yang mengikat hati dan ukhuwah para sahabat seangkatan dalam kebaikan dan ridha Allah SWT.",
    source: "QS. Ali 'Imran: 26-27 & Doa Rabithah Hasan Al-Banna",
  },
];
