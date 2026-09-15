"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import ThemeToggle from "@/components/layout/ThemeToggle";
import "./divine.css";

interface VerseItem {
  arabic: string;
  latin: string;
  meaning: string;
  source: string;
}

const DEFAULT_VERSES: VerseItem[] = [
  {
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
    latin: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā ta'khużuhū sinatuw wa lā naum",
    meaning: "Allah, tidak ada tuhan selain Dia. Yang Maha Hidup, yang terus-menerus mengurus makhluk-Nya, tidak mengantuk dan tidak tidur.",
    source: "QS. Al-Baqarah: 255"
  },
  {
    arabic: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
    latin: "Wa qāla rabbukumud'ūnī astajib lakum",
    meaning: "Dan Tuhanmu berfirman: 'Berdoalah kepada-Ku, niscaya akan Kuperkenankan bagimu.'",
    source: "QS. Ghafir: 60"
  },
  {
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    latin: "Fa inna ma'al-'usri yusrā",
    meaning: "Maka sesungguhnya bersama kesulitan ada kemudahan.",
    source: "QS. Al-Insyirah: 5"
  },
  {
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    latin: "Inna ma'al-'usri yusrā",
    meaning: "Sesungguhnya bersama kesulitan itu ada kemudahan.",
    source: "QS. Al-Insyirah: 6"
  },
  {
    arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    latin: "Lā yukallifullāhu nafsan illā wus'ahā",
    meaning: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.",
    source: "QS. Al-Baqarah: 286"
  },
  {
    arabic: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ ۚ وَاللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌ",
    latin: "Wa huwa ma'akum ayna mā kuntum, wallāhu bimā ta'malūna baṣīr",
    meaning: "Dan Dia bersama kamu di mana saja kamu berada. Dan Allah Maha Melihat apa yang kamu kerjakan.",
    source: "QS. Al-Hadid: 4"
  },
  {
    arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    latin: "Fażkurūnī ażkurkum wasykurū lī wa lā takfurūn",
    meaning: "Maka ingatlah kepada-Ku, niscaya Aku ingat kepadamu. Bersyukurlah kepada-Ku dan janganlah mengingkari nikmat-Ku.",
    source: "QS. Al-Baqarah: 152"
  },
  {
    arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    latin: "Yā ayyuhallażīna āmanusta'īnū biṣ-ṣabri waṣ-ṣalāh, innallāha ma'aṣ-ṣābirīn",
    meaning: "Wahai orang-orang yang beriman! Mohonlah pertolongan kepada Allah dengan sabar dan shalat, sesungguhnya Allah beserta orang-orang yang sabar.",
    source: "QS. Al-Baqarah: 153"
  },
  {
    arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ",
    latin: "Wa iżā sa'alaka 'ibādī 'annī fa innī qarīb, ujību da'watad-dā'i iżā da'ān",
    meaning: "Dan apabila hamba-hamba-Ku bertanya kepadamu tentang Aku, maka sesungguhnya Aku adalah dekat. Aku mengabulkan permohonan orang yang berdoa apabila ia memohon kepada-Ku.",
    source: "QS. Al-Baqarah: 186"
  },
  {
    arabic: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ",
    latin: "Wa lā tahinū wa lā taḥzanū wa antumul-a'lawna in kuntum mu'minīn",
    meaning: "Dan janganlah kamu merasa lemah dan janganlah pula bersedih hati, sebab kamulah orang-orang yang paling tinggi derajatnya, jika kamu orang-orang yang beriman.",
    source: "QS. Ali Imran: 139"
  },
  {
    arabic: "فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ",
    latin: "Fa iżā 'azamta fa tawakkal 'alallāh, innallāha yuḥibbul-mutawakkilīn",
    meaning: "Kemudian, apabila engkau telah membulatkan tekad, maka bertawakallah kepada Allah. Sesungguhnya Allah mencintai orang-orang yang bertawakal.",
    source: "QS. Ali Imran: 159"
  },
  {
    arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    latin: "Alā biżikrillāhi taṭma'innul-qulūb",
    meaning: "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.",
    source: "QS. Ar-Ra'd: 28"
  },
  {
    arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ ۖ وَلَئِن كَفَرْتُمْ إِنَّ عَذَابِي لَشَدِيدٌ",
    latin: "La'in syakartum la'azīdannakum wa la'in kafartum inna 'ażābī lasyadīd",
    meaning: "Sesungguhnya jika kamu bersyukur, niscaya Aku akan menambah nikmat kepadamu, tetapi jika kamu mengingkari nikmat-Ku, pasti azab-Ku sangat berat.",
    source: "QS. Ibrahim: 7"
  },
  {
    arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
    latin: "Wa may yattaqillāha yaj'al lahū makhrajā",
    meaning: "Barangsiapa bertakwa kepada Allah niscaya Dia akan membukakan jalan keluar baginya.",
    source: "QS. At-Talaq: 2"
  },
  {
    arabic: "وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ۚ وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    latin: "Wa yarzuq-hu min ḥaiṡu lā yaḥtasib, wa may yatawakkal 'alallāhi fahuwa ḥasbuh",
    meaning: "Dan Dia memberinya rezeki dari arah yang tiada disangka-sangkanya. Dan barangsiapa bertawakal kepada Allah, niscaya Allah akan mencukupkan keperluannya.",
    source: "QS. At-Talaq: 3"
  },
  {
    arabic: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ",
    latin: "Mā wadda'aka rabbuka wa mā qalā",
    meaning: "Tuhanmu tidak meninggalkan engkau (Muhammad) dan tidak pula membencimu.",
    source: "QS. Ad-Duha: 3"
  },
  {
    arabic: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",
    latin: "Wa lasaufa yu'ṭīka rabbuka fa tarḍā",
    meaning: "Dan sungguh, kelak Tuhanmu pasti memberikan karunia-Nya kepadamu, sehingga engkau menjadi puas.",
    source: "QS. Ad-Duha: 5"
  },
  {
    arabic: "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ",
    latin: "Allāhu nūrus-samāwāti wal-arḍ",
    meaning: "Allah (Pemberi) cahaya kepada langit dan bumi.",
    source: "QS. An-Nur: 35"
  },
  {
    arabic: "إِنَّمَا الْمُؤْمِنُونَ الَّذِينَ إِذَا ذُكِرَ اللَّهُ وَجِلَتْ قُلُوبُهُمْ",
    latin: "Innamal-mu'minūnallażīna iżā żukirallāhu wajilat qulūbuhum",
    meaning: "Sesungguhnya orang-orang yang beriman adalah mereka yang apabila disebut nama Allah gemetarlah hati mereka.",
    source: "QS. Al-Anfal: 2"
  },
  {
    arabic: "هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ ۖ عَالِمُ الْغَيْبِ وَالشَّهَادَةِ ۖ هُوَ الرَّحْمَٰنُ الرَّحِيمُ",
    latin: "Huwallāhullażī lā ilāha illā huw, 'ālimul-ghaibi wasy-syahādah, huwar-raḥmānur-raḥīm",
    meaning: "Dialah Allah yang tiada Tuhan selain Dia, Mengetahui yang gaib dan yang nyata, Dialah Yang Maha Pengasih, Maha Penyayang.",
    source: "QS. Al-Hasyr: 22"
  },
  {
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    latin: "Rabbanā hab lanā min azwājinā wa żurriyyātinā qurrata a'yuniw waj'alnā lil-muttaqīna imāmā",
    meaning: "Ya Tuhan kami, anugerahkanlah kepada kami pasangan kami dan keturunan kami sebagai penyenang hati, dan jadikanlah kami pemimpin bagi orang yang bertakwa.",
    source: "QS. Al-Furqan: 74"
  },
  {
    arabic: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
    latin: "Lā ilāha illā anta sub-ḥānaka innī kuntu minaẓ-ẓālimīn",
    meaning: "Tidak ada tuhan selain Engkau, Maha Suci Engkau. Sungguh, aku termasuk orang-orang yang zalim.",
    source: "QS. Al-Anbiya: 87"
  },
  {
    arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا",
    latin: "Qul yā 'ibādiyallażīna asrafū 'alā anfusihim lā taqnaṭū mir raḥmatillāh, innallāha yaghfiruz-żunūba jamī'ā",
    meaning: "Katakanlah: Wahai hamba-hamba-Ku yang melampaui batas terhadap diri mereka sendiri! Janganlah kamu berputus asa dari rahmat Allah. Sesungguhnya Allah mengampuni dosa-dosa semuanya.",
    source: "QS. Az-Zumar: 53"
  },
  {
    arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
    latin: "Rabbisyraḥ lī ṣadrī wa yassir lī amrī",
    meaning: "Ya Tuhanku, lapangkanlah dadaku, dan mudahkanlah untukku urusanku.",
    source: "QS. Taha: 25"
  },
  {
    arabic: "رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
    latin: "Rabbanā ātinā mil ladunka raḥmataw wa hayyi' lanā min amrinā rasyadā",
    meaning: "Ya Tuhan kami, berikanlah rahmat kepada kami dari sisi-Mu dan sempurnakanlah petunjuk yang lurus bagi kami dalam urusan kami.",
    source: "QS. Al-Kahf: 10"
  },
  {
    arabic: "وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ",
    latin: "Wa innaka la'alā khuluqin 'aẓīm",
    meaning: "Dan sesungguhnya engkau (Muhammad) benar-benar berbudi pekerti yang luhur.",
    source: "QS. Al-Qalam: 4"
  },
  {
    arabic: "وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ",
    latin: "Wa iżā mariḍtu fahuwa yasyfīn",
    meaning: "Dan apabila aku sakit, Dialah yang menyembuhkan aku.",
    source: "QS. Asy-Syu'ara: 80"
  },
  {
    arabic: "إِنَّمَا أَمْرُهُ إِذَا أَرَادَ شَيْئًا أَن يَقُولَ لَهُ كُن فَيَكُونُ",
    latin: "Innamā amruhū iżā arāda syai'an ay yaqūla lahū kun fa yakūn",
    meaning: "Sesungguhnya urusan-Nya apabila Dia menghendaki sesuatu hanyalah berkata kepadanya: 'Jadilah!' Maka terjadilah ia.",
    source: "QS. Yasin: 82"
  },
  {
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۚ اللَّهُ الصَّمَدُ",
    latin: "Qul huwallāhu aḥad, allāhuṣ-ṣamad",
    meaning: "Katakanlah (Muhammad): 'Dialah Allah, Yang Maha Esa. Allah tempat meminta segala sesuatu.'",
    source: "QS. Al-Ikhlas: 1"
  }
];

