"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDialogEscape } from "@/hooks/useDialogEscape";
import "./kontemplasi.css";

export default function KontemplasiClient({ initialJournals, userId }: { initialJournals: any[], userId: string }) {
    const { locale, dir, isRTL } = useLanguage();
    const [journals, setJournals] = useState(initialJournals);
    const [isStarted, setIsStarted] = useState(false);
    const [audioMenuOpen, setAudioMenuOpen] = useState(false);
    const [journalPanelOpen, setJournalPanelOpen] = useState(false);

    const [newContent, setNewContent] = useState("");
    const [newMood, setNewMood] = useState("Netral");
    const [isPrivate, setIsPrivate] = useState(true);

    useDialogEscape(journalPanelOpen, () => setJournalPanelOpen(false));
    useDialogEscape(audioMenuOpen, () => setAudioMenuOpen(false));

    const [breathText, setBreathText] = useState("");
    const [breathOpacity, setBreathOpacity] = useState(0);
    const [orbState, setOrbState] = useState("");
    const [currentWisdom, setCurrentWisdom] = useState("");
    const [currentTrack, setCurrentTrack] = useState<string | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const nodesRef = useRef<any[]>([]);
    const dustContainerRef = useRef<HTMLDivElement>(null);
    const wisdomRef = useRef<HTMLDivElement>(null);
    const breathCycleRef = useRef<NodeJS.Timeout | null>(null);
    const wisdomCycleRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (isStarted && dustContainerRef.current) {
            const dustContainer = dustContainerRef.current;
            dustContainer.innerHTML = '';
            if (!reducedMotion) {
                for (let i = 0; i < 24; i++) {
                    let dust = document.createElement('div');
                    dust.classList.add('dust');
                    let size = Math.random() * 2 + 1;
                    dust.style.width = size + 'px';
                    dust.style.left = (Math.random() * 88 + 2) + '%';
                    dust.style.top = (Math.random() * 88 + 2) + '%';
                    dustContainer.appendChild(dust);

                    gsap.to(dust, {
                        y: "-=150",
                        x: "+=" + (Math.random() * 150 - 75),
                        opacity: Math.random() * 0.4 + 0.1,
                        duration: Math.random() * 15 + 15,
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: -1
                    });
                }
            }

            const breathLabels = locale === "ar"
                ? { inhale: "شهيق عميق", hold: "احتفظ بالنفس", exhale: "زفير هادئ" }
                : locale === "en"
                    ? { inhale: "Breathe In", hold: "Hold", exhale: "Breathe Out" }
                    : { inhale: "Tarik Napas", hold: "Tahan", exhale: "Hembuskan" };

            const breathCycle = () => {
                setBreathOpacity(0);
                setTimeout(() => { setBreathText(breathLabels.inhale); setBreathOpacity(1); }, 500);
                setOrbState('orb-inhale');

                setTimeout(() => {
                    setBreathOpacity(0);
                    setTimeout(() => { setBreathText(breathLabels.hold); setBreathOpacity(1); }, 500);
                    setOrbState('orb-hold');
                }, 4000);

                setTimeout(() => {
                    setBreathOpacity(0);
                    setTimeout(() => { setBreathText(breathLabels.exhale); setBreathOpacity(1); }, 500);
                    setOrbState('orb-exhale');
                    breathCycleRef.current = setTimeout(breathCycle, 8000);
                }, 11000);
            };

            breathCycleRef.current = setTimeout(breathCycle, 1500);

            const wisdoms = locale === "ar"
                ? [
                    "استنشق الطمأنينة، وأخرج القلق.",
                    "كل شدة ستزول بإذن الله.",
                    "في السكون نجد أوضح الإجابات.",
                    "ركّز على هذه اللحظة وشكرها.",
                    "أنت أقوى من مخاوفك."
                ]
                : locale === "en"
                    ? [
                        "Breathe in stillness, release worry.",
                        "This difficulty will also pass.",
                        "In quietness, clarity returns.",
                        "Stay present; cherish this breath.",
                        "Peace begins within."
                    ]
                    : [
                        "Tarik kedamaian, hembuskan kekhawatiran.",
                        "Semua akan berlalu. Begitu pun rintangan ini.",
                        "Di dalam keheningan, kita menemukan jawaban terdalam.",
                        "Fokus pada saat ini. Masa lalu sudah berlalu.",
                        "Anda lebih kuat dari rasa takut Anda.",
                        "Syukuri napas ini, anugerah terindah hari ini.",
                        "Berdamailah dengan diri sendiri.",
                        "Lepaskan segala yang tidak bisa Anda kendalikan."
                    ];

            const showWisdom = () => {
                if (!wisdomRef.current) return;
                const quote = wisdoms[Math.floor(Math.random() * wisdoms.length)];
                setCurrentWisdom(quote);

                gsap.fromTo(wisdomRef.current,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1, y: 0, duration: reducedMotion ? 0.3 : 3, ease: "power2.out", onComplete: () => {
                            gsap.to(wisdomRef.current, {
                                opacity: 0, y: -30, duration: reducedMotion ? 0.3 : 3, delay: 6, onComplete: () => {
                                    wisdomCycleRef.current = setTimeout(showWisdom, Math.random() * 12000 + 8000);
                                }
                            });
                        }
                    }
                );
            };
            wisdomCycleRef.current = setTimeout(showWisdom, 6000);
        }

        return () => {
            if (breathCycleRef.current) clearTimeout(breathCycleRef.current);
            if (wisdomCycleRef.current) clearTimeout(wisdomCycleRef.current);
        };
    }, [isStarted, locale]);

            const stopProceduralAudio = () => {
                if (audioCtxRef.current && nodesRef.current.length > 0) {
                    nodesRef.current.forEach(node => {
                        if (node.gain) {
                            node.gain.linearRampToValueAtTime(0, audioCtxRef.current!.currentTime + 1);
                        }
                        setTimeout(() => {
                            if (node.stop) { try { node.stop(); } catch (e) { } }
                            node.disconnect();
                        }, 1500);
                    });
                    nodesRef.current = [];
                }
            };

            const startProceduralAudio = (type: string) => {
                if (!audioCtxRef.current) {
                    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                if (audioCtxRef.current.state === 'suspended') {
                    audioCtxRef.current.resume();
                }
                stopProceduralAudio();

                const ctx = audioCtxRef.current;

                if (type === 'binaural') {
                    const leftOsc = ctx.createOscillator();
                    const rightOsc = ctx.createOscillator();
                    const leftPan = ctx.createStereoPanner();
                    const rightPan = ctx.createStereoPanner();
                    const masterGain = ctx.createGain();

                    leftOsc.type = 'sine'; leftOsc.frequency.value = 200;
                    rightOsc.type = 'sine'; rightOsc.frequency.value = 206;
                    leftPan.pan.value = -1; rightPan.pan.value = 1;

                    masterGain.gain.setValueAtTime(0, ctx.currentTime);
                    masterGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 3);

                    leftOsc.connect(leftPan).connect(masterGain);
                    rightOsc.connect(rightPan).connect(masterGain);
                    masterGain.connect(ctx.destination);

                    leftOsc.start(); rightOsc.start();
                    nodesRef.current.push(leftOsc, rightOsc, masterGain);
                }
                else if (type === 'brownnoise') {
                    const bufferSize = ctx.sampleRate * 2;
                    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    let lastOut = 0;
                    for (let i = 0; i < bufferSize; i++) {
                        let white = Math.random() * 2 - 1;
                        output[i] = (lastOut + (0.02 * white)) / 1.02;
                        lastOut = output[i];
                        output[i] *= 3.5;
                    }
                    const noiseSource = ctx.createBufferSource();
                    noiseSource.buffer = noiseBuffer;
                    noiseSource.loop = true;

                    const filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass'; filter.frequency.value = 400;

                    const masterGain = ctx.createGain();
                    masterGain.gain.setValueAtTime(0, ctx.currentTime);
                    masterGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 3);

                    noiseSource.connect(filter).connect(masterGain).connect(ctx.destination);
                    noiseSource.start();
                    nodesRef.current.push(noiseSource, masterGain);
                }
                else if (type === 'ocean') {
                    const bufferSize = ctx.sampleRate * 2;
                    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                    for (let i = 0; i < bufferSize; i++) {
                        let white = Math.random() * 2 - 1;
                        b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759;
                        b2 = 0.96900 * b2 + white * 0.1538520; b3 = 0.86650 * b3 + white * 0.3104856;
                        b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980;
                        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                        output[i] *= 0.05;
                        b6 = white * 0.115926;
                    }
                    const noiseSource = ctx.createBufferSource();
                    noiseSource.buffer = noiseBuffer;
                    noiseSource.loop = true;

                    const filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass'; filter.frequency.value = 600;

                    const lfo = ctx.createOscillator();
                    lfo.type = 'sine'; lfo.frequency.value = 0.08;

                    const lfoGain = ctx.createGain();
                    lfoGain.gain.value = 0.7;

                    const waveGain = ctx.createGain();
                    waveGain.gain.value = 0.3;

                    lfo.connect(lfoGain).connect(waveGain.gain);
                    noiseSource.connect(filter).connect(waveGain).connect(ctx.destination);

                    noiseSource.start(); lfo.start();
                    nodesRef.current.push(noiseSource, lfo, waveGain, lfoGain);
                }
                else if (type === 'space') {
                    const frequencies = [216, 256.28, 323.63];
                    const masterGain = ctx.createGain();
                    masterGain.gain.setValueAtTime(0, ctx.currentTime);
                    masterGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 4);

                    frequencies.forEach(freq => {
                        const osc = ctx.createOscillator();
                        osc.type = 'sine'; osc.frequency.value = freq;

                        const lfo = ctx.createOscillator();
                        lfo.type = 'sine'; lfo.frequency.value = Math.random() * 0.2 + 0.05;

                        const oscGain = ctx.createGain();
                        oscGain.gain.value = 0.2;

                        lfo.connect(oscGain.gain);
                        osc.connect(oscGain).connect(masterGain);

                        osc.start(); lfo.start();
                        nodesRef.current.push(osc, lfo, oscGain);
                    });

                    masterGain.connect(ctx.destination);
                    nodesRef.current.push(masterGain);
                }
                else if (type === 'wind') {
                    const bufferSize = ctx.sampleRate * 2;
                    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * 0.2;

                    const noiseSource = ctx.createBufferSource();
                    noiseSource.buffer = noiseBuffer;
                    noiseSource.loop = true;

                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass'; filter.Q.value = 2.0; filter.frequency.value = 300;

                    const lfo = ctx.createOscillator();
                    lfo.type = 'sine'; lfo.frequency.value = 0.15;

                    const lfoGain = ctx.createGain();
                    lfoGain.gain.value = 600;

                    lfo.connect(lfoGain).connect(filter.frequency);

                    const masterGain = ctx.createGain();
                    masterGain.gain.setValueAtTime(0, ctx.currentTime);
                    masterGain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 3);

                    noiseSource.connect(filter).connect(masterGain).connect(ctx.destination);

                    noiseSource.start(); lfo.start();
                    nodesRef.current.push(noiseSource, lfo, lfoGain, masterGain);
                }
            };

            const handleStart = () => {
                // [CRITICAL MOBILE FIX] Unlock HTML5 Audio synchronously inside user click event!
                ['rain', 'ocean', 'space', 'zen', 'quran'].forEach(key => {
                    const aud = document.getElementById('audio-' + key) as HTMLMediaElement;
                    if (aud) {
                        aud.volume = 0;
                        const p = aud.play();
                        if (p !== undefined) {
                            p.then(() => {
                                if (key !== 'rain') aud.pause(); // Let 'rain' continue playing since it's the auto-start track
                            }).catch(e => console.log("Unlock HTML5 Audio:", e));
                        }
                    }
                });

                setIsStarted(true);
                gsap.to(".start-overlay", {
                    opacity: 0, duration: 2, onComplete: () => {
                        document.querySelector('.start-overlay')?.classList.add('hidden');
                    }
                });

                // Auto-start rain track like in CI4 after fade out
                setTimeout(() => {
                    handleSwitchTrack('rain');
                }, 1500);
            };

            const submitJournal = async (e: React.FormEvent) => {
                e.preventDefault();
                if (!newContent) return;

                const { data, error } = await supabase.from('kontemplasi_journals').insert([
                    { user_id: userId, content: newContent, mood: newMood, is_private: isPrivate }
                ]).select();

                if (!error && data) {
                    setJournals([data[0], ...journals]);
                    setNewContent("");
                }
            };

            const handleSwitchTrack = (trackKey: string) => {
                if (currentTrack === trackKey) return;

                stopProceduralAudio();

                ['rain', 'ocean', 'space', 'zen', 'quran'].forEach(key => {
                    if (key === trackKey) return;
                    const aud = document.getElementById('audio-' + key) as HTMLMediaElement;
                    if (aud) {
                        gsap.to(aud, { volume: 0, duration: 1, onComplete: () => { aud.pause(); } });
                    }
                });

                if (trackKey === 'none') {
                    setCurrentTrack(null);
                    return;
                }

                setCurrentTrack(trackKey);

                if (trackKey.startsWith('procedural-')) {
                    startProceduralAudio(trackKey.replace('procedural-', ''));
                } else {
                    const newAudio = document.getElementById('audio-' + trackKey) as HTMLMediaElement;
                    if (newAudio) {
                        newAudio.volume = 0;
                        const p = newAudio.play();
                        if (p !== undefined) {
                            p.then(() => gsap.to(newAudio, { volume: 0.8, duration: 2 })).catch(e => console.log(e));
                        }
                    }
                }
            };

                const copy = {
                    back: locale === "ar" ? "العودة" : locale === "en" ? "Back" : "Kembali",
                    title: locale === "ar" ? "ركن التأمل" : locale === "en" ? "Contemplation Space" : "Ruang Kontemplasi",
                    desc:
                        locale === "ar"
                            ? "اترك مشاغل الدنيا للحظة، واجلس في سكون مع صوت الطبيعة والتنفس الهادي."
                            : locale === "en"
                                ? "Step away from daily noise for a moment. Sit comfortably, enable ambient sound, and follow the breathing rhythm."
                                : "Tinggalkan sejenak urusan duniawi. Posisikan diri Anda dengan nyaman, aktifkan suara, dan ikuti ritme keheningan.",
                    start: locale === "ar" ? "ابدأ التأمل" : locale === "en" ? "Begin Session" : "Mulai Keheningan",
                    sound: locale === "ar" ? "الصوت" : locale === "en" ? "Sound" : "Atur Suara",
                    journal: locale === "ar" ? "المفكرة" : locale === "en" ? "Journal" : "Buka Jurnal",
                    ambientHeading: locale === "ar" ? "أصوات الطبيعة" : locale === "en" ? "AMBIENT AUDIO" : "AUDIO SUASANA",
                    synthHeading: locale === "ar" ? "توليف صوتي دون إنترنت" : locale === "en" ? "OFFLINE SYNTHESIS" : "SINTESIS SUARA OFFLINE",
                    muteAll: locale === "ar" ? "كتم الكل" : locale === "en" ? "Mute All" : "Heningkan Semua",
                    journalTitle: locale === "ar" ? "مفكرة التأمل" : locale === "en" ? "Reflection Journal" : "Catatan Kontemplasi",
                    journalSub:
                        locale === "ar"
                            ? "دوّن خواطرك وتأملاتك الروحية هنا."
                            : locale === "en"
                                ? "Record your reflections and spiritual thoughts here."
                                : "Rekam jejak spiritual dan pikiran Anda di sini.",
                    placeholder:
                        locale === "ar"
                            ? "ما الذي تتأمل فيه اليوم؟"
                            : locale === "en"
                                ? "What are you reflecting on today?"
                                : "Apa yang sedang Anda renungkan hari ini?",
                    saveEntry: locale === "ar" ? "حفظ التأمل" : locale === "en" ? "SAVE ENTRY" : "REKAM JEJAK",
                    closeJournal: locale === "ar" ? "إغلاق المفكرة" : locale === "en" ? "Close journal" : "Tutup jurnal",
                };

                return (
                    <div className="sanctuary-wrapper" dir={dir}>

                        <Link href="/fitur" className="btn-top-back">
                            <i className={`fa-solid ${isRTL ? "fa-arrow-right" : "fa-arrow-left"}`} aria-hidden="true"></i> {copy.back}
                        </Link>

                        <div style={{ position: 'absolute', top: 'max(16px, env(safe-area-inset-top, 16px))', insetInlineEnd: 'max(16px, env(safe-area-inset-right, 16px))', zIndex: 100 }}>
                            <ThemeToggle />
                        </div>

                        {!isStarted && (
                            <div className="start-overlay">
                                <h1 className="start-title">{copy.title}</h1>
                                <p className="start-desc">{copy.desc}</p>
                                <button type="button" className="btn-start" onClick={handleStart}>{copy.start}</button>
                            </div>
                        )}

                        <div className="dust-container" ref={dustContainerRef}></div>
                        <div className="floating-wisdom" ref={wisdomRef}>{currentWisdom}</div>

                        <div className={`orb-container ${orbState}`}>
                            <div className="mandala-ring ring-4"></div>
                            <div className="mandala-ring ring-3"></div>
                            <div className="mandala-ring ring-2"></div>
                            <div className="mandala-ring ring-1"></div>
                            <div className="breathing-core"></div>
                            <div className="guide-text" style={{ opacity: breathOpacity }}>{breathText}</div>
                        </div>

                        <div className="stealth-controls">
                            <button type="button" className="stealth-btn" onClick={() => setAudioMenuOpen(!audioMenuOpen)} aria-expanded={audioMenuOpen}>
                                <i className="fa-solid fa-music" aria-hidden="true"></i>
                                <span>{copy.sound}</span>
                            </button>
                            <button type="button" className="stealth-btn" onClick={() => setJournalPanelOpen(!journalPanelOpen)} aria-expanded={journalPanelOpen}>
                                <i className="fa-solid fa-feather-pointed" aria-hidden="true"></i>
                                <span>{copy.journal}</span>
                            </button>
                        </div>

                        <div className={`audio-menu ${audioMenuOpen ? 'show' : ''}`}>
                            <div style={{ width: '100%', textAlign: 'center', color: 'var(--gold-main)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', margin: '5px 0' }}>{copy.ambientHeading}</div>
                            <button type="button" className={`audio-track ${currentTrack === 'rain' ? 'active' : ''}`} onClick={() => handleSwitchTrack('rain')}><i className="fa-solid fa-cloud-rain" aria-hidden="true" /> Hujan Deras</button>
                            <button type="button" className={`audio-track ${currentTrack === 'ocean' ? 'active' : ''}`} onClick={() => handleSwitchTrack('ocean')}><i className="fa-solid fa-water" aria-hidden="true" /> Ombak Samudra</button>
                            <button type="button" className={`audio-track ${currentTrack === 'space' ? 'active' : ''}`} onClick={() => handleSwitchTrack('space')}><i className="fa-solid fa-moon" aria-hidden="true" /> Ruang Sunyi</button>
                            <button type="button" className={`audio-track ${currentTrack === 'zen' ? 'active' : ''}`} onClick={() => handleSwitchTrack('zen')}><i className="fa-solid fa-wind" aria-hidden="true" /> Angin Malam</button>
                            <button type="button" className={`audio-track ${currentTrack === 'quran' ? 'active' : ''}`} onClick={() => handleSwitchTrack('quran')}><i className="fa-solid fa-book-quran" aria-hidden="true" /> Ar-Rahman</button>

                            <div style={{ width: '100%', textAlign: 'center', color: 'var(--gold-main)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', marginTop: '10px' }}>{copy.synthHeading}</div>
                            <button type="button" className={`audio-track ${currentTrack === 'procedural-brownnoise' ? 'active' : ''}`} style={{ borderColor: 'var(--gold-main)', background: 'rgba(212,175,55,0.1)' }} onClick={() => handleSwitchTrack('procedural-brownnoise')}><i className="fa-solid fa-sliders" aria-hidden="true" /> Hujan (Sintesis)</button>
                            <button type="button" className={`audio-track ${currentTrack === 'procedural-ocean' ? 'active' : ''}`} style={{ borderColor: 'var(--gold-main)', background: 'rgba(212,175,55,0.1)' }} onClick={() => handleSwitchTrack('procedural-ocean')}><i className="fa-solid fa-water" aria-hidden="true" /> Ombak (Sintesis)</button>
                            <button type="button" className={`audio-track ${currentTrack === 'procedural-space' ? 'active' : ''}`} style={{ borderColor: 'var(--gold-main)', background: 'rgba(212,175,55,0.1)' }} onClick={() => handleSwitchTrack('procedural-space')}><i className="fa-solid fa-sparkles" aria-hidden="true" /> Harmoni (Sintesis)</button>
                            <button type="button" className={`audio-track ${currentTrack === 'procedural-wind' ? 'active' : ''}`} style={{ borderColor: 'var(--gold-main)', background: 'rgba(212,175,55,0.1)' }} onClick={() => handleSwitchTrack('procedural-wind')}><i className="fa-solid fa-wind" aria-hidden="true" /> Angin (Sintesis)</button>
                            <button type="button" className={`audio-track ${currentTrack === 'procedural-binaural' ? 'active' : ''}`} style={{ borderColor: 'var(--gold-main)', background: 'rgba(212,175,55,0.1)' }} onClick={() => handleSwitchTrack('procedural-binaural')}><i className="fa-solid fa-wave-square" aria-hidden="true" /> Gelombang Alfa</button>

                            <div style={{ width: '100%', height: '5px' }}></div>
                            <button type="button" className="audio-track" onClick={() => handleSwitchTrack('none')} style={{ borderColor: '#ef4444', color: '#ef4444', fontWeight: 'bold' }}><i className="fa-solid fa-volume-xmark" aria-hidden="true"></i> {copy.muteAll}</button>
                        </div>

                        <div className={`journal-panel ${journalPanelOpen ? 'open' : ''}`} role={journalPanelOpen ? "dialog" : undefined} aria-modal={journalPanelOpen || undefined} aria-labelledby="kontemplasiJournalTitle">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 id="kontemplasiJournalTitle" style={{ fontFamily: "'Playfair Display', serif", color: "var(--gold-main, #d4af37)", margin: 0 }}>{copy.journalTitle}</h2>
                                <button type="button" onClick={() => setJournalPanelOpen(false)} aria-label={copy.closeJournal} style={{ minWidth: 44, minHeight: 44, background: 'transparent', border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))', borderRadius: 10, color: 'var(--text-primary)', fontSize: '1.3rem', cursor: 'pointer' }}>&times;</button>
                            </div>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>{copy.journalSub}</p>

                            <form className="journal-form" onSubmit={submitJournal}>
                                <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={copy.placeholder}></textarea>
                                <select value={newMood} onChange={(e) => setNewMood(e.target.value)}>
                                    <option value="Netral">Netral / Tenang</option>
                                    <option value="Damai">Damai & Sejuk</option>
                                    <option value="Bersyukur">Penuh Rasa Syukur</option>
                                    <option value="Gelisah">Gelisah / Cemas</option>
                                </select>
                                <button type="submit" style={{ width: '100%', minHeight: 46, padding: '14px', background: '#d4af37', color: '#060b14', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{copy.saveEntry}</button>
                            </form>

                            <div style={{ marginTop: '30px', overflowY: 'auto', flex: 1 }}>
                                {journals.map(j => (
                                    <div key={j.id} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                            <span>{new Date(j.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'id-ID')}</span>
                                            <span>{j.mood}</span>
                                        </div>
                                        <div style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-primary)' }}>&ldquo;{j.content}&rdquo;</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <audio id="audio-rain" loop preload="none"><source src="/assets/audio/rain.m4a" type="audio/mp4" /></audio>
                        <audio id="audio-ocean" loop preload="none"><source src="/assets/audio/ocean.m4a" type="audio/mp4" /></audio>
                        <audio id="audio-space" loop preload="none"><source src="/assets/audio/space.m4a" type="audio/mp4" /></audio>
                        <audio id="audio-zen" loop preload="none"><source src="/assets/audio/zen.m4a" type="audio/mp4" /></audio>
                        <audio id="audio-quran" loop preload="none"><source src="https://server8.mp3quran.net/afs/055.mp3?v=3" type="audio/mpeg" /></audio>

                    </div>
                );
            }
