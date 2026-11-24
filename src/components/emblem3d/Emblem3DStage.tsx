"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import gsap from "gsap";
import {
  SHARD_BY_KEY,
  DEFAULT_LORE_QUOTES,
  RAIL_OFFSETS,
  type ShardDef,
  type LocalizedShardText,
  type CoreParticle,
  type ShockwaveRing,
  type BurstSpark,
  type ShardRuntime,
} from "./emblem3dData";
import { useMechaAudio } from "./useMechaAudio";

export interface EmblemUiLabels {
  hintDrag?: string;
  hintInteract?: string;
  hintSpin?: string;
  btnScatter?: string;
  btnUnite?: string;
  btnProcess?: string;
  btnAssemble?: string;
}

export interface Emblem3DStageProps {
  lores?: string[];
  localizedShards?: LocalizedShardText[];
  loaderPreparingText?: string;
  closeLabel?: string;
  uiLabels?: EmblemUiLabels;
}

export default function Emblem3DStage({
  lores,
  localizedShards,
  loaderPreparingText,
  closeLabel = "Tutup",
  uiLabels,
}: Emblem3DStageProps) {
  const activeLores = lores && lores.length > 0 ? lores : DEFAULT_LORE_QUOTES;

  const labels = useMemo(
    () => ({
      hintDrag: uiLabels?.hintDrag || "TAHAN & GESER UNTUK MEMUTAR",
      hintInteract: uiLabels?.hintInteract || "GESER SERPIHAN UNTUK PUTAR · KETUK UNTUK MAKNA",
      hintSpin: uiLabels?.hintSpin || "MEMUTAR LAMBANG 3D...",
      btnScatter: uiLabels?.btnScatter || "Pencar Formasi",
      btnUnite: uiLabels?.btnUnite || "Satukan Identitas",
      btnProcess: uiLabels?.btnProcess || "Memproses...",
      btnAssemble: uiLabels?.btnAssemble || "Merakit...",
    }),
    [uiLabels]
  );

  const stageRef = useRef<HTMLDivElement>(null);
  const threeMountRef = useRef<HTMLDivElement>(null);
  const constelCanvasRef = useRef<HTMLCanvasElement>(null);
  const godRaysRef = useRef<HTMLDivElement>(null);
  const monuTextRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loreIdx, setLoreIdx] = useState(0);
  const [isScattered, setIsScattered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hudHint, setHudHint] = useState(labels.hintDrag);
  const [hudHintActive, setHudHintActive] = useState(false);
  const [modalShard, setModalShard] = useState<ShardDef | null>(null);

  const labelsRef = useRef(labels);
  labelsRef.current = labels;

  const stateRef = useRef({
    isScattered: false,
    isAnimating: false,
    soundEnabled: true,
    autoSpin: true,
    isInViewport: true,
    isLightMode: false,
    hoveredKey: null as string | null,
    dragTarget: null as "full" | ShardRuntime | null,
    hasDragged: false,
    mouseX: 0,
    mouseY: 0,
    emblemVelY: 0,
    emblemVelX: 0,
    camTargetZ: 5.6,
    lineIntensityBoost: 0,
  });

  const threeRef = useRef<{
    THREE: any;
    scene: any;
    camera: any;
    renderer: any;
    emblemGroup: any;
    burstLight: any;
    shards: ShardRuntime[];
    coreParticles: CoreParticle[];
    shockwaves: ShockwaveRing[];
    sparks: BurstSpark[];
    computeLayout: () => void;
  }>({
    THREE: null,
    scene: null,
    camera: null,
    renderer: null,
    emblemGroup: null,
    burstLight: null,
    shards: [],
    coreParticles: [],
    shockwaves: [],
    sparks: [],
    computeLayout: () => {},
  });

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    stateRef.current.soundEnabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!hudHintActive && !stateRef.current.isAnimating) {
      setHudHint(stateRef.current.isScattered ? labels.hintInteract : labels.hintDrag);
    }
  }, [labels.hintDrag, labels.hintInteract, hudHintActive]);

  // Sync light/dark theme dynamically from root attribute
  useEffect(() => {
    if (typeof document === "undefined") return;
    const syncTheme = () => {
      stateRef.current.isLightMode =
        document.documentElement.getAttribute("data-theme") === "light";
    };
    syncTheme();
    const mo = new MutationObserver(syncTheme);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!loading) return;
    const iv = setInterval(() => {
      setLoreIdx((prev) => (prev + 1) % activeLores.length);
    }, 3500);
    return () => clearInterval(iv);
  }, [loading, activeLores.length]);

  const {
    ensureAudio,
    playTick,
    playPneumaticHiss,
    playServoGlide,
    playMechaClick,
    playBassDrop,
  } = useMechaAudio(soundEnabledRef);

  const emitShockwave = useCallback(
    (maxRadius: number, duration = 0.9, startRadius = 18, lineWidth = 4.5, color = "#ffd700") => {
      const constel = constelCanvasRef.current;
      const cx = (constel?.width || window.innerWidth) / 2;
      const cy = (constel?.height || window.innerHeight) / 2;
      const ring: ShockwaveRing = {
        x: cx,
        y: cy,
        radius: startRadius,
        maxRadius,
        alpha: 0.85,
        lineWidth,
        color,
      };
      threeRef.current.shockwaves.push(ring);
      gsap.to(ring, {
        radius: maxRadius,
        alpha: 0,
        lineWidth: 0.5,
        duration,
        ease: "expo.out",
        onComplete: () => {
          const arr = threeRef.current.shockwaves;
          const idx = arr.indexOf(ring);
          if (idx >= 0) arr.splice(idx, 1);
        },
      });
    },
    []
  );

  const emitSparks = useCallback((count = 36, speedMin = 2.5, speedMax = 9.5) => {
    const constel = constelCanvasRef.current;
    const cx = (constel?.width || window.innerWidth) / 2;
    const cy = (constel?.height || window.innerHeight) / 2;
    const colors = ["#ffd700", "#fff4b8", "#38bdf8", "#f59e0b"];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = speedMin + Math.random() * (speedMax - speedMin);
      threeRef.current.sparks.push({
        x: cx + Math.cos(a) * (8 + Math.random() * 14),
        y: cy + Math.sin(a) * (8 + Math.random() * 14),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0,
        maxLife: 34 + Math.random() * 28,
        size: 1.3 + Math.random() * 2.0,
        color: colors[i % colors.length],
      });
    }
  }, []);

  const handleToggleFormation = useCallback(() => {
    const st = stateRef.current;
    const eng = threeRef.current;
    if (st.isAnimating || !eng.emblemGroup || eng.shards.length === 0) return;

    ensureAudio();
    st.isAnimating = true;
    setIsAnimating(true);
    setModalShard(null);
    eng.computeLayout();

    const isMobile = window.innerWidth < 768;

    const triggerMicroJolt = (strength = 0.04, dur = 0.14) => {
      const shake = { v: strength };
      gsap.to(shake, {
        v: 0,
        duration: dur,
        ease: "power2.out",
        onUpdate: () => {
          eng.camera.position.x = Math.sin(shake.v * 180) * shake.v;
          eng.camera.position.y = Math.cos(shake.v * 150) * shake.v * 0.6;
        },
        onComplete: () => {
          eng.camera.position.x = 0;
          eng.camera.position.y = 0;
        },
      });
    };

    if (!st.isScattered) {
      st.isScattered = true;
      setIsScattered(true);
      setHudHint("MENGURAI 13 SIMBOL IDENTITAS...");
      setHudHintActive(true);
      playMechaClick(0.95, 0.03, 0.24);
      playPneumaticHiss(0.08, 0.58, 0.16, 2600, 520);
      playServoGlide(95, 195, 0.85, 0.1, 0.052);
      if (navigator.vibrate) navigator.vibrate([35, 40, 60]);

      const scatterCamZ = isMobile ? 7.5 : 6.1;
      st.camTargetZ = scatterCamZ;

      const curEmblemY = eng.emblemGroup.rotation.y % (Math.PI * 2);
      eng.emblemGroup.rotation.y = curEmblemY;
      st.emblemVelY = 0;
      st.emblemVelX = 0;

      const tl = gsap.timeline({
        onComplete: () => {
          eng.emblemGroup.scale.set(1, 1, 1);
          eng.emblemGroup.rotation.set(0, 0, 0);
          eng.emblemGroup.position.y = 0;
          eng.camera.position.set(0, 0, scatterCamZ);
          if (eng.burstLight) eng.burstLight.intensity = 0;
          st.lineIntensityBoost = 0;
          st.isAnimating = false;
          setIsAnimating(false);
          setHudHint(labelsRef.current.hintInteract);
          setHudHintActive(false);
        },
      });

      tl.to(eng.emblemGroup.position, { y: 0, duration: 0.9, ease: "power2.out" }, 0);
      tl.to(
        eng.emblemGroup.rotation,
        {
          x: 0,
          y: curEmblemY > Math.PI ? Math.PI * 2 : curEmblemY < -Math.PI ? -Math.PI * 2 : 0,
          z: 0,
          duration: 0.58,
          ease: "power3.out",
          onComplete: () => eng.emblemGroup.rotation.set(0, 0, 0),
        },
        0
      );
      tl.to(eng.camera.position, { z: scatterCamZ, duration: 2.15, ease: "power2.inOut" }, 0.16);
      if (godRaysRef.current) {
        tl.to(godRaysRef.current, { opacity: 0.26, duration: 2.1, ease: "power2.out" }, 0.25);
      }

      tl.add(() => playMechaClick(1.12, 0, 0.16), 0.52);

      tl.add(() => {
        playMechaClick(1.22, 0, 0.22);
        playPneumaticHiss(0.02, 0.55, 0.14, 3000, 620);
        playServoGlide(195, 115, 1.15, 0.04, 0.048);
        emitShockwave(isMobile ? 230 : 400, 0.95, 16, 3.8, "#ffd700");
        emitSparks(isMobile ? 18 : 28, 2.5, 7.5);
        triggerMicroJolt(0.038, 0.18);
      }, 1.08);

      tl.add(() => playMechaClick(1.38, 0, 0.12), 2.15);

      if (eng.burstLight) {
        tl.to(eng.burstLight, { intensity: 4.8, duration: 0.18 }, 1.02);
        tl.to(eng.burstLight, { intensity: 0, duration: 1.05, ease: "power2.out" }, 1.22);
      }
      tl.to(st, { lineIntensityBoost: 0.38, duration: 0.75, yoyo: true, repeat: 1 }, 1.05);

      eng.coreParticles.forEach((p) => {
        gsap.to(p, { speed: p.baseSpeed * 2.6, duration: 0.85, yoyo: true, repeat: 1, ease: "power2.out" });
        gsap.to(p, {
          radius: p.baseRadius + (isMobile ? 280 : 440) + Math.random() * (isMobile ? 480 : 820),
          glow: 0.15,
          duration: 2.5,
          ease: "expo.out",
        });
      });

      eng.shards.forEach((sh) => {
        sh.velX = 0;
        sh.velY = 0;
        sh.hoverMult = 1;
        const p0 = sh.assembledPos;
        const tgt = sh.scatterTarget;
        const rail = RAIL_OFFSETS[sh.def.key] ?? { dx: 0, dy: 0, dz: 0.2, tier: 2 };
        const stagger1 = (4 - rail.tier) * 0.055;

        tl.to(
          sh.obj.position,
          {
            x: p0.x + rail.dx,
            y: p0.y + rail.dy,
            z: p0.z + rail.dz,
            duration: 0.72,
            ease: "power3.out",
          },
          0.05 + stagger1
        );

        const deployStart = 1.1 + rail.tier * 0.04;
        tl.to(
          sh.obj.position,
          {
            x: tgt.x,
            y: tgt.y,
            z: tgt.z,
            duration: 1.35,
            ease: "power3.inOut",
          },
          deployStart
        );
        tl.to(
          sh.obj.scale,
          {
            x: tgt.scale,
            y: tgt.scale,
            z: tgt.scale,
            duration: 1.25,
            ease: "back.out(1.05)",
          },
          deployStart
        );
        tl.to(
          sh.obj.rotation,
          {
            x: 0,
            y: (rail.tier % 2 === 0 ? -1 : 1) * Math.PI * 2,
            z: 0,
            duration: 1.38,
            ease: "power2.out",
            onComplete: () => sh.obj.rotation.set(0, 0, 0),
          },
          deployStart
        );
      });
    } else {
      setHudHint("MENYATUKAN KEMBALI 13 SIMBOL...");
      setHudHintActive(true);
      playPneumaticHiss(0.06, 0.45, 0.12, 2200, 480);
      playServoGlide(115, 225, 1.35, 0.08, 0.052);

      const assembledCamZ = isMobile ? 6.8 : 5.6;
      const assembledOffsetY = isMobile ? 0.16 : 0;
      st.camTargetZ = assembledCamZ;
      eng.emblemGroup.rotation.set(0, 0, 0);

      const tl = gsap.timeline({
        onComplete: () => {
          eng.shards.forEach((sh) => {
            sh.obj.position.copy(sh.assembledPos);
            sh.obj.rotation.set(0, 0, 0);
            sh.obj.scale.set(1, 1, 1);
            sh.velX = 0;
            sh.velY = 0;
            sh.hoverMult = 1;
          });
          eng.emblemGroup.rotation.set(0, 0, 0);
          eng.emblemGroup.scale.set(1, 1, 1);
          eng.emblemGroup.position.y = assembledOffsetY;
          eng.camera.position.set(0, 0, assembledCamZ);
          if (eng.burstLight) eng.burstLight.intensity = 0;
          st.lineIntensityBoost = 0;
          st.emblemVelY = 0.024;

          st.isScattered = false;
          st.isAnimating = false;
          setIsScattered(false);
          setIsAnimating(false);
          setHudHint(labelsRef.current.hintDrag);
          setHudHintActive(false);
        },
      });

      if (godRaysRef.current) {
        tl.to(godRaysRef.current, { opacity: st.isLightMode ? 0.6 : 1, duration: 2.3, ease: "power2.out" }, 0);
      }

      tl.to(eng.emblemGroup.position, { y: assembledOffsetY, duration: 1.1, ease: "power2.inOut" }, 0.3);
      tl.to(st, { lineIntensityBoost: 0.52, duration: 0.65, ease: "power2.in" }, 0);
      tl.to(st, { lineIntensityBoost: 0, duration: 0.7, ease: "power2.out" }, 1.8);

      eng.coreParticles.forEach((p) => {
        gsap.to(p, { speed: p.baseSpeed * 3.4, duration: 2.2, ease: "expo.in" });
        gsap.to(p, {
          radius: p.baseRadius,
          glow: p.baseGlow,
          duration: 2.4,
          ease: "expo.inOut",
          onComplete: () => {
            p.speed = p.baseSpeed;
          },
        });
      });

      tl.to(eng.camera.position, { z: assembledCamZ + 0.42, duration: 0.72, ease: "power2.out" }, 0);
      tl.to(eng.camera.position, { z: assembledCamZ - 0.16, duration: 1.55, ease: "power2.in" }, 0.74);
      tl.to(eng.camera.position, { z: assembledCamZ, duration: 0.85, ease: "power3.out" }, 2.4);

      const tierSlamTimes = [1.1, 1.4, 1.7, 2.02, 2.4];
      const tierPitchScales = [0.8, 0.9, 1.02, 1.14, 0.74];
      tierSlamTimes.forEach((tSlam, idx) => {
        tl.add(() => {
          playMechaClick(tierPitchScales[idx], 0, idx === 4 ? 0.28 : 0.19);
          triggerMicroJolt(idx === 4 ? 0.085 : 0.032, idx === 4 ? 0.34 : 0.14);
          if (idx === 1 || idx === 3) {
            playPneumaticHiss(0.01, 0.24, 0.075, 2500, 700);
          }
          if (idx === 4) {
            playBassDrop();
            playPneumaticHiss(0.04, 0.72, 0.17, 2200, 380);
            emitShockwave(isMobile ? 360 : 720, 1.15, 20, 5.2, "#ffd700");
            emitShockwave(isMobile ? 230 : 460, 0.85, 12, 2.8, "#38bdf8");
            emitSparks(isMobile ? 28 : 48, 3.2, 11.5);
            if (navigator.vibrate) navigator.vibrate([90, 40, 150]);
            if (flashRef.current) {
              gsap.fromTo(
                flashRef.current,
                { opacity: 0 },
                { opacity: 0.85, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out" }
              );
            }
          } else {
            emitSparks(isMobile ? 8 : 14, 2.0, 5.8);
          }
        }, tSlam);
      });

      if (eng.burstLight) {
        tl.to(eng.burstLight, { intensity: 7.5, duration: 0.1 }, 2.36);
        tl.to(eng.burstLight, { intensity: 0, duration: 1.05, ease: "power2.out" }, 2.46);
      }

      eng.shards.forEach((sh) => {
        sh.velX = 0;
        sh.velY = 0;
        sh.hoverMult = 1;
        const pEnd = sh.assembledPos;
        const rail = RAIL_OFFSETS[sh.def.key] ?? { dx: 0, dy: 0, dz: 0.3, tier: 2 };
        const tSlam = tierSlamTimes[rail.tier];
        const tPistonStart = tSlam - 0.28;
        const tStageStart = 0.04 + rail.tier * 0.07;
        const stageDur = tPistonStart - tStageStart;

        const normRotY = sh.obj.rotation.y % (Math.PI * 2);
        sh.obj.rotation.y = normRotY;
        tl.to(
          sh.obj.rotation,
          { x: 0, y: 0, z: 0, duration: Math.min(0.68, stageDur), ease: "power3.out" },
          tStageStart
        );

        tl.to(
          sh.obj.position,
          {
            x: pEnd.x + rail.dx,
            y: pEnd.y + rail.dy,
            z: pEnd.z + rail.dz,
            duration: stageDur,
            ease: "power3.inOut",
          },
          tStageStart
        );
        tl.to(
          sh.obj.scale,
          { x: 1, y: 1, z: 1, duration: stageDur, ease: "power3.inOut" },
          tStageStart
        );

        tl.to(
          sh.obj.position,
          {
            x: pEnd.x,
            y: pEnd.y,
            z: pEnd.z,
            duration: 0.28,
            ease: "power4.in",
          },
          tPistonStart
        );
      });

      tl.to(eng.emblemGroup.scale, { x: 1.07, y: 1.07, z: 1.07, duration: 0.14, ease: "power2.out" }, 2.4);
      tl.to(eng.emblemGroup.scale, { x: 1, y: 1, z: 1, duration: 0.55, ease: "back.out(1.7)" }, 2.54);
      tl.to(
        eng.emblemGroup.rotation,
        {
          y: Math.PI * 2,
          duration: 1.15,
          ease: "power3.out",
        },
        2.42
      );
    }
  }, [ensureAudio, playMechaClick, playPneumaticHiss, playServoGlide, playBassDrop, emitShockwave, emitSparks]);

  const handleResetView = useCallback(() => {
    const eng = threeRef.current;
    const st = stateRef.current;
    if (!eng.emblemGroup || st.isAnimating) return;

    const isMobile = window.innerWidth < 768;
    st.camTargetZ = st.isScattered ? (isMobile ? 7.5 : 6.1) : isMobile ? 6.8 : 5.6;
    gsap.to(eng.camera.position, { x: 0, y: 0, z: st.camTargetZ, duration: 0.85, ease: "power2.out" });

    if (!st.isScattered) {
      st.emblemVelX = 0;
      st.emblemVelY = 0;
      gsap.to(eng.emblemGroup.rotation, { x: 0, y: 0, z: 0, duration: 0.9, ease: "power2.out" });
    } else {
      eng.shards.forEach((sh) => {
        sh.velX = 0;
        sh.velY = 0;
        gsap.to(sh.obj.rotation, { x: 0, y: 0, z: 0, duration: 0.85, ease: "power2.out" });
      });
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalShard(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pause WebGL + canvas rendering when scrolled off-screen below fold
  useEffect(() => {
    if (!stageRef.current || typeof IntersectionObserver === "undefined") {
      stateRef.current.isInViewport = true;
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        stateRef.current.isInViewport = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.02 }
    );
    io.observe(stageRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let animId = 0;
    let isCancelled = false;
    let cleanupDomListeners: (() => void) | null = null;

    const mount = threeMountRef.current;
    const constelCanvas = constelCanvasRef.current;
    if (!mount || !constelCanvas) return;

    const ctxConstel = constelCanvas.getContext("2d");

    const initParticles = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      constelCanvas.width = w;
      constelCanvas.height = h;
      const isMob = w < 768;
      const count = isMob ? 14 : 58;
      const parts: CoreParticle[] = [];
      for (let i = 0; i < count; i++) {
        const r = Math.random() * (isMob ? 135 : 190) + (isMob ? 65 : 85);
        const g = Math.random() * 0.5 + 0.25;
        const s = Math.random() * 0.014 + 0.005;
        parts.push({
          baseX: w / 2,
          baseY: h / 2 - (isMob ? h * 0.03 : 0),
          angle: Math.random() * Math.PI * 2,
          radius: stateRef.current.isScattered ? r + (isMob ? 260 : 420) : r,
          baseRadius: r,
          speed: s,
          baseSpeed: s,
          size: Math.random() * 2.2 + 1.0,
          glow: g,
          baseGlow: g,
          offsetX: 0,
          offsetY: 0,
        });
      }
      threeRef.current.coreParticles = parts;
    };
    initParticles();

    Promise.all([
      import("three"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("three/examples/jsm/environments/RoomEnvironment.js"),
    ]).then(([THREE, { GLTFLoader }, { RoomEnvironment }]) => {
      if (isCancelled || !threeMountRef.current) return;

      const width = mount.clientWidth || window.innerWidth;
      const height = mount.clientHeight || window.innerHeight;
      const isMobInit = width < 768;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      stateRef.current.camTargetZ = isMobInit ? 6.8 : 5.6;
      camera.position.set(0, 0, stateRef.current.camTargetZ);

      const renderer = new THREE.WebGLRenderer({
        antialias: !isMobInit,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.shadowMap.enabled = false;

      // Detect strictly entry-level devices (< OPPO A96 4G / < 8GB RAM / <= 4 cores / weak GPU).
      // OPPO A96 (8GB RAM, 8 cores, Adreno 610) & stronger phones stay in full mobile-standard PBR!
      let gpuRendererName = "";
      try {
        const gl = renderer.getContext();
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        if (dbg) {
          gpuRendererName = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
        }
      } catch {}

      const navAny = navigator as unknown as { deviceMemory?: number };
      const devMem = typeof navAny.deviceMemory === "number" ? navAny.deviceMemory : null;
      const cpuCores = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : null;
      const isUltraEntryGpu =
        /PowerVR.*(GE8320|GE8322|GE8300|GE8100)|Adreno.*(30\d|40\d|504|505|506|508|509|510)|Mali-4\d\d|Mali-T7\d\d|Mali-T8[23]0|Mali-G31/i.test(
          gpuRendererName
        );
      let isLiteTier =
        isMobInit &&
        (isUltraEntryGpu ||
          (devMem !== null && devMem <= 4) ||
          (cpuCores !== null && cpuCores <= 4));

      const getMaxDpr = (w: number) => {
        if (w >= 768) return 2;
        return isLiteTier ? 1.0 : 1.15;
      };

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, getMaxDpr(width)));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.touchAction = "pan-y";
      mount.appendChild(renderer.domElement);

      let pmrem: any = null;
      let envTex: any = null;
      if (!isLiteTier) {
        pmrem = new THREE.PMREMGenerator(renderer);
        envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTex;
        if ("environmentIntensity" in scene) {
          (scene as any).environmentIntensity = isMobInit ? 0.42 : 0.36;
        }
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, isLiteTier ? 0.58 : isMobInit ? 0.42 : 0.32);
      scene.add(ambientLight);

      let hemiLight: any = null;
      if (isLiteTier) {
        hemiLight = new THREE.HemisphereLight(0xfff5dc, 0x3b4d6b, 0.95);
        scene.add(hemiLight);
      }

      const keyLight = new THREE.DirectionalLight(0xfff5e0, isMobInit ? 1.65 : 1.45);
      keyLight.position.set(4, 5, 6);
      scene.add(keyLight);

      const backKeyLight = new THREE.DirectionalLight(0xfff4d4, isMobInit ? 1.4 : 1.3);
      backKeyLight.position.set(-3, 4, -6);
      scene.add(backKeyLight);

      let burstLight: any = null;
      if (!isMobInit) {
        const fillLight = new THREE.DirectionalLight(0x90caf9, 0.45);
        fillLight.position.set(-5, -2, 4);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0x4fc3f7, 0.95);
        rimLight.position.set(3, 3, -5);
        scene.add(rimLight);

        const goldUnderLight = new THREE.PointLight(0xd4af37, 0.75, 14);
        goldUnderLight.position.set(0, -3.5, 3);
        scene.add(goldUnderLight);

        burstLight = new THREE.PointLight(0xffd54f, 0, 12);
        burstLight.position.set(0, 0, 0.75);
        scene.add(burstLight);
      }

      const convertGroupToLitePhong = (rootObj: any) => {
        const matCache = new Map<any, any>();
        rootObj.traverse((child: any) => {
          if (!child.isMesh || !child.material) return;
          const mapSingle = (mat: any) => {
            if (mat.isMeshPhongMaterial) return mat;
            if (matCache.has(mat)) return matCache.get(mat);
            const hasOrmMap = !!(mat.metalnessMap || mat.roughnessMap);
            const roughness = typeof mat.roughness === "number" ? mat.roughness : 0.35;
            const metalness = typeof mat.metalness === "number" ? mat.metalness : 0.25;
            // Atlas materials carry roughness/metalness in a texture (factors are 1.0), so use balanced defaults
            const shininess = hasOrmMap ? 54 : Math.max(20, Math.min(96, (1 - roughness) * 95));
            const specLvl = hasOrmMap ? 0.42 : metalness > 0.5 ? 0.58 : 0.34;
            const phong = new THREE.MeshPhongMaterial({
              color: mat.color ? mat.color.clone() : new THREE.Color(0xffffff),
              map: mat.map || null,
              normalMap: mat.normalMap || null,
              normalScale: mat.normalScale ? mat.normalScale.clone() : new THREE.Vector2(1, 1),
              emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000),
              emissiveIntensity: mat.emissiveIntensity ?? 1,
              specular: new THREE.Color(specLvl, specLvl * 0.95, specLvl * 0.82),
              shininess,
              side: mat.side,
              transparent: mat.transparent,
              opacity: mat.opacity,
            });
            matCache.set(mat, phong);
            mat.dispose?.();
            return phong;
          };
          child.material = Array.isArray(child.material)
            ? child.material.map(mapSingle)
            : mapSingle(child.material);
        });
      };

      const activateLiteTier = () => {
        if (isLiteTier || !isMobInit) return;
        isLiteTier = true;
        const w = mount.clientWidth || window.innerWidth;
        const h = mount.clientHeight || window.innerHeight;
        renderer.setPixelRatio(1);
        renderer.setSize(w, h);
        scene.environment = null;
        if (envTex) {
          envTex.dispose();
          envTex = null;
        }
        if (pmrem) {
          pmrem.dispose();
          pmrem = null;
        }
        ambientLight.intensity = 0.58;
        if (!hemiLight) {
          hemiLight = new THREE.HemisphereLight(0xfff5dc, 0x3b4d6b, 0.95);
          scene.add(hemiLight);
        }
        convertGroupToLitePhong(emblemGroup);
        if (threeRef.current.coreParticles.length > 8) {
          threeRef.current.coreParticles = threeRef.current.coreParticles.slice(0, 8);
        }
        try {
          renderer.compile(scene, camera);
        } catch {}
      };

      const emblemGroup = new THREE.Group();
      emblemGroup.position.y = isMobInit ? 0.16 : 0;
      scene.add(emblemGroup);

      threeRef.current.THREE = THREE;
      threeRef.current.scene = scene;
      threeRef.current.camera = camera;
      threeRef.current.renderer = renderer;
      threeRef.current.emblemGroup = emblemGroup;
      threeRef.current.burstLight = burstLight;

      const computeLayout = () => {
        const w = mount.clientWidth || window.innerWidth;
        const h = mount.clientHeight || window.innerHeight;
        const isMob = w < 768;
        const zDist = isMob ? 7.5 : 6.1;
        const vFov = (camera.fov * Math.PI) / 180;
        const visH = 2 * Math.tan(vFov / 2) * zDist;
        const visW = visH * (w / h);

        const targetDiam = isMob
          ? Math.min(visW * 0.23, visH * 0.115)
          : Math.min(visW * 0.145, visH * 0.22);

        threeRef.current.shards.forEach((sh) => {
          const posDef = isMob ? sh.def.mobilePos : sh.def.desktopPos;
          const rawScale = (targetDiam / Math.max(0.2, sh.localMaxDim)) * (sh.def.scaleBoost ?? 1.0);
          const clampedScale = Math.min(1.85, Math.max(0.28, rawScale));
          sh.scatterTarget = {
            x: posDef.nx * visW,
            y: posDef.ny * visH,
            z: posDef.nz,
            scale: clampedScale,
          };
          const worldRadius = 0.5 * sh.localMaxDim * clampedScale;
          sh.hitRadiusPx = Math.max(48, Math.min(88, (worldRadius / (visH * 0.5)) * (h * 0.5) * 1.12));
        });
      };
      threeRef.current.computeLayout = computeLayout;

      const modelUrl = isMobInit
        ? "/assets/models/expedient-43-logo-mobile-v3.glb?v=atlas3"
        : "/assets/models/expedient-43-logo.glb?v=13shards_v4";

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          if (isCancelled) return;
          const rawRoot = gltf.scene;
          rawRoot.updateMatrixWorld(true);
          const fullBox = new THREE.Box3().setFromObject(rawRoot);
          const masterCenter = fullBox.getCenter(new THREE.Vector3());

          const runtimes: ShardRuntime[] = [];
          const children = [...rawRoot.children];

          children.forEach((layerObj: any) => {
            const def = SHARD_BY_KEY.get(layerObj.name);
            if (!def) return;

            layerObj.position.sub(masterCenter);
            emblemGroup.add(layerObj);

            const localBox = new THREE.Box3().setFromObject(layerObj);
            const size = localBox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            runtimes.push({
              def,
              obj: layerObj,
              assembledPos: layerObj.position.clone(),
              localMaxDim: maxDim,
              scatterTarget: { x: 0, y: 0, z: 0, scale: 0.5 },
              velY: 0,
              velX: 0,
              floatPhase: def.id * 0.55,
              hoverMult: 1.0,
              isHovered: false,
              screenX: width / 2,
              screenY: height / 2,
              hitRadiusPx: 54,
            });
          });

          runtimes.sort((a, b) => a.def.id - b.def.id);
          threeRef.current.shards = runtimes;
          computeLayout();

          if (isLiteTier) {
            convertGroupToLitePhong(emblemGroup);
            if (threeRef.current.coreParticles.length > 8) {
              threeRef.current.coreParticles = threeRef.current.coreParticles.slice(0, 8);
            }
          }

          // Pre-compile WebGL shaders before fading out loader to eliminate first-frame stutter
          try {
            renderer.compile(scene, camera);
          } catch {}

          setLoadProgress(100);
          setTimeout(() => {
            if (isCancelled) return;
            setLoading(false);
            gsap.from(emblemGroup.scale, {
              x: 0.2,
              y: 0.2,
              z: 0.2,
              duration: 1.2,
              ease: "expo.out",
            });
          }, 220);
        },
        (xhr) => {
          if (xhr.total > 0) {
            setLoadProgress(Math.min(99, Math.round((xhr.loaded / xhr.total) * 100)));
          }
        },
        (err) => {
          console.error("GLTF load error:", err);
          setLoading(false);
        }
      );

      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      let startX = 0;
      let startY = 0;
      let lastX = 0;
      let lastY = 0;
      let lastTickMs = 0;

      const pickShardAt = (clientX: number, clientY: number): ShardRuntime | null => {
        const rect = renderer.domElement.getBoundingClientRect();
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;
        ndc.x = (localX / rect.width) * 2 - 1;
        ndc.y = -(localY / rect.height) * 2 + 1;

        raycaster.setFromCamera(ndc, camera);
        const objs = threeRef.current.shards.map((s) => s.obj);
        const hits = raycaster.intersectObjects(objs, true);

        if (hits.length > 0) {
          let cur: any = hits[0].object;
          while (cur && cur.parent && cur.parent !== emblemGroup) {
            cur = cur.parent;
          }
          const match = threeRef.current.shards.find((s) => s.obj === cur);
          if (match) return match;
        }

        let best: ShardRuntime | null = null;
        let bestDist = Infinity;
        for (const sh of threeRef.current.shards) {
          const d = Math.hypot(localX - sh.screenX, localY - sh.screenY);
          if (d < sh.hitRadiusPx && d < bestDist) {
            bestDist = d;
            best = sh;
          }
        }
        return best;
      };

      const isOverCenterEmblem = (clientX: number, clientY: number): boolean => {
        const rect = renderer.domElement.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height * 0.46;
        const maxR = Math.min(rect.width, rect.height) * 0.34;
        if (Math.hypot(clientX - cx, clientY - cy) <= maxR) return true;

        ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        return raycaster.intersectObject(emblemGroup, true).length > 0;
      };

      // Prevent browser vertical scroll hijack ONLY when actively grabbing 3D emblem or shard on touch
      const onTouchStartCapture = (e: TouchEvent) => {
        if (stateRef.current.isAnimating || e.touches.length !== 1) return;
        const t = e.touches[0];
        const hits3D = !stateRef.current.isScattered
          ? isOverCenterEmblem(t.clientX, t.clientY)
          : pickShardAt(t.clientX, t.clientY) !== null;
        if (hits3D && e.cancelable) {
          e.preventDefault();
        }
      };

      const onTouchMoveCapture = (e: TouchEvent) => {
        if (stateRef.current.dragTarget && e.cancelable) {
          e.preventDefault();
        }
      };

      const onPointerDown = (e: PointerEvent) => {
        if (stateRef.current.isAnimating) return;
        if (e.button !== 0 && e.pointerType === "mouse") return;

        startX = e.clientX;
        startY = e.clientY;
        lastX = e.clientX;
        lastY = e.clientY;
        stateRef.current.hasDragged = false;

        if (!stateRef.current.isScattered) {
          if (e.pointerType === "touch" && !isOverCenterEmblem(e.clientX, e.clientY)) {
            return;
          }
          ensureAudio();
          stateRef.current.dragTarget = "full";
          stateRef.current.emblemVelX = 0;
          stateRef.current.emblemVelY = 0;
          setHudHint(labelsRef.current.hintSpin);
          setHudHintActive(true);
        } else {
          const hit = pickShardAt(e.clientX, e.clientY);
          if (hit) {
            ensureAudio();
            stateRef.current.dragTarget = hit;
            hit.velX = 0;
            hit.velY = 0;
            setHudHint(`${hit.def.shortTitle.toUpperCase()}`);
            setHudHintActive(true);
          } else {
            stateRef.current.dragTarget = null;
            return;
          }
        }

        renderer.domElement.setPointerCapture?.(e.pointerId);
      };

      const onPointerMove = (e: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        stateRef.current.mouseX = e.clientX - rect.left;
        stateRef.current.mouseY = e.clientY - rect.top;

        if (window.innerWidth >= 768 && !stateRef.current.isAnimating && stateRef.current.isInViewport) {
          const xNorm = (e.clientX / window.innerWidth - 0.5) * 2;
          const yNorm = (e.clientY / window.innerHeight - 0.5) * 2;
          if (monuTextRef.current) {
            gsap.to(monuTextRef.current, {
              xPercent: -50 + xNorm * -3,
              yPercent: -50 + yNorm * -3,
              duration: 1.0,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
          if (godRaysRef.current) {
            gsap.to(godRaysRef.current, {
              rotation: xNorm * 10,
              duration: 1.0,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
        }

        const drag = stateRef.current.dragTarget;
        if (drag) {
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          if (Math.hypot(e.clientX - startX, e.clientY - startY) > 5) {
            stateRef.current.hasDragged = true;
          }

          const speed = Math.hypot(dx, dy);
          const now = Date.now();
          if (speed > 2.2 && now - lastTickMs > 95 - Math.min(speed * 2, 70)) {
            playTick(speed);
            lastTickMs = now;
          }

          if (drag === "full") {
            emblemGroup.rotation.y += dx * 0.011;
            emblemGroup.rotation.x = Math.max(-1.15, Math.min(1.15, emblemGroup.rotation.x + dy * 0.008));
            stateRef.current.emblemVelY = dx * 0.011;
            stateRef.current.emblemVelX = dy * 0.008;
          } else {
            drag.obj.rotation.y += dx * 0.017;
            drag.obj.rotation.x += dy * 0.014;
            drag.velY = dx * 0.017;
            drag.velX = dy * 0.014;
          }

          lastX = e.clientX;
          lastY = e.clientY;
          return;
        }

        if (e.pointerType === "mouse" && stateRef.current.isScattered && !stateRef.current.isAnimating) {
          const hovered = pickShardAt(e.clientX, e.clientY);
          const prevKey = stateRef.current.hoveredKey;
          const nextKey = hovered ? hovered.def.key : null;

          if (prevKey !== nextKey) {
            stateRef.current.hoveredKey = nextKey;
            threeRef.current.shards.forEach((s) => {
              s.isHovered = s.def.key === nextKey;
            });
            renderer.domElement.style.cursor = hovered ? "grab" : "default";
            if (hovered) {
              setHudHint(`${hovered.def.shortTitle.toUpperCase()} · GESER PUTAR ATAU KLIK`);
              setHudHintActive(true);
            } else {
              setHudHint(labelsRef.current.hintInteract);
              setHudHintActive(false);
            }
          }
        } else if (e.pointerType === "mouse") {
          renderer.domElement.style.cursor = "grab";
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        const drag = stateRef.current.dragTarget;
        if (!drag) return;

        if (
          drag !== "full" &&
          !stateRef.current.hasDragged &&
          stateRef.current.isScattered &&
          !stateRef.current.isAnimating
        ) {
          setModalShard(drag.def);
        }

        stateRef.current.dragTarget = null;
        renderer.domElement.releasePointerCapture?.(e.pointerId);

        if (!stateRef.current.isAnimating) {
          setHudHint(
            stateRef.current.isScattered
              ? labelsRef.current.hintInteract
              : labelsRef.current.hintDrag
          );
          setHudHintActive(false);
        }
      };

      const onResize = () => {
        if (!mount) return;
        const w = mount.clientWidth || window.innerWidth;
        const h = mount.clientHeight || window.innerHeight;
        const isMob = w < 768;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, getMaxDpr(w)));
        renderer.setSize(w, h);
        initParticles();
        if (isLiteTier && threeRef.current.coreParticles.length > 8) {
          threeRef.current.coreParticles = threeRef.current.coreParticles.slice(0, 8);
        }
        computeLayout();

        if (!stateRef.current.isAnimating) {
          emblemGroup.position.y = isMob && !stateRef.current.isScattered ? 0.16 : 0;
          stateRef.current.camTargetZ = stateRef.current.isScattered
            ? isMob
              ? 7.5
              : 6.1
            : isMob
            ? 6.8
            : 5.6;
        }

        if (stateRef.current.isScattered && !stateRef.current.isAnimating) {
          threeRef.current.shards.forEach((sh) => {
            gsap.to(sh.obj.position, {
              x: sh.scatterTarget.x,
              y: sh.scatterTarget.y,
              z: sh.scatterTarget.z,
              duration: 0.45,
              ease: "power2.out",
            });
            gsap.to(sh.obj.scale, {
              x: sh.scatterTarget.scale,
              y: sh.scatterTarget.scale,
              z: sh.scatterTarget.scale,
              duration: 0.45,
              ease: "power2.out",
            });
          });
        }
      };

      renderer.domElement.addEventListener("touchstart", onTouchStartCapture, { passive: false });
      renderer.domElement.addEventListener("touchmove", onTouchMoveCapture, { passive: false });
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("resize", onResize);

      cleanupDomListeners = () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("touchstart", onTouchStartCapture);
        renderer.domElement.removeEventListener("touchmove", onTouchMoveCapture);
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        if (envTex) envTex.dispose();
        if (pmrem) pmrem.dispose();
        renderer.dispose();
      };

      const projVec = new THREE.Vector3();
      let lastFrameMs = performance.now();
      let perfAccumMs = 0;
      let perfFrameCount = 0;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const st = stateRef.current;

        if (!st.isInViewport && !st.isAnimating) {
          lastFrameMs = performance.now();
          return;
        }

        const nowMs = performance.now();
        const elapsedMs = nowMs - lastFrameMs;

        // Low-end tier uses locked ~30fps pacing to avoid uneven frame jitter and thermal throttling
        if (isLiteTier && !st.isAnimating && elapsedMs < 31) {
          return;
        }

        const dtSec = Math.min(0.06, Math.max(0.004, elapsedMs * 0.001));
        const dtMult = dtSec * 60;
        lastFrameMs = nowMs;
        const t = nowMs * 0.001;

        // Dynamic safety check for unannounced weak mobile hardware (< ~25fps sustained).
        // Devices with >= 8GB RAM (e.g. OPPO A96) only auto-step down if severely below ~17fps.
        if (isMobInit && !isLiteTier && threeRef.current.shards.length > 0 && elapsedMs < 150) {
          perfAccumMs += elapsedMs;
          perfFrameCount++;
          if (perfFrameCount >= 32) {
            const avgMs = perfAccumMs / perfFrameCount;
            const thresholdMs = devMem !== null && devMem >= 8 ? 58 : 39;
            if (avgMs > thresholdMs) {
              activateLiteTier();
            }
            perfAccumMs = 0;
            perfFrameCount = 0;
          }
        }

        if (!st.isAnimating) {
          camera.position.z += (st.camTargetZ - camera.position.z) * Math.min(1, 0.08 * dtMult);
        }

        if (!st.isAnimating) {
          if (!st.isScattered) {
            if (st.dragTarget !== "full") {
              if (Math.abs(st.emblemVelY) > 0.0005) {
                emblemGroup.rotation.y += st.emblemVelY * dtMult;
                st.emblemVelY *= Math.pow(0.945, dtMult);
              } else if (st.autoSpin) {
                emblemGroup.rotation.y += 0.0065 * dtMult;
              }
              if (Math.abs(st.emblemVelX) > 0.0005) {
                emblemGroup.rotation.x = Math.max(
                  -1.15,
                  Math.min(1.15, emblemGroup.rotation.x + st.emblemVelX * dtMult)
                );
                st.emblemVelX *= Math.pow(0.92, dtMult);
              }
            }
          } else {
            threeRef.current.shards.forEach((sh) => {
              const isDraggingThis = st.dragTarget === sh;
              if (!isDraggingThis) {
                if (Math.abs(sh.velY) > 0.0008) {
                  sh.obj.rotation.y += sh.velY * dtMult;
                  sh.velY *= Math.pow(0.94, dtMult);
                } else if (st.autoSpin) {
                  sh.obj.rotation.y += 0.0075 * dtMult;
                }

                if (Math.abs(sh.velX) > 0.0008) {
                  sh.obj.rotation.x += sh.velX * dtMult;
                  sh.velX *= Math.pow(0.93, dtMult);
                } else {
                  sh.obj.rotation.x *= Math.pow(0.985, dtMult);
                }
              }

              const targetHover = sh.isHovered || isDraggingThis ? 1.18 : 1.0;
              sh.hoverMult += (targetHover - sh.hoverMult) * Math.min(1, 0.14 * dtMult);
              const sVal = sh.scatterTarget.scale * sh.hoverMult;
              sh.obj.scale.set(sVal, sVal, sVal);

              const bob = Math.sin(t * 1.45 + sh.floatPhase) * 0.045;
              sh.obj.position.y = sh.scatterTarget.y + bob;
            });
          }
        }

        const cw = constelCanvas.width;
        const ch = constelCanvas.height;
        const needShardProj = st.isScattered || st.isAnimating;
        if (needShardProj) {
          emblemGroup.updateMatrixWorld(true);
          threeRef.current.shards.forEach((sh) => {
            sh.obj.getWorldPosition(projVec);
            projVec.project(camera);
            sh.screenX = (projVec.x * 0.5 + 0.5) * cw;
            sh.screenY = (-projVec.y * 0.5 + 0.5) * ch;
          });
        }

        if (ctxConstel) {
          ctxConstel.clearRect(0, 0, cw, ch);
          const goldRgb = st.isLightMode ? "172, 128, 18" : "212, 175, 55";
          const isMob = cw < 768;

          ctxConstel.beginPath();
          threeRef.current.coreParticles.forEach((p) => {
            p.angle += p.speed * dtMult;
            const targetX = p.baseX + Math.cos(p.angle) * p.radius;
            const targetY = p.baseY + Math.sin(p.angle) * (p.radius * 0.52);

            if (st.isScattered && !isMob) {
              const dx = st.mouseX - (targetX + p.offsetX);
              const dy = st.mouseY - (targetY + p.offsetY);
              const dist = Math.hypot(dx, dy);
              if (dist < 140 && dist > 1) {
                const force = (140 - dist) / 140;
                p.offsetX -= (dx / dist) * force * 14;
                p.offsetY -= (dy / dist) * force * 14;
              }
              p.offsetX *= 0.95;
              p.offsetY *= 0.95;
            }

            const drawX = targetX + p.offsetX;
            const drawY = targetY + p.offsetY;
            ctxConstel.moveTo(drawX + p.size, drawY);
            ctxConstel.arc(drawX, drawY, p.size, 0, Math.PI * 2);
          });
          ctxConstel.fillStyle = `rgba(${goldRgb}, ${st.isLightMode ? 0.65 : 0.58})`;
          ctxConstel.fill();

          if (needShardProj && threeRef.current.shards.length > 1) {
            const cx = cw / 2;
            const cy = ch / 2 - (isMob ? ch * 0.03 : 0);
            const baseAlpha = (isMob ? 0.16 : 0.28) + st.lineIntensityBoost;
            ctxConstel.strokeStyle = `rgba(${goldRgb}, ${Math.min(0.92, baseAlpha)})`;
            ctxConstel.lineWidth = (isMob ? 0.95 : 1.4) + st.lineIntensityBoost * 1.6;
            ctxConstel.lineJoin = "round";
            ctxConstel.beginPath();

            const list = threeRef.current.shards;
            for (let i = 0; i < list.length; i++) {
              const cur = list[i];
              ctxConstel.moveTo(cx, cy);
              ctxConstel.lineTo(cur.screenX, cur.screenY);
              if (i > 0) {
                const prev = list[i - 1];
                ctxConstel.moveTo(prev.screenX, prev.screenY);
                ctxConstel.lineTo(cur.screenX, cur.screenY);
              }
            }
            const first = list[0];
            const last = list[list.length - 1];
            ctxConstel.moveTo(last.screenX, last.screenY);
            ctxConstel.lineTo(first.screenX, first.screenY);
            ctxConstel.stroke();
          }

          if (threeRef.current.shockwaves.length > 0) {
            ctxConstel.save();
            for (const sw of threeRef.current.shockwaves) {
              if (sw.alpha <= 0.01) continue;
              const baseA = Math.max(0, Math.min(1, sw.alpha));
              ctxConstel.strokeStyle = sw.color;
              if (isMob) {
                // Zero-blur double-stroke glow on mobile (no Android Chrome CPU shadowBlur stall)
                ctxConstel.globalAlpha = baseA * 0.24;
                ctxConstel.lineWidth = sw.lineWidth * 2.3;
                ctxConstel.beginPath();
                ctxConstel.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                ctxConstel.stroke();
              } else {
                ctxConstel.shadowColor = sw.color;
                ctxConstel.shadowBlur = 18;
              }
              ctxConstel.globalAlpha = baseA;
              ctxConstel.lineWidth = sw.lineWidth;
              ctxConstel.beginPath();
              ctxConstel.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
              ctxConstel.stroke();
            }
            ctxConstel.restore();
          }

          const sparks = threeRef.current.sparks;
          if (sparks.length > 0) {
            ctxConstel.save();
            for (let i = sparks.length - 1; i >= 0; i--) {
              const sp = sparks[i];
              sp.x += sp.vx;
              sp.y += sp.vy;
              sp.vx *= 0.94;
              sp.vy *= 0.94;
              sp.life++;
              if (sp.life >= sp.maxLife) {
                sparks.splice(i, 1);
                continue;
              }
              const prog = sp.life / sp.maxLife;
              ctxConstel.globalAlpha = (1 - prog) * 0.95;
              ctxConstel.fillStyle = sp.color;
              ctxConstel.beginPath();
              ctxConstel.arc(sp.x, sp.y, sp.size * (1 - prog * 0.5), 0, Math.PI * 2);
              ctxConstel.fill();
            }
            ctxConstel.restore();
          }
        }

        renderer.render(scene, camera);
      };

      animate();
    });

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animId);
      cleanupDomListeners?.();
    };
  }, [ensureAudio, playTick]);

  const activeModalTitle = modalShard
    ? localizedShards?.[modalShard.id - 1]?.title || modalShard.title
    : "";
  const activeModalDesc = modalShard
    ? localizedShards?.[modalShard.id - 1]?.desc || modalShard.desc
    : "";

  return (
    <>
      <style>{`
        @keyframes berandaSpin {
          to { transform: rotate(360deg); }
        }
        .three-stage-wrapper {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
        }
        .three-stage-wrapper #constellationCanvas {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 12;
          opacity: 1;
        }
        .three-stage-canvas,
        .three-stage-canvas canvas {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: auto;
          -webkit-tap-highlight-color: transparent;
        }
        #stage .btn-mecha {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        #stage .btn-mecha:active {
          transform: scale(0.97);
        }
        #stage .hud-hint.active {
          color: #ffd700;
        }
        :root[data-theme="light"] #stage .hud-hint.active {
          color: #9a7409;
        }
        .beranda-action-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          pointer-events: none;
        }
        .btn-mecha-util {
          pointer-events: auto;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          width: 44px;
          height: 44px;
          border-radius: 5px;
          background: var(--glass-bg, rgba(10, 17, 32, 0.72));
          backdrop-filter: var(--glass-blur, blur(14px));
          border: 1px solid rgba(212, 175, 55, 0.38);
          color: #d4af37;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.25s ease, border-color 0.25s ease, transform 0.2s ease, color 0.25s ease;
          font-size: 0.9rem;
        }
        @media (hover: hover) {
          .btn-mecha-util:hover {
            background: rgba(212, 175, 55, 0.18);
            border-color: #d4af37;
            transform: translateY(-2px);
          }
        }
        .btn-mecha-util:active {
          transform: scale(0.94);
        }
        .btn-mecha-util.is-off {
          color: var(--text-secondary, #94a3b8);
          border-color: rgba(148, 163, 184, 0.25);
        }
        .beranda-scroll-cue {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(212, 175, 55, 0.72);
          font-size: 1.35rem;
          animation: floatDownIndicator 2.4s ease-in-out infinite;
          z-index: 20;
          pointer-events: none;
        }
        .phil-kicker {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #d4af37;
          opacity: 0.85;
          margin-bottom: 10px;
        }
        :root[data-theme="light"] .phil-kicker {
          color: #9a7409;
        }
        .phil-rule {
          width: 48px;
          height: 1px;
          margin: 0 auto 14px;
          background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.65), transparent);
        }
        #philModal .phil-content {
          max-height: 82dvh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 768px) {
          #stage .god-rays {
            mix-blend-mode: normal !important;
          }
          #stage .btn-mecha,
          .btn-mecha-util {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: rgba(10, 17, 32, 0.9) !important;
          }
          :root[data-theme="light"] #stage .btn-mecha,
          :root[data-theme="light"] .btn-mecha-util {
            background: rgba(255, 255, 255, 0.94) !important;
          }
          #stage .hud-controls {
            bottom: calc(108px + env(safe-area-inset-bottom, 0px));
            gap: 10px;
            width: 92vw;
          }
          #stage .hud-hint {
            font-size: 0.66rem;
            letter-spacing: 2px;
            line-height: 1.4;
            text-align: center;
          }
          .btn-mecha-util {
            width: 40px;
            height: 40px;
            font-size: 0.82rem;
          }
          .beranda-scroll-cue {
            left: auto;
            right: 18px;
            transform: none;
            bottom: calc(114px + env(safe-area-inset-bottom, 0px));
            font-size: 1.15rem;
            animation: none;
            opacity: 0.68;
          }
        }
      `}</style>

      {loading && (
        <div className="premium-loader" id="loader">
          <div className="circular-loader">
            <div className="loader-ring"></div>
            <div className="loader-ring-active"></div>
            <div className="loader-percent" id="loadPercent">
              {loadProgress}%
            </div>
          </div>
          <div className="loader-lore" id="loaderLore">
            {activeLores[loreIdx % activeLores.length]}
          </div>
          <div className="loader-status">
            {loaderPreparingText || "MENYIAPKAN ARSIP 3D EXPEDIENT..."}
          </div>
        </div>
      )}

      <div
        className={`mecha-stage ${isScattered ? "is-scattered" : ""}`}
        id="stage"
        data-engine="three"
        ref={stageRef}
      >
        <div className="god-rays" id="godRays" ref={godRaysRef}></div>
        <div className="monumental-text" id="monumentalText" ref={monuTextRef}>
          EXPEDIENT
        </div>

        <div className="three-stage-wrapper" id="threeLogoBox">
          <canvas id="constellationCanvas" ref={constelCanvasRef}></canvas>
          <div className="three-stage-canvas" ref={threeMountRef}></div>
        </div>

        <div className="merge-flash" id="flashEffect" ref={flashRef}></div>

        <div className="hud-controls">
          <div className={`hud-hint ${hudHintActive ? "active" : ""}`} id="hudHint">
            {!hudHintActive && (
              <i className="fa-solid fa-arrows-left-right" style={{ marginRight: "8px" }}></i>
            )}
            {hudHint}
          </div>

          <div className="beranda-action-row">
            <button
              type="button"
              className={`btn-mecha-util ${soundEnabled ? "" : "is-off"}`}
              onClick={() => setSoundEnabled((v) => !v)}
              title={soundEnabled ? "Matikan Efek Suara" : "Aktifkan Efek Suara"}
              aria-label="Toggle Efek Suara"
            >
              <i className={`fa-solid ${soundEnabled ? "fa-volume-high" : "fa-volume-xmark"}`}></i>
            </button>

            <button
              type="button"
              className="btn-mecha hover-trigger"
              id="btnAction"
              onClick={handleToggleFormation}
              disabled={isAnimating || loading}
            >
              {isAnimating ? (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ animation: "berandaSpin 1s linear infinite", marginRight: "8px" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {isScattered ? labels.btnProcess : labels.btnAssemble}
                </>
              ) : isScattered ? (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    style={{ marginRight: "8px" }}
                  >
                    <path d="M4 14h6m0 0v6m0-6L3 21M20 10h-6m0 0V4m0 6l7-7" />
                  </svg>
                  {labels.btnUnite}
                </>
              ) : (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    style={{ marginRight: "8px" }}
                  >
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                  {labels.btnScatter}
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-mecha-util"
              onClick={handleResetView}
              title="Reset Posisi Sudut 3D"
              aria-label="Reset Posisi 3D"
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          </div>
        </div>

        <i className="fa-solid fa-chevron-down scroll-indicator beranda-scroll-cue" aria-hidden="true"></i>
      </div>

      <div
        className={`phil-modal ${modalShard ? "active" : ""}`}
        id="philModal"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalShard(null);
        }}
      >
        <div className="phil-content">
          {modalShard && (
            <>
              <div className="phil-kicker">
                Serpihan {String(modalShard.id).padStart(2, "0")} · {modalShard.category}
              </div>
              <div className="phil-rule" aria-hidden="true"></div>
              <h2 className="phil-title" id="modalTitle">
                {activeModalTitle}
              </h2>
              <p className="phil-desc" id="modalDesc">
                {activeModalDesc}
              </p>
              <button
                type="button"
                className="btn-mecha hover-trigger"
                style={{ marginTop: "25px", padding: "10px 25px", fontSize: "0.8rem" }}
                onClick={() => setModalShard(null)}
              >
                {closeLabel.toUpperCase()}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