const surahMap: Record<string, number> = {
  'Al-Fatihah': 1, 'Al-Baqarah': 2, 'Ali Imran': 3, 'An-Nisa': 4, 'Al-Ma\'idah': 5, 'Al-An\'am': 6, 'Al-A\'raf': 7, 'Al-Anfal': 8, 'At-Taubah': 9, 'Yunus': 10,
  'Hud': 11, 'Yusuf': 12, 'Ar-Ra\'d': 13, 'Ibrahim': 14, 'Al-Hijr': 15, 'An-Nahl': 16, 'Al-Isra': 17, 'Al-Kahf': 18, 'Maryam': 19, 'Taha': 20,
  'Al-Anbiya': 21, 'Al-Hajj': 22, 'Al-Mu\'minun': 23, 'An-Nur': 24, 'Al-Furqan': 25, 'Asy-Syu\'ara': 26, 'An-Naml': 27, 'Al-Qasas': 28, 'Al-\'Ankabut': 29, 'Ar-Rum': 30,
  'Luqman': 31, 'As-Sajdah': 32, 'Al-Ahzab': 33, 'Saba': 34, 'Fatir': 35, 'Yasin': 36, 'As-Saffat': 37, 'Sad': 38, 'Az-Zumar': 39, 'Ghafir': 40,
  'Fussilat': 41, 'Asy-Syura': 42, 'Az-Zukhruf': 43, 'Ad-Dukhan': 44, 'Al-Jasiyah': 45, 'Al-Ahqaf': 46, 'Muhammad': 47, 'Al-Fath': 48, 'Al-Hujurat': 49, 'Qaf': 50,
  'Az-Zariyat': 51, 'At-Tur': 52, 'An-Najm': 53, 'Al-Qamar': 54, 'Ar-Rahman': 55, 'Al-Waqi\'ah': 56, 'Al-Hadid': 57, 'Al-Mujadilah': 58, 'Al-Hasyr': 59, 'Al-Mumtahanah': 60,
  'As-Saff': 61, 'Al-Jumu\'ah': 62, 'Al-Munafiqun': 63, 'At-Tagabun': 64, 'At-Talaq': 65, 'At-Tahrim': 66, 'Al-Mulk': 67, 'Al-Qalam': 68, 'Al-Haqqah': 69, 'Al-Ma\'arij': 70,
  'Nuh': 71, 'Al-Jinn': 72, 'Al-Muzzammil': 73, 'Al-Muddassir': 74, 'Al-Qiyamah': 75, 'Al-Insan': 76, 'Al-Mursalat': 77, 'An-Naba': 78, 'An-Nazi\'at': 79, '\'Abasa': 80,
  'At-Takwir': 81, 'Al-Infitar': 82, 'Al-Mutaffifin': 83, 'Al-Insyiqaq': 84, 'Al-Buruj': 85, 'At-Tariq': 86, 'Al-A\'la': 87, 'Al-Gasyiyah': 88, 'Al-Fajr': 89, 'Al-Balad': 90,
  'Asy-Syams': 91, 'Al-Lail': 92, 'Ad-Duha': 93, 'Al-Insyirah': 94, 'At-Tin': 95, 'Al-\'Alaq': 96, 'Al-Qadr': 97, 'Al-Bayyinah': 98, 'Az-Zalzalah': 99, 'Al-\'Adiyat': 100,
  'Al-Qari\'ah': 101, 'At-Takasur': 102, 'Al-\'Asr': 103, 'Al-Humazah': 104, 'Al-Fil': 105, 'Quraisy': 106, 'Al-Ma\'un': 107, 'Al-Kausar': 108, 'Al-Kafirun': 109, 'An-Nasr': 110,
  'Al-Lahab': 111, 'Al-Ikhlas': 112, 'Al-Falaq': 113, 'An-Nas': 114
};

