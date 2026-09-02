"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/layout/AegisConfirm";
import AgoraRTC, {
  AgoraRTCProvider,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  LocalVideoTrack,
  RemoteUser,
} from "agora-rtc-react";
import "./majlis.css";

// 1. Inisialisasi Agora Client (hanya di browser)
const agoraClient = typeof window !== "undefined"
  ? AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
  : (null as any);

// Wrapper agar context Agora tersedia untuk hooks
export default function MajlisWrapper(props: { currentUser: any, initialTopics: any[] }) {
  return (
    <AgoraRTCProvider client={agoraClient}>
      <MajlisClient {...props} />
    </AgoraRTCProvider>
  );
}

function MajlisClient({ currentUser, initialTopics }: { currentUser: any, initialTopics: any[] }) {
  const [topics, setTopics] = useState(initialTopics);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<any | null>(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [handsRaised, setHandsRaised] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const channelRef = useRef<any>(null);
  // Ref untuk activeSpeaker agar closure di dalam presence callback selalu up-to-date
  const activeSpeakerRef = useRef<any>(null);
  // Timestamp terakhir kali broadcast set_speaker dikirim/diterima
  // Digunakan untuk mencegah presence sync menimpa state dari broadcast (race condition)
  const lastBroadcastTimeRef = useRef<number>(0);
  
  const supabase = createClient();
  const { showAlert } = useConfirm();

  // Inject body class saat page Majlis aktif (untuk override CSS .main-wrapper)
  useEffect(() => {
    document.body.classList.add('page-majlis');
    return () => {
      document.body.classList.remove('page-majlis');
    };
  }, []);

  // ==========================================
  // AGORA RTC LOGIC
  // ==========================================
  const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
  const channelName = "majlis_main_room";
  const [agoraToken, setAgoraToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgoraToken() {
      try {
        const res = await fetch(
          `/api/agora/token?channel=${channelName}&uid=${encodeURIComponent(currentUser?.id || "")}`
        );
        const json = await res.json();
        if (json.status === "success" && json.data?.token) {
          setAgoraToken(json.data.token);
        }
      } catch (err) {
        console.error("Failed to fetch Agora token:", err);
      }
    }
    fetchAgoraToken();
  }, [channelName, currentUser?.id]);
  
  // Join Channel
  useJoin(
    {
      appid: APP_ID,
      channel: channelName,
      token: agoraToken,
      uid: currentUser?.id,
    },
    APP_ID !== "" && agoraToken !== null // Hanya join jika APP_ID ada & token sudah siap
  );

  // Akses Microphone & Camera Lokal
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isMicActive);
  const { localCameraTrack } = useLocalCameraTrack(isVideoActive);

  // Selalu pastikan mic dan kamera tetap enabled/disabled sesuai state
  useEffect(() => {
    if (isMicActive && localMicrophoneTrack) {
      try {
        localMicrophoneTrack.setEnabled(true);
        localMicrophoneTrack.setMuted(false);
      } catch (e) {
        console.warn("Gagal memastikan mic aktif:", e);
      }
    }
    if (isVideoActive && localCameraTrack) {
      try {
        localCameraTrack.setEnabled(true);
        localCameraTrack.setMuted(false);
      } catch (e) {
        console.warn("Gagal memastikan kamera aktif:", e);
      }
    }
  }, [isMicActive, isVideoActive, localMicrophoneTrack, localCameraTrack]);

  // === FORCE STOP: Paksa hentikan dan unpublish track lokal ===
  // Dipanggil ketika user diturunkan dari podium oleh admin
  const forceStopLocalTracks = () => {
    try {
      // Unpublish semua track dari Agora channel secara langsung
      if (agoraClient) {
        const publishedTracks: any[] = [];
        if (localMicrophoneTrack) publishedTracks.push(localMicrophoneTrack);
        if (localCameraTrack) publishedTracks.push(localCameraTrack);
        if (publishedTracks.length > 0) {
          agoraClient.unpublish(publishedTracks).catch(() => {});
        }
      }
      // Disable track agar hardware berhenti
      if (localMicrophoneTrack) {
        try { localMicrophoneTrack.setEnabled(false); } catch (e) {}
      }
      if (localCameraTrack) {
        try { localCameraTrack.setEnabled(false); } catch (e) {}
      }
    } catch (e) {
      console.warn("forceStopLocalTracks error:", e);
    }
  };

  // Publish tracks - TANPA guard readyToPublish agar unpublish selalu berjalan
  const tracksToPublish = useMemo(() => {
    const tracks: any[] = [];
    if (isMicActive && localMicrophoneTrack) tracks.push(localMicrophoneTrack);
    if (isMicActive && isVideoActive && localCameraTrack) tracks.push(localCameraTrack);
    return tracks;
  }, [isMicActive, localMicrophoneTrack, isVideoActive, localCameraTrack]);
  usePublish(tracksToPublish);

  // Menerima remote users dari Agora channel
  const remoteUsers = useRemoteUsers();

  // Cari remote user yang cocok dengan pembicara aktif
  // Agora UID = string user account (Supabase UUID)
  const speakerRemoteUser = useMemo(() => {
    if (!activeSpeaker || !activeSpeaker.id) return null;
    // Jangan cari remote user jika pembicara adalah diri sendiri
    if (String(activeSpeaker.id).toLowerCase().trim() === String(currentUser?.id).toLowerCase().trim()) return null;
    return remoteUsers.find(u => 
      String(u.uid).toLowerCase().trim() === String(activeSpeaker.id).toLowerCase().trim()
    ) || null;
  }, [remoteUsers, activeSpeaker, currentUser?.id]);

  // Status Video & Audio
  const isLocalSpeaker = Boolean(activeSpeaker && String(activeSpeaker.id).toLowerCase().trim() === String(currentUser?.id).toLowerCase().trim());
  const isRemoteVideoActive = Boolean(!isLocalSpeaker && speakerRemoteUser && (speakerRemoteUser.hasVideo || speakerRemoteUser.videoTrack));
  const hasLocalVideo = Boolean(isLocalSpeaker && isVideoActive && localCameraTrack);
  const hasRemoteVideo = Boolean(!isLocalSpeaker && isRemoteVideoActive && speakerRemoteUser);
  const isVideoVisible = hasLocalVideo || hasRemoteVideo;

  // HANYA PUTAR SUARA DARI PEMBICARA AKTIF (Menghilangkan bentrokan suara antar pendengar)
  useEffect(() => {
    if (!speakerRemoteUser || isLocalSpeaker) return;

    const track = speakerRemoteUser.audioTrack;
    if (track) {
      try {
        if (!track.isPlaying) {
          track.play();
        }
      } catch (e) {
        console.warn("Gagal memutar audio pembicara aktif:", e);
      }
    }

    return () => {
      if (track && track.isPlaying) {
        try {
          track.stop();
        } catch (e) {}
      }
    };
  }, [speakerRemoteUser, isLocalSpeaker, speakerRemoteUser?.audioTrack]);

  // ==========================================================================
  // REALTIME PRESENCE & BROADCAST
  // ==========================================================================
  useEffect(() => {
    // Initial Intro Animation
    const tl = gsap.timeline();
    tl.fromTo(".majlis-header", 
        { y: -50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      )
      .fromTo(".center-stage", 
        { scale: 0.8, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 1.5, ease: "elastic.out(1, 0.5)" }, 
        "-=0.5"
      )
      .fromTo(".control-dock", 
        { y: 100, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1, ease: "back.out(1.5)" }, 
        "-=1"
      );

    // Realtime Presence using Supabase
    const channel = supabase.channel('majlis-presence', {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).map((u: any) => u[0]);
        setOnlineUsers(users);
        
        // PENTING: Jangan biarkan presence sync menimpa state speaker
        // yang baru saja di-set oleh broadcast (race condition prevention).
        // Presence sync bersifat eventually-consistent dan bisa terlambat 1-3 detik.
        const timeSinceLastBroadcast = Date.now() - lastBroadcastTimeRef.current;
        if (timeSinceLastBroadcast < 5000) {
          // Broadcast baru saja terjadi, jangan sync speaker dari presence
          return;
        }

        // Sync speaker HANYA untuk late joiners (pengguna yang baru masuk)
        const currentSpeaker = users.find(u => u.isSpeaking);
        const currentActiveSpeaker = activeSpeakerRef.current;
        if (currentSpeaker) {
           setActiveSpeaker(currentSpeaker);
           activeSpeakerRef.current = currentSpeaker;
        } else if (currentActiveSpeaker && !users.find(u => u.id === currentActiveSpeaker.id)) {
           // Jika pembicara aktif tiba-tiba terputus dari presence
           setActiveSpeaker(null);
           activeSpeakerRef.current = null;
        }
      })
      .on('broadcast', { event: 'raise_hand' }, (payload) => {
        setHandsRaised(prev => {
           if (prev.find(u => u.id === payload.payload.id)) return prev;
           return [...prev, payload.payload];
        });
      })
      .on('broadcast', { event: 'cancel_hand' }, (payload) => {
        setHandsRaised(prev => prev.filter(u => u.id !== payload.payload.id));
      })
      .on('broadcast', { event: 'set_speaker' }, (payload) => {
        const newSpeaker = payload.payload;
        lastBroadcastTimeRef.current = Date.now();
        const amINewSpeaker = newSpeaker && newSpeaker.id === currentUser.id;

        // KRITIS: Jika saya BUKAN pembicara baru, PAKSA hentikan semua track
        // sebelum mengubah state React (agar unpublish terjadi segera)
        if (!amINewSpeaker) {
          forceStopLocalTracks();
        }

        setActiveSpeaker(newSpeaker);
        activeSpeakerRef.current = newSpeaker;
        setIsVideoActive(false);
        if (amINewSpeaker) {
           setIsMicActive(true);
        } else {
           setIsMicActive(false);
        }
        if (newSpeaker) {
           setHandsRaised(prev => prev.filter(u => u.id !== newSpeaker.id));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
            avatar: currentUser.avatar,
            isSpeaking: false
          });
        }
      });

    channelRef.current = channel;

    // Realtime Topics Updates
    const topicsChannel = supabase.channel('majlis_topics_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'majlis_topics' }, async () => {
            await refreshTopics();
        })
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(topicsChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Presence state when microphone state changes
  useEffect(() => {
    if (channelRef.current && isMicActive !== undefined) {
      try {
        channelRef.current.track({
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          avatar: currentUser.avatar,
          isSpeaking: isMicActive
        });
      } catch (e) {
        console.error("Gagal update presence state", e);
      }
    }
  }, [isMicActive, currentUser]);

  useEffect(() => {
    let talkingInterval: NodeJS.Timeout | null = null;
    const speakerOrb = document.getElementById('activeSpeakerElement');

    if (activeSpeaker && speakerOrb) {
        talkingInterval = setInterval(() => {
            const ring = document.createElement('div');
            ring.classList.add('audio-ring');
            speakerOrb.appendChild(ring);
            const sizeStart = 180;
            const sizeEnd = 180 + (Math.random() * 150 + 50);
            gsap.fromTo(ring, 
                { width: sizeStart, height: sizeStart, opacity: 0.8 },
                { 
                    width: sizeEnd, height: sizeEnd, opacity: 0, 
                    duration: Math.random() * 1.5 + 1.5, 
                    ease: "power2.out",
                    onComplete: () => ring.remove()
                }
            );
        }, 600);
    }

    return () => {
        if (talkingInterval) clearInterval(talkingInterval);
        document.querySelectorAll('.audio-ring').forEach(r => r.remove());
    };
  }, [activeSpeaker]);

  const refreshTopics = async () => {
    try {
      const res = await fetch('/api/majlis');
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setTopics(json.data);
      }
    } catch (e) {
      console.error("Gagal refresh topics:", e);
    }
  };

  const isHandRaised = handsRaised.some(u => u.id === currentUser.id);

  const handleRaiseHandToggle = async () => {
    if (channelRef.current) {
      if (isHandRaised) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'cancel_hand',
          payload: { id: currentUser.id }
        });
        setHandsRaised(prev => prev.filter(u => u.id !== currentUser.id));
        await showAlert("Info", "Angkat tangan telah dibatalkan.");
      } else {
        channelRef.current.send({
          type: 'broadcast',
          event: 'raise_hand',
          payload: currentUser
        });
        setHandsRaised(prev => {
          if (prev.find(u => u.id === currentUser.id)) return prev;
          return [...prev, currentUser];
        });
        await showAlert("Info", "Permintaan bicara (Raise Hand) terkirim. Menunggu persetujuan Admin.");
      }
    } else {
      await showAlert("Peringatan", "Koneksi ke ruangan belum terhubung. Silakan coba beberapa detik lagi.");
    }
  };

  // ============ SPEAKER PERMISSIONS ============
  // HANYA ADMIN yang berhak mengangkat atau menghentikan pembicara!
  // Member biasa sama sekali TIDAK BISA menghentikan atau mengubah pembicara.
  const handleSetSpeaker = (userToSpeak: any | null) => {
    if (currentUser.role !== 'admin') {
      showAlert("Akses Ditolak", "Hanya Pimpinan Sidang (Admin) yang berhak mengatur dan menghentikan pembicara.");
      return;
    }

    if (!channelRef.current) {
      showAlert("Peringatan", "Koneksi ke ruangan belum terhubung. Silakan coba beberapa detik lagi.");
      return;
    }

    // Tandai waktu broadcast dikirim (mencegah presence sync menimpa)
    lastBroadcastTimeRef.current = Date.now();

    // Broadcast perubahan speaker ke semua peserta
    channelRef.current.send({
      type: 'broadcast',
      event: 'set_speaker',
      payload: userToSpeak
    });

    // Update state lokal
    setActiveSpeaker(userToSpeak);
    activeSpeakerRef.current = userToSpeak;
    setIsVideoActive(false);
    setIsMicActive(userToSpeak?.id === currentUser.id);
    if (userToSpeak) {
      setHandsRaised(prev => prev.filter(u => u.id !== userToSpeak.id));
    }
  };

  // ============ MIC BUTTON LOGIC ============
  // Admin: Mengambil alih podium atau menghentikan sesi pembicara
  // Non-admin: Mengajukan permintaan bicara (Raise Hand) ke Admin
  const handleMicToggle = async () => {
    if (currentUser.role === 'admin') {
      if (isMicActive) {
        // Admin menghentikan sesi podium
        handleSetSpeaker(null);
      } else {
        // Admin mengambil alih podium
        handleSetSpeaker(currentUser);
      }
      return;
    }

    // Untuk Member Biasa:
    if (isMicActive) {
      // Member adalah pembicara aktif dan tidak bisa menghentikan sesi sendiri (hanya admin)
      await showAlert("Informasi", "Sesi bicara Anda sedang berlangsung. Hanya Pimpinan Sidang (Admin) yang berhak menghentikan sesi podium.");
      return;
    }

    // Member meminta izin bicara:
    if (!isHandRaised) {
      await handleRaiseHandToggle();
    } else {
      await showAlert("Info", "Permintaan bicara Anda telah diajukan. Harap tunggu persetujuan Pimpinan Sidang.");
    }
  };

  // ============ CAMERA TOGGLE ============
  // Hanya bisa digunakan jika mic sedang aktif (sedang jadi pembicara)
  const handleCameraToggle = () => {
    if (!isMicActive) {
      showAlert("Peringatan", "Anda harus menjadi pembicara aktif terlebih dahulu sebelum bisa menyalakan kamera.");
      return;
    }

    // Jika sedang menyala dan akan dimatikan, matikan fisik kamera terlebih dahulu
    // agar hardware (lampu indikator kamera) langsung mati.
    if (isVideoActive && localCameraTrack) {
      try {
        localCameraTrack.setEnabled(false);
      } catch (e) {
        console.warn("Gagal menonaktifkan kamera fisik:", e);
      }
    }

    setIsVideoActive(prev => !prev);
  };

  const createTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicTitle.trim().length < 5) {
        await showAlert("Peringatan", "Judul mosi minimal 5 karakter.");
        return;
    }
    if (newTopicDesc.trim().length < 10) {
        await showAlert("Peringatan", "Deskripsi mosi minimal 10 karakter.");
        return;
    }

    setIsSubmitting(true);
    try {
        const res = await fetch('/api/majlis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create_topic',
                title: newTopicTitle.trim(),
                description: newTopicDesc.trim()
            })
        });
        const json = await res.json();

        if (json.status !== 'success') {
            await showAlert("Gagal", json.message || "Gagal mengajukan mosi.");
            return;
        }

        await showAlert("Berhasil", "Mosi berhasil diajukan ke forum.");
        setNewTopicTitle("");
        setNewTopicDesc("");
        if (json.data) {
            setTopics(prev => [json.data, ...prev]);
        }
    } catch (err: any) {
        await showAlert("Gagal", "Terjadi kesalahan: " + err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const voteTopic = async (topicId: string, voteType: string) => {
    if (!['Setuju', 'Tidak Setuju'].includes(voteType)) return;

    try {
        const res = await fetch('/api/majlis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'vote',
                topic_id: topicId,
                vote_type: voteType
            })
        });
        const json = await res.json();

        if (json.status !== 'success') {
            await showAlert(json.status === 'error' && json.message?.includes('sudah') ? "Peringatan" : "Gagal", json.message || "Gagal merekam suara.");
            return;
        }

        setTopics(prev => prev.map(t => {
            if (t.id === topicId) {
                return {
                    ...t, 
                    has_voted: true,
                    votes_setuju: json.data?.votes_setuju ?? (voteType === 'Setuju' ? (t.votes_setuju || 0) + 1 : (t.votes_setuju || 0)),
                    votes_tidak_setuju: json.data?.votes_tidak_setuju ?? (voteType === 'Tidak Setuju' ? (t.votes_tidak_setuju || 0) + 1 : (t.votes_tidak_setuju || 0))
                };
            }
            return t;
        }));
    } catch (err: any) {
        await showAlert("Gagal", "Terjadi kesalahan: " + err.message);
    }
  };

  const closeTopic = async (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    if (topic.created_by !== currentUser.id && currentUser.role !== 'admin') {
        await showAlert("Akses Ditolak", "Hanya pembuat mosi atau admin yang dapat menutup voting.");
        return;
    }

    try {
        const res = await fetch('/api/majlis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'close_topic',
                topic_id: topicId
            })
        });
        const json = await res.json();

        if (json.status !== 'success') {
            await showAlert("Gagal", json.message || "Gagal menutup sesi voting.");
            return;
        }

        setTopics(prev => prev.map(t => t.id === topicId ? {...t, status: 'Closed'} : t));
    } catch (err: any) {
        await showAlert("Gagal", "Terjadi kesalahan: " + err.message);
    }
  };

  return (
    <div className="majlis-page-wrapper">
      <div className="majlis-wrapper">
        <div className="bg-wave"></div>
        <div className="bg-wave"></div>

        <header className="majlis-header">
            <Link href="/fitur" className="btn-back">
                <i className="fa-solid fa-chevron-left"></i> Kembali ke Vault
            </Link>
            <div className="room-info">
                <h1 className="room-title">Majlis Syura Utama</h1>
                <div className="room-status">
                    <span className="status-dot"></span> <span>{onlineUsers.length}</span> Kolega Hadir
                    {!APP_ID && <span style={{ color: '#ff3366', marginLeft: '10px', fontSize: '0.65rem' }}>[AGORA ID MISSING]</span>}
                </div>
            </div>
        </header>

        <div className="center-stage">
            <div id="activeSpeakerElement" className="speaker-orb" style={{
              backgroundImage: activeSpeaker && !isVideoVisible && activeSpeaker.avatar
                ? `url(${activeSpeaker.avatar})`
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
                {/* Tidak ada pembicara aktif */}
                {!activeSpeaker && <i className="fa-solid fa-microphone-slash"></i>}

                {/* LOCAL VIDEO: Pembicara melihat preview kamera sendiri */}
                {hasLocalVideo && localCameraTrack && (
                   <LocalVideoTrack
                     track={localCameraTrack}
                     play={true}
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                   />
                )}

                {/* REMOTE VIDEO: Pendengar melihat video kamera pembicara */}
                {hasRemoteVideo && speakerRemoteUser && (
                   <RemoteUser
                     user={speakerRemoteUser}
                     playVideo={true}
                     playAudio={false}
                     videoPlayerConfig={{ fit: "cover" }}
                     style={{
                       width: '100%',
                       height: '100%',
                       objectFit: 'cover',
                       position: 'absolute',
                       inset: 0,
                     }}
                   />
                )}

                {/* Indikator mic aktif saat hanya audio (tanpa video kamera) */}
                {activeSpeaker && !isVideoVisible && (
                  <div className="mic-active-indicator" style={{
                    position: 'absolute', bottom: 8, right: 8, zIndex: 20,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,200,80,0.85)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(0,200,80,0.5)',
                  }}>
                    <i className="fa-solid fa-microphone" style={{ fontSize: '0.7rem', color: '#fff' }}></i>
                  </div>
                )}
            </div>
            <div className="speaker-info">
                <h2 className="speaker-name">{activeSpeaker ? activeSpeaker.name : 'Ruangan Terbuka'}</h2>
                <p className="speaker-role">{activeSpeaker ? (activeSpeaker.role === 'admin' ? 'Pimpinan Sidang' : 'Peserta Majlis') : 'Tidak ada pembicara saat ini'}</p>
            </div>

            {/* Tombol Hentikan Pembicara di Panggung - HANYA UNTUK ADMIN */}
            {currentUser.role === 'admin' && activeSpeaker && (
                <button onClick={() => handleSetSpeaker(null)} className="btn-stop-speaker">
                    <i className="fa-solid fa-microphone-slash"></i> {activeSpeaker.id === currentUser.id ? 'Turun dari Podium' : 'Hentikan Pembicara'}
                </button>
            )}
        </div>

        <div className="listeners-container">
            {onlineUsers
                .filter(user => !activeSpeaker || user.id !== activeSpeaker.id)
                .map(user => (
                <div className="listener-node" key={user.id}>
                    <div className="listener-avatar" style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : 'none' }}></div>
                    <span className="listener-name">{user.name}</span>
                </div>
            ))}
        </div>

        <div className="control-dock">
            {/* Tombol Antrean Permintaan Bicara - HANYA UNTUK ADMIN */}
            {currentUser.role === 'admin' && (
                <button className={`ctrl-btn ${handsRaised.length > 0 ? 'has-badge' : ''}`} 
                    onClick={() => setPanelOpen(!panelOpen)} 
                    title="Daftar Permintaan Bicara"
                    data-badge={handsRaised.length > 0 ? handsRaised.length : ''}>
                    <i className="fa-solid fa-clipboard-list"></i>
                    {handsRaised.length > 0 && <span className="badge-count">{handsRaised.length}</span>}
                </button>
            )}

            {/* Tombol Angkat Tangan - HANYA UNTUK MEMBER BIASA yang bukan pembicara */}
            {currentUser.role !== 'admin' && !isMicActive && (
              <button className={`ctrl-btn ${isHandRaised ? 'active' : ''}`} onClick={handleRaiseHandToggle} title={isHandRaised ? "Batalkan Angkat Tangan" : "Angkat Tangan (Minta Izin Bicara)"}>
                  <i className="fa-solid fa-hand"></i>
              </button>
            )}

            {/* Tombol Mic:
               - Admin: Langsung ambil alih podium / hentikan podium
               - Non-admin: Minta izin bicara (raise hand)
            */}
            <button className={`ctrl-btn danger ${isMicActive ? 'active' : ''}`} onClick={handleMicToggle} title={
              currentUser.role === 'admin' 
                ? (isMicActive ? "Hentikan Podium" : "Ambil Alih Podium")
                : (isMicActive ? "Mikrofon Aktif (Sesi Berlangsung)" : "Minta Izin Bicara")
            }>
                <i className={`fa-solid ${isMicActive ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
            </button>

            {/* Tombol Kamera - Hanya muncul saat sedang jadi pembicara aktif */}
            {isMicActive && (
              <button className={`ctrl-btn danger ${isVideoActive ? 'active' : ''}`} onClick={handleCameraToggle} title={isVideoActive ? "Matikan Kamera" : "Nyalakan Kamera"}>
                  <i className={`fa-solid ${isVideoActive ? 'fa-video' : 'fa-video-slash'}`}></i>
              </button>
            )}

            {/* Tombol Agenda & Mosi */}
            <button className="ctrl-btn" onClick={() => setPanelOpen(!panelOpen)} title="Forum & Agenda"><i className="fa-solid fa-gavel"></i></button>
        </div>
      </div>

      <div className={`majlis-panel ${panelOpen ? 'open' : ''}`}>
          {/* Antrean Bicara & Persetujuan - HANYA UNTUK ADMIN */}
          {currentUser.role === 'admin' && handsRaised.length > 0 && (
             <div className="queue-panel">
                <h3 className="queue-title"><i className="fa-solid fa-hand"></i> Antrean Permintaan Bicara ({handsRaised.length})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                   {handsRaised.map((u) => (
                      <div key={u.id} className="queue-item">
                         <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="listener-avatar" style={{ backgroundImage: u.avatar ? `url(${u.avatar})` : 'none', width: 36, height: 36 }}></div>
                            <span className="queue-name">{u.name}</span>
                         </div>
                         <button onClick={() => handleSetSpeaker(u)} className="btn-approve">
                            <i className="fa-solid fa-check"></i> Beri Izin Bicara
                         </button>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* Tombol Hentikan Pembicara di Panel - HANYA UNTUK ADMIN */}
          {currentUser.role === 'admin' && activeSpeaker && (
             <button onClick={() => handleSetSpeaker(null)} className="btn-stop-speaker-panel">
                <i className="fa-solid fa-microphone-slash"></i> {activeSpeaker.id === currentUser.id ? 'Turun dari Podium' : 'Hentikan Pembicara Aktif'}
             </button>
          )}

          <div className="panel-header">
              <h2 className="panel-title">Ajukan Mosi Baru</h2>
              <button onClick={() => setPanelOpen(false)} className="btn-close-panel">&times;</button>
          </div>

          <form className="majlis-form" onSubmit={createTopic}>
              <input 
                type="text" 
                value={newTopicTitle} 
                onChange={(e) => setNewTopicTitle(e.target.value)} 
                placeholder="Judul Mosi (min. 5 karakter)" 
                minLength={5}
                required 
              />
              <textarea 
                rows={2} 
                value={newTopicDesc} 
                onChange={(e) => setNewTopicDesc(e.target.value)} 
                placeholder="Deskripsi landasan masalah... (min. 10 karakter)" 
                minLength={10}
                required
              ></textarea>
              <button type="submit" className="btn-submit-majlis" disabled={isSubmitting}>
                {isSubmitting ? "Mengajukan..." : "Ajukan ke Forum"}
              </button>
          </form>

          <h2 className="panel-section-title">Daftar Agenda</h2>
          <div>
              {topics.length === 0 && (
                <div className="topics-empty">Belum ada mosi yang diajukan.</div>
              )}
              {topics.map(t => (
                  <div key={t.id} className="topic-card">
                      <h3 className="topic-title">{t.title}</h3>
                      <div className="topic-meta">
                          <span>Oleh: {t.creator_name}</span>
                          <span className={t.status === 'Open' ? 'status-open' : 'status-closed'}>{t.status}</span>
                      </div>
                      <p className="topic-desc">{t.description}</p>

                      <div className="vote-stats">
                          <span className="vote-agree"><i className="fa-solid fa-check"></i> Setuju: {t.votes_setuju || 0}</span>
                          <span className="vote-disagree"><i className="fa-solid fa-xmark"></i> Tidak: {t.votes_tidak_setuju || 0}</span>
                      </div>

                      {t.status === 'Open' && t.has_voted && (
                          <div className="vote-recorded">
                              <i className="fa-solid fa-check-double"></i> Suara Anda telah direkam.
                          </div>
                      )}

                      {t.status === 'Open' && !t.has_voted && (
                          <div className="vote-btns">
                              <button className="btn-vote agree" onClick={() => voteTopic(t.id, 'Setuju')}>
                                  <i className="fa-solid fa-check"></i> Setuju
                              </button>
                              <button className="btn-vote disagree" onClick={() => voteTopic(t.id, 'Tidak Setuju')}>
                                  <i className="fa-solid fa-xmark"></i> Tolak
                              </button>
                          </div>
                      )}

                      {t.status === 'Closed' && (
                          <div className="vote-result">
                              <div className="result-label">Hasil Akhir</div>
                              <div className="result-counts">
                                  <span className="vote-agree" style={{ fontSize: '1.2rem' }}><i className="fa-solid fa-check"></i> {t.votes_setuju || 0}</span>
                                  <span className="vote-disagree" style={{ fontSize: '1.2rem' }}><i className="fa-solid fa-xmark"></i> {t.votes_tidak_setuju || 0}</span>
                              </div>
                              <div className={`result-verdict ${(t.votes_setuju || 0) >= (t.votes_tidak_setuju || 0) ? 'verdict-approved' : 'verdict-rejected'}`}>
                                  {(t.votes_setuju || 0) >= (t.votes_tidak_setuju || 0) ? 'DISETUJUI' : 'DITOLAK'}
                              </div>
                          </div>
                      )}

                      {t.status === 'Open' && (t.created_by === currentUser.id || currentUser.role === 'admin') && (
                          <button onClick={() => closeTopic(t.id)} className="btn-close-topic">
                              <i className="fa-solid fa-lock"></i> Tutup Voting
                          </button>
                      )}
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}
