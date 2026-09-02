"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";
import ThemeToggle from "@/components/layout/ThemeToggle";
import "./kontemplasi.css";

export default function KontemplasiClient({ initialJournals, userId }: { initialJournals: any[], userId: string }) {
  const [journals, setJournals] = useState(initialJournals);
  const [isStarted, setIsStarted] = useState(false);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [journalPanelOpen, setJournalPanelOpen] = useState(false);
  
  const [newContent, setNewContent] = useState("");
  const [newMood, setNewMood] = useState("Netral");
  const [isPrivate, setIsPrivate] = useState(true);

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
      // Setup Web Audio on unmount
      return () => {
          stopProceduralAudio();
          if (breathCycleRef.current) clearTimeout(breathCycleRef.current);
          if (wisdomCycleRef.current) clearTimeout(wisdomCycleRef.current);
      };
  }, []);

  useEffect(() => {
      if (isStarted && dustContainerRef.current) {
          // Generate Cosmic Dust
          const dustContainer = dustContainerRef.current;
          dustContainer.innerHTML = ''; // clear if any
          for(let i=0; i<30; i++) {
              let dust = document.createElement('div');
              dust.classList.add('dust');
              let size = Math.random() * 2 + 1;
              dust.style.width = size + 'px';
              dust.style.height = size + 'px';
              dust.style.left = Math.random() * 100 + 'vw';
              dust.style.top = Math.random() * 100 + 'vh';
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

          // Start Breathing Cycle
          const breathCycle = () => {
              // 1. INHALE (4s)
              setBreathOpacity(0);
              setTimeout(() => { setBreathText("Tarik Napas"); setBreathOpacity(1); }, 500);
              setOrbState('orb-inhale');

              // 2. HOLD (7s)
              setTimeout(() => {
                  setBreathOpacity(0);
                  setTimeout(() => { setBreathText("Tahan"); setBreathOpacity(1); }, 500);
                  setOrbState('orb-hold');
              }, 4000);

              // 3. EXHALE (8s)
              setTimeout(() => {
                  setBreathOpacity(0);
                  setTimeout(() => { setBreathText("Hembuskan"); setBreathOpacity(1); }, 500);
                  setOrbState('orb-exhale');
                  
                  // Restart cycle
                  breathCycleRef.current = setTimeout(breathCycle, 8000);
              }, 11000);
          };
          
          // Delay start of breathing cycle slightly
          breathCycleRef.current = setTimeout(breathCycle, 1500);

          // Wisdom Quotes
          const wisdoms = [
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
                  { opacity: 1, y: 0, duration: 3, ease: "power2.out", onComplete: () => {
                      gsap.to(wisdomRef.current, { opacity: 0, y: -30, duration: 3, delay: 6, onComplete: () => {
                          wisdomCycleRef.current = setTimeout(showWisdom, Math.random() * 12000 + 8000);
                      }});
                  }}
              );
          };
          wisdomCycleRef.current = setTimeout(showWisdom, 6000);
      }
  }, [isStarted]);

  const stopProceduralAudio = () => {
    if (audioCtxRef.current && nodesRef.current.length > 0) {
        nodesRef.current.forEach(node => {
            if (node.gain) {
                node.gain.linearRampToValueAtTime(0, audioCtxRef.current!.currentTime + 1);
            }
            setTimeout(() => {
                if (node.stop) { try { node.stop(); } catch(e) {} }
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
          if(aud) {
              aud.volume = 0;
              const p = aud.play();
              if(p !== undefined) {
                  p.then(() => {
                      if (key !== 'rain') aud.pause(); // Let 'rain' continue playing since it's the auto-start track
                  }).catch(e => console.log("Unlock HTML5 Audio:", e));
              }
          }
      });

      setIsStarted(true);
      gsap.to(".start-overlay", { opacity: 0, duration: 2, onComplete: () => {
          document.querySelector('.start-overlay')?.classList.add('hidden');
      }});

      // Auto-start rain track like in CI4 after fade out
      setTimeout(() => {
          handleSwitchTrack('rain');
      }, 1500);
  };

  const submitJournal = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newContent) return;
      
      const { data, error } = await supabase.from('kontemplasi_journals').insert([
          { user_id: userId, content: newContent, mood: newMood, is_private: isPrivate }
      ]).select();
      
      if(!error && data) {
          setJournals([data[0], ...journals]);
          setNewContent("");
      }
  };

  const handleSwitchTrack = (trackKey: string) => {
      if (currentTrack === trackKey) return;

      stopProceduralAudio();

      // Pause all HTML5 audios slowly except the new one
      ['rain', 'ocean', 'space', 'zen', 'quran'].forEach(key => {
          if (key === trackKey) return;
          const aud = document.getElementById('audio-' + key) as HTMLMediaElement;
          if (aud) {
              gsap.to(aud, {volume: 0, duration: 1, onComplete: () => { aud.pause(); }});
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
                  p.then(() => gsap.to(newAudio, {volume: 0.8, duration: 2})).catch(e => console.log(e));
              }
          }
      }
  };

  return (
    <div className="sanctuary-wrapper">

      <Link href="/fitur" className="btn-top-back">
        <i className="fa-solid fa-arrow-left"></i> Kembali
      </Link>

      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}>
          <ThemeToggle />
      </div>

      {!isStarted && (
        <div className="start-overlay">
            <h1 className="start-title">Ruang Kontemplasi</h1>
            <p className="start-desc">Tinggalkan sejenak urusan duniawi. Posisikan diri Anda dengan nyaman, aktifkan suara, dan ikuti ritme keheningan.</p>
            <button className="btn-start" onClick={handleStart}>Mulai Keheningan</button>
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
          <button className="stealth-btn" onClick={() => setAudioMenuOpen(!audioMenuOpen)}>
              <i className="fa-solid fa-music"></i>
              <span>Atur Suara</span>
          </button>
          <button className="stealth-btn" onClick={() => setJournalPanelOpen(!journalPanelOpen)}>
              <i className="fa-solid fa-feather-pointed"></i>
              <span>Buka Jurnal</span>
          </button>
      </div>

      <div className={`audio-menu ${audioMenuOpen ? 'show' : ''}`}>
          <div style={{ width: '100%', textAlign: 'center', color: 'var(--gold-main)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '3px', margin: '5px 0', opacity: 0.7 }}>— AUDIO KLASIK (MP4 MEDIA) —</div>
          <button className={`audio-track ${currentTrack === 'rain' ? 'active' : ''}`} onClick={() => handleSwitchTrack('rain')}>🌧️ Hujan Deras</button>
          <button className={`audio-track ${currentTrack === 'ocean' ? 'active' : ''}`} onClick={() => handleSwitchTrack('ocean')}>🌊 Ombak Samudra</button>
          <button className={`audio-track ${currentTrack === 'space' ? 'active' : ''}`} onClick={() => handleSwitchTrack('space')}>🌌 Ruang Angkasa</button>
          <button className={`audio-track ${currentTrack === 'zen' ? 'active' : ''}`} onClick={() => handleSwitchTrack('zen')}>🍃 Angin Gurun</button>
          <button className={`audio-track ${currentTrack === 'quran' ? 'active' : ''}`} onClick={() => handleSwitchTrack('quran')}>📖 Ar-Rahman</button>
          
          <div style={{ width: '100%', textAlign: 'center', color: 'var(--gold-main)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '3px', marginTop: '10px', opacity: 0.7 }}>— SINTESIS AI (100% OFFLINE CPU) —</div>
          <button className={`audio-track ${currentTrack === 'procedural-brownnoise' ? 'active' : ''}`} style={{ borderColor: 'var(--gold-main)', background: 'rgba(212,175,55,0.1)' }} onClick={() => handleSwitchTrack('procedural-brownnoise')}>💻 Hujan (Sintesis)</button>
          <button className={`audio-track ${currentTrack === 'procedural-ocean' ? 'active' : ''}`} style={{ borderColor: 'var(--gold-main)', background: 'rgba(212,175,55,0.1)' }} onClick={() => handleSwitchTrack('procedural-ocean')}>🌊 Ombak (Sintesis)</button>
          <button className={`audio-track ${currentTrack === 'procedural-space' ? 'active' : ''}`} style={{ borderColor: 'var(--gold-main)', background: 'rgba(212,175,55,0.1)' }} onClick={() => handleSwitchTrack('procedural-space')}>🌌 Angkasa (Sintesis)</button>
          <button className={`audio-track ${currentTrack === 'procedural-wind' ? 'active' : ''}`} style={{ borderColor: 'var(--gold-main)', background: 'rgba(212,175,55,0.1)' }} onClick={() => handleSwitchTrack('procedural-wind')}>🍃 Angin (Sintesis)</button>
          <button className={`audio-track ${currentTrack === 'procedural-binaural' ? 'active' : ''}`} style={{ borderColor: 'var(--gold-main)', background: 'rgba(212,175,55,0.1)' }} onClick={() => handleSwitchTrack('procedural-binaural')}>🧠 Binaural Beats</button>

          <div style={{ width: '100%', height: '5px' }}></div>
          <button className="audio-track" onClick={() => handleSwitchTrack('none')} style={{ borderColor: '#ff4444', color: '#ff4444', fontWeight: 'bold' }}><i className="fa-solid fa-volume-xmark"></i> Heningkan Semua</button>
      </div>

      <div className={`journal-panel ${journalPanelOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--gold-main, #d4af37)", margin: 0 }}>The Codex</h2>
              <button onClick={() => setJournalPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Rekam jejak spiritual dan pikiran Anda di sini.</p>
          
          <form className="journal-form" onSubmit={submitJournal}>
              <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Apa yang sedang Anda renungkan hari ini?"></textarea>
              <select value={newMood} onChange={(e) => setNewMood(e.target.value)}>
                  <option value="Netral">Netral / Tenang</option>
                  <option value="Damai">Damai & Sejuk</option>
                  <option value="Bersyukur">Penuh Rasa Syukur</option>
                  <option value="Gelisah">Gelisah / Cemas</option>
              </select>
              <button type="submit" style={{ width: '100%', padding: '15px', background: '#d4af37', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>REKAM JEJAK</button>
          </form>

          <div style={{ marginTop: '30px', overflowY: 'auto', flex: 1 }}>
              {journals.map(j => (
                  <div key={j.id} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                          <span>{new Date(j.created_at).toLocaleDateString('id-ID')}</span>
                          <span>{j.mood}</span>
                      </div>
                      <div style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-primary)' }}>"{j.content}"</div>
                  </div>
              ))}
          </div>
      </div>

      <video id="audio-rain" loop preload="auto" playsInline style={{ display: 'none' }}><source src="/assets/audio/rain.mp4" type="video/mp4" /></video>
      <video id="audio-ocean" loop preload="auto" playsInline style={{ display: 'none' }}><source src="/assets/audio/ocean.mp4" type="video/mp4" /></video>
      <video id="audio-space" loop preload="auto" playsInline style={{ display: 'none' }}><source src="/assets/audio/space.mp4" type="video/mp4" /></video>
      <video id="audio-zen" loop preload="auto" playsInline style={{ display: 'none' }}><source src="/assets/audio/zen.mp4" type="video/mp4" /></video>
      <audio id="audio-quran" loop preload="auto"><source src="https://server8.mp3quran.net/afs/055.mp3?v=3" type="audio/mpeg" /></audio>

    </div>
  );
}