export default function DivineClient() {
  const [activeVerse, setActiveVerse] = useState<VerseItem | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const pf = document.getElementById("particleField");
    if (pf && pf.children.length === 0) {
      for (let i = 0; i < 25; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.left = Math.random() * 100 + "vw";
        p.style.animationDuration = Math.random() * 8 + 6 + "s";
        p.style.animationDelay = Math.random() * 10 + "s";
        pf.appendChild(p);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch((e) => console.log("Audio play notice:", e));
    } else {
      audioRef.current.pause();
    }
  };

  const replayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const handleCopy = () => {
    if (!activeVerse) return;
    const text = `${activeVerse.arabic}\n\n"${activeVerse.latin}"\n\nArtinya:\n"${activeVerse.meaning}"\n\n(${activeVerse.source})\n— Kalam Ilahi Expedient 43`;
    navigator.clipboard.writeText(text);
    if (navigator.vibrate) navigator.vibrate(25);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleShare = () => {
    if (!activeVerse) return;
    const text = `Kalam Ilahi Hari Ini:\n\n${activeVerse.arabic}\n\n"${activeVerse.latin}"\n\nArtinya:\n"${activeVerse.meaning}"\n\n(${activeVerse.source})\n\nDibagikan dari Portal Alumni Expedient Generation 43`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "Kalam Ilahi - Expedient Generation 43",
          text: text,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank");
    }
  };

  const revealVerse = () => {
    // Pick random verse avoiding current if possible
    let nextIdx = Math.floor(Math.random() * DEFAULT_VERSES.length);
    if (activeVerse && DEFAULT_VERSES.length > 1) {
      while (DEFAULT_VERSES[nextIdx].source === activeVerse.source) {
        nextIdx = Math.floor(Math.random() * DEFAULT_VERSES.length);
      }
    }
    const v = DEFAULT_VERSES[nextIdx];
    setActiveVerse(v);
    setShowResult(true);

    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);

    // Audio stream preparation
    const match = v.source.match(/QS\.\s+(.+?):\s+(\d+)/);
    if (match) {
      const surahName = match[1].trim();
      const ayahNum = parseInt(match[2], 10);
      const surahNum = surahMap[surahName];

      if (surahNum) {
        const s = String(surahNum).padStart(3, "0");
        const a = String(ayahNum).padStart(3, "0");
        const primaryUrl = `https://audio.qurancdn.com/Alafasy/mp3/${s}${a}.mp3`;
        const fallbackUrl = `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;

        const audio = new Audio(primaryUrl);
        audio.onplay = () => setIsPlayingAudio(true);
        audio.onpause = () => setIsPlayingAudio(false);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => {
          if (audio.src !== fallbackUrl) {
            audio.src = fallbackUrl;
            audio.play().catch(() => {});
          } else {
            setIsPlayingAudio(false);
          }
        };

        audioRef.current = audio;
        audio.play().catch((e) => {
          console.log("Audio autoplay notice:", e);
        });
      }
    }

    // GSAP reveal animation
    setTimeout(() => {
      const tl = gsap.timeline();
      tl.fromTo(
        "#verseCard",
        { opacity: 0, y: 30, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      )
        .fromTo(
          "#ayatArabic",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
          "-=0.4"
        )
        .fromTo(
          "#ayatLatin",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
          "-=0.3"
        )
        .fromTo(
          "#ayatMeaning",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
          "-=0.3"
        );
    }, 50);
  };

  const resetVerse = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);

    gsap.to("#verseCard", {
      opacity: 0,
      y: -15,
      duration: 0.3,
      onComplete: () => {
        revealVerse();
      },
    });
  };

  return (
    <div className="divine-wrapper">
      {/* Fixed Sticky Top Navigation Bar */}
      <div className="divine-top-nav">
        <Link href="/fitur" className="btn-back">
          <i className="fa-solid fa-chevron-left"></i> Fitur
        </Link>
        <ThemeToggle />
      </div>

      {/* Ambient background decoration */}
      <div className="geo-bg">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="isl" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <polygon
                points="10,0 20,5 20,15 10,20 0,15 0,5"
                fill="none"
                stroke="rgba(212,175,55,0.5)"
                strokeWidth="0.3"
              />
              <circle cx="10" cy="10" r="2" fill="none" stroke="rgba(27,94,32,0.5)" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#isl)" />
        </svg>
      </div>
      <div className="ambient"></div>
      <div id="particleField"></div>

      {/* Main Content Area */}
      <div className="divine-content">
        <h1 className="page-title" id="pageTitle">
          Kalam Ilahi
        </h1>
        <p className="page-sub" id="pageSub">
          Tadabbur ayat-ayat suci Al-Qur&apos;an penentram jiwa yang ditakdirkan untuk Anda hari ini
        </p>

        {/* ---------------------------------------------------------------
            INITIAL STATE: ORNATE HOLY GATEWAY
            --------------------------------------------------------------- */}
        {!showResult && (
          <div className="divine-gateway-card">
            <div className="gateway-rub-el-hizb">
              <i className="fa-solid fa-star-and-crescent"></i>
            </div>
            <div className="gateway-bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
            <p className="gateway-prompt">
              Buka hati dan niatkan kebaikan untuk menerima pesan suci Kalam Ilahi yang ditakdirkan membimbing hari Anda.
            </p>
            <button type="button" className="btn-reveal" onClick={revealVerse}>
              <i className="fa-solid fa-book-quran"></i>&nbsp; Buka Kalam Hari Ini
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------
            REVEALED STATE: GRAND VERSE CARD
            --------------------------------------------------------------- */}
        {showResult && activeVerse && (
          <div className="verse-card" id="verseCard">
            {/* Surah Reference Pill Badge */}
            <div className="verse-surah-pill">
              <i className="fa-solid fa-book-open"></i> {activeVerse.source}
            </div>

            {/* Bismillah Header */}
            <div className="bismillah" id="bismillah">
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </div>

            {/* Arabic Verse */}
            <div className="ayat-arabic" id="ayatArabic">
              {activeVerse.arabic}
            </div>

            <div className="divider" id="divider"></div>

            {/* Latin Transliteration */}
            <div className="ayat-latin" id="ayatLatin">
              &ldquo;{activeVerse.latin}&rdquo;
            </div>

            {/* Translation / Meaning */}
            <div className="ayat-meaning" id="ayatMeaning">
              &ldquo;{activeVerse.meaning}&rdquo;
            </div>

            {/* Interactive Audio Tilawah Bar */}
            <div className="audio-player-bar">
              <div className="audio-controls-left">
                <button
                  type="button"
                  className={`btn-audio-play ${isPlayingAudio ? "playing" : ""}`}
                  onClick={toggleAudio}
                  title={isPlayingAudio ? "Jeda Murottal" : "Putar Murottal"}
                  aria-label={isPlayingAudio ? "Jeda Tilawah" : "Putar Tilawah"}
                >
                  <i className={`fa-solid ${isPlayingAudio ? "fa-pause" : "fa-play"}`}></i>
                </button>
                <div className="audio-meta-text">
                  <span className="audio-title-lbl">
                    {isPlayingAudio ? "Memutar Murottal" : "Dengarkan Tilawah"}
                  </span>
                  <span className="audio-subtitle-lbl">Qari: Syaikh Misyari Rasyid Al-Afasy</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className={`equalizer-wave ${isPlayingAudio ? "active" : ""}`}>
                  <div className="equalizer-bar"></div>
                  <div className="equalizer-bar"></div>
                  <div className="equalizer-bar"></div>
                  <div className="equalizer-bar"></div>
                  <div className="equalizer-bar"></div>
                </div>
                {isPlayingAudio && (
                  <button
                    type="button"
                    onClick={replayAudio}
                    className="btn-action-pill"
                    style={{ padding: "6px 10px", fontSize: "0.72rem" }}
                    title="Ulangi dari awal"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons: Copy, Share, Next */}
            <div className="verse-actions-row">
              <button type="button" className="btn-action-pill" onClick={handleCopy}>
                <i className="fa-solid fa-copy"></i> Salin Ayat
              </button>
              <button type="button" className="btn-action-pill" onClick={handleShare}>
                <i className="fa-brands fa-whatsapp"></i> Bagikan
              </button>
              <button type="button" className="btn-new" onClick={resetVerse}>
                <i className="fa-solid fa-shuffle"></i> Terima Kalam Lain
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Copy Toast Feedback */}
      {copiedToast && (
        <div className="divine-toast">
          <i className="fa-solid fa-check"></i> Ayat & terjemahan berhasil disalin!
        </div>
      )}
    </div>
  );
}

