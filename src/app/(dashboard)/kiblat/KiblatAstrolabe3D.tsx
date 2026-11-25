"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type CameraPreset = "perspective" | "kaaba" | "top";

export interface KiblatAstrolabe3DProps {
  continuousHeading: number;
  manualOffset: number;
  qiblaBearing: number;
  isAligned: boolean;
  deviceMode: "desktop" | "mobile";
  locale: string;
  preset: CameraPreset;
  onOrbitChange?: (hasCustomOrbit: boolean) => void;
  resetOrbitSignal?: number;
  onDragStart?: () => void;
  onHeadingDrag?: (newContinuousHeading: number) => void;
  onDragEnd?: () => void;
}

interface CameraPresetConfig {
  pitch: number;
  yaw: number;
  dist: number;
  targetY: number;
  targetZ: number;
}

const DESKTOP_PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  perspective: { pitch: 0.72, yaw: 0.0, dist: 5.75, targetY: 0.06, targetZ: 0.18 },
  kaaba: { pitch: 0.42, yaw: 0.16, dist: 2.08, targetY: 0.30, targetZ: 0.0 },
  top: { pitch: 1.45, yaw: 0.0, dist: 7.0, targetY: 0.02, targetZ: -0.24 },
};

const MOBILE_PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  perspective: { pitch: 0.74, yaw: 0.0, dist: 5.95, targetY: 0.06, targetZ: 0.16 },
  kaaba: { pitch: 0.45, yaw: 0.14, dist: 2.25, targetY: 0.30, targetZ: 0.0 },
  top: { pitch: 1.45, yaw: 0.0, dist: 7.15, targetY: 0.02, targetZ: -0.24 },
};

/**
 * Builds a high-contrast photographic watch-studio softbox environment
 * so brushed brass, 24k gold, silver, and marble catch crisp architectural highlights
 * instead of dull uniform grey RoomEnvironment reflections.
 */
function buildHorologyStudioEnv(THREE: any, pmrem: any, isLightMode: boolean) {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(isLightMode ? 0x2a2d34 : 0x090b10);

  const addPanel = (w: number, h: number, pos: [number, number, number], lookAt: [number, number, number], col: number, intensity: number) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const c = new THREE.Color(col).multiplyScalar(intensity);
    const mat = new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.lookAt(...lookAt);
    envScene.add(mesh);
  };

  // Overhead warm-white main softbox strip
  addPanel(7, 3.2, [3.5, 6.5, 4.2], [0, 0, 0], 0xfff6e5, isLightMode ? 2.4 : 2.1);
  // Cool architectural side fill strip
  addPanel(5, 4.5, [-6.0, 3.0, 2.5], [0, 0, 0], 0xcfe2ff, isLightMode ? 1.3 : 1.05);
  // Warm golden rim strip behind Kursi & Ka'bah
  addPanel(6.5, 2.2, [0.5, 4.2, -6.5], [0, 0, 0], 0xffe4aa, 1.9);
  // Subtle lower warm bounce
  addPanel(6, 6, [0, -5.5, 0], [0, 0, 0], 0x3b3326, 0.55);

  const rt = pmrem.fromScene(envScene, 0.035);
  envScene.traverse((obj: any) => {
    obj.geometry?.dispose?.();
    obj.material?.dispose?.();
  });
  return rt;
}

export default function KiblatAstrolabe3D({
  continuousHeading,
  manualOffset,
  qiblaBearing,
  isAligned,
  deviceMode,
  locale,
  preset,
  onOrbitChange,
  resetOrbitSignal = 0,
  onDragStart,
  onHeadingDrag,
  onDragEnd,
}: KiblatAstrolabe3DProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadPct, setLoadPct] = useState(0);

  const liveRef = useRef({
    targetDialDeg: continuousHeading + manualOffset,
    targetBearingDeg: qiblaBearing,
    isAligned,
    deviceMode,
    preset,
    isLightMode: false,
    isInViewport: true,
    orbitYawOffset: 0,
    orbitPitchOffset: 0,
    hasCustomOrbit: false,
    dragMode: null as "compass" | "orbit" | null,
    startPointerAngle: 0,
    startContinuous: continuousHeading,
    lastClientX: 0,
    lastClientY: 0,
  });

  liveRef.current.targetDialDeg = continuousHeading + manualOffset;
  liveRef.current.targetBearingDeg = qiblaBearing;
  liveRef.current.isAligned = isAligned;
  liveRef.current.deviceMode = deviceMode;
  liveRef.current.preset = preset;

  const callbacksRef = useRef({ onDragStart, onHeadingDrag, onDragEnd, onOrbitChange });
  callbacksRef.current = { onDragStart, onHeadingDrag, onDragEnd, onOrbitChange };

  // Reset custom orbit when preset changes or reset button triggered
  useEffect(() => {
    liveRef.current.orbitYawOffset = 0;
    liveRef.current.orbitPitchOffset = 0;
    if (liveRef.current.hasCustomOrbit) {
      liveRef.current.hasCustomOrbit = false;
      callbacksRef.current.onOrbitChange?.(false);
    }
  }, [preset, resetOrbitSignal]);

  // Sync root theme attribute
  useEffect(() => {
    if (typeof document === "undefined") return;
    const syncTheme = () => {
      liveRef.current.isLightMode =
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
    const mount = mountRef.current;
    const stageEl = stageRef.current;
    if (!mount || !stageEl) return;

    let isCancelled = false;
    let rafId = 0;
    let renderer: any = null;
    let scene: any = null;
    let envRT: any = null;
    let pmrem: any = null;
    let resizeObs: ResizeObserver | null = null;
    let interObs: IntersectionObserver | null = null;
    let onVisChange: (() => void) | null = null;
    const reduceMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduceMotion = Boolean(reduceMotionQuery?.matches);
    const onReduceMotionChange = (ev: MediaQueryListEvent) => {
      reduceMotion = ev.matches;
    };
    reduceMotionQuery?.addEventListener?.("change", onReduceMotionChange);

    Promise.all([
      import("three"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
    ]).then(([THREE, { GLTFLoader }]) => {
      if (isCancelled || !mount) return;

      const width = mount.clientWidth || 620;
      const height = mount.clientHeight || 480;
      const isMobInit = window.innerWidth < 768;

      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);

      renderer = new THREE.WebGLRenderer({
        antialias: !isMobInit,
        alpha: true,
        powerPreference: "high-performance",
      });

      // Enable real soft architectural sunlight shadows on Desktop only!
      renderer.shadowMap.enabled = !isMobInit;
      if (!isMobInit) {
        renderer.shadowMap.type = THREE.PCFShadowMap;
      }

      // 3-Tier Adaptive GPU Detection (Desktop full PBR+Shadows, Mid/High Mobile like OPPO A96 clean PBR, Entry-Level Lite Phong)
      let gpuName = "";
      try {
        const gl = renderer.getContext();
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        if (dbg) {
          gpuName = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
        }
      } catch {}

      const navAny = navigator as unknown as { deviceMemory?: number };
      const devMem = typeof navAny.deviceMemory === "number" ? navAny.deviceMemory : null;
      const cpuCores = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : null;
      const isUltraEntryGpu =
        /PowerVR.*(GE8320|GE8322|GE8300|GE8100)|Adreno.*(30\d|40\d|504|505|506|508|509|510)|Mali-4\d\d|Mali-T7\d\d|Mali-T8[23]0|Mali-G31/i.test(
          gpuName
        );
      let isLiteTier =
        isMobInit &&
        (isUltraEntryGpu ||
          (devMem !== null && devMem <= 4) ||
          (cpuCores !== null && cpuCores <= 4));

      const getDpr = (w: number) => {
        if (w >= 768) {
          // Minimum 1.5x supersampling on 1080p desktop monitors so oblique dial text & calligraphy stay razor-sharp
          return Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.5);
        }
        return Math.min(window.devicePixelRatio || 1, isLiteTier ? 1.0 : 1.15);
      };

      renderer.setPixelRatio(getDpr(window.innerWidth));
      renderer.setSize(width, height, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.touchAction = isMobInit ? "pan-y" : "none";
      mount.innerHTML = "";
      mount.appendChild(renderer.domElement);

      if (!isLiteTier) {
        pmrem = new THREE.PMREMGenerator(renderer);
        envRT = buildHorologyStudioEnv(THREE, pmrem, liveRef.current.isLightMode);
        scene.environment = envRT.texture;
        if ("environmentIntensity" in scene) {
          (scene as any).environmentIntensity = isMobInit ? 0.85 : 1.0;
        }
      }

      // Photographic Architectural Studio Lighting (Zero flat wash, crisp directional shadow on Desktop)
      const ambientLight = new THREE.AmbientLight(0xffffff, isLiteTier ? 0.65 : isMobInit ? 0.34 : 0.24);
      scene.add(ambientLight);

      let hemiLight: any = null;
      if (isLiteTier) {
        hemiLight = new THREE.HemisphereLight(0xfff5e0, 0x202736, 0.9);
        scene.add(hemiLight);
      }

      const keyLight = new THREE.DirectionalLight(0xfff4e0, isMobInit ? 1.85 : 2.15);
      keyLight.position.set(3.2, 5.4, 3.6);
      if (!isMobInit) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 1.0;
        keyLight.shadow.camera.far = 14.0;
        const d = 2.4;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.0003;
        keyLight.shadow.normalBias = 0.012;
      }
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xb8d4ff, isMobInit ? 0.55 : 0.48);
      fillLight.position.set(-4.2, 2.8, 2.4);
      scene.add(fillLight);

      if (!isMobInit) {
        const rimLight = new THREE.DirectionalLight(0xffe0a3, 1.35);
        rimLight.position.set(-0.4, 3.2, -4.8);
        scene.add(rimLight);
      }

      const convertGroupToLitePhong = (rootObj: any) => {
        const matCache = new Map<any, any>();
        rootObj.traverse((child: any) => {
          if (!child.isMesh || !child.material) return;
          const mapSingle = (mat: any) => {
            if (mat.isMeshPhongMaterial) return mat;
            if (matCache.has(mat)) return matCache.get(mat);
            const hasOrm = !!(mat.metalnessMap || mat.roughnessMap);
            const phong = new THREE.MeshPhongMaterial({
              color: mat.color ? mat.color.clone() : new THREE.Color(0xffffff),
              map: mat.map || null,
              normalMap: mat.normalMap || null,
              normalScale: mat.normalScale ? mat.normalScale.clone() : new THREE.Vector2(1, 1),
              emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000),
              emissiveIntensity: mat.emissiveIntensity ?? 1,
              specular: new THREE.Color(hasOrm ? 0.42 : 0.48, hasOrm ? 0.39 : 0.44, hasOrm ? 0.32 : 0.35),
              shininess: hasOrm ? 54 : 62,
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

      let rootGroup: any = null;
      let dialGroup: any = null;
      let qiblaGroup: any = null;
      let lubberMat: any = null;
      let qiblaGemMat: any = null;

      const activateLiteTier = () => {
        if (isLiteTier || !isMobInit) return;
        isLiteTier = true;
        const w = mount.clientWidth || 340;
        const h = mount.clientHeight || 340;
        renderer.setPixelRatio(1);
        renderer.setSize(w, h);
        scene.environment = null;
        if (envRT) {
          envRT.dispose();
          envRT = null;
        }
        if (pmrem) {
          pmrem.dispose();
          pmrem = null;
        }
        ambientLight.intensity = 0.65;
        if (!hemiLight) {
          hemiLight = new THREE.HemisphereLight(0xfff5e0, 0x202736, 0.9);
          scene.add(hemiLight);
        }
        if (rootGroup) convertGroupToLitePhong(rootGroup);
        try {
          renderer.compile(scene, camera);
        } catch {}
      };

      const modelUrl = isMobInit
        ? "/assets/models/qibla-astrolabe-mobile.glb?v=3"
        : "/assets/models/qibla-astrolabe.glb?v=3";

      const maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy?.() || 1);
      const targetAniso = isMobInit ? Math.min(4, maxAniso) : maxAniso;

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          if (isCancelled) return;
          rootGroup = gltf.scene;
          rootGroup.traverse((obj: any) => {
            if (obj.name === "Dial_Group") dialGroup = obj;
            if (obj.name === "Qibla_Group") qiblaGroup = obj;
            if (obj.name === "Lubber_Crystal" && obj.isMesh) lubberMat = obj.material;
            if (obj.name === "Qibla_Tip_Gem" && obj.isMesh) qiblaGemMat = obj.material;

            if (obj.isMesh && obj.material) {
              // Apply 16x Anisotropic Filtering on Desktop (4x Mobile) so angled dial & Kiswah textures stay crystal-sharp!
              const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
              for (const m of mats) {
                for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap"]) {
                  const tex = m[key];
                  if (tex) {
                    tex.anisotropy = targetAniso;
                    tex.minFilter = THREE.LinearMipmapLinearFilter;
                    tex.magFilter = THREE.LinearFilter;
                    tex.needsUpdate = true;
                  }
                }
              }

              if (!isMobInit) {
                obj.castShadow = obj.name !== "Dial_Plate" && obj.name !== "Astrolabe_Inner_Bowl";
                obj.receiveShadow = true;
              }
            }
          });

          if (isLiteTier) {
            convertGroupToLitePhong(rootGroup);
          }

          if (dialGroup) {
            dialGroup.rotation.y = THREE.MathUtils.degToRad(liveRef.current.targetDialDeg);
          }
          if (qiblaGroup) {
            qiblaGroup.rotation.y = -THREE.MathUtils.degToRad(liveRef.current.targetBearingDeg);
          }

          scene.add(rootGroup);
          try {
            renderer.compile(scene, camera);
          } catch {}
          setLoadPct(100);
          setLoading(false);
        },
        (xhr) => {
          if (xhr.total > 0) {
            setLoadPct(Math.min(99, Math.round((xhr.loaded / xhr.total) * 100)));
          }
        },
        (err) => {
          console.error("Failed to load 3D Qibla Astrolabe:", err);
          setLoading(false);
        }
      );

      const handleResize = () => {
        if (!mount || !renderer) return;
        const w = mount.clientWidth || 340;
        const h = mount.clientHeight || 340;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(getDpr(window.innerWidth));
        renderer.setSize(w, h, false);
      };
      resizeObs = new ResizeObserver(handleResize);
      resizeObs.observe(mount);

      interObs = new IntersectionObserver(
        (entries) => {
          liveRef.current.isInViewport = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.05 }
      );
      interObs.observe(stageEl);

      onVisChange = () => {
        liveRef.current.isInViewport = document.visibilityState !== "hidden";
      };
      document.addEventListener("visibilitychange", onVisChange);

      const initTable = isMobInit ? MOBILE_PRESETS : DESKTOP_PRESETS;
      const initCfg = initTable[liveRef.current.preset];
      const initAspectMult =
        liveRef.current.preset === "kaaba" ? 1.0 : Math.max(1.0, 1.15 / Math.max(0.65, camera.aspect));
      let curDialDeg = liveRef.current.targetDialDeg;
      let curBearingDeg = liveRef.current.targetBearingDeg;
      let curPitch = initCfg.pitch;
      let curYaw = initCfg.yaw;
      let curDist = initCfg.dist * initAspectMult;
      let curTgtY = initCfg.targetY;
      let curTgtZ = initCfg.targetZ;
      let alignedBlend = liveRef.current.isAligned ? 1 : 0;

      const brassCol = new THREE.Color(0xdba942);
      const emeraldCol = new THREE.Color(0x2bb97c);

      let lastTs = performance.now();
      let lastRenderTs = lastTs;
      let slowFrames = 0;
      let measuredFrames = 0;
      let autoDowngraded = false;

      const animate = (now: number) => {
        if (isCancelled) return;
        rafId = requestAnimationFrame(animate);

        if (!liveRef.current.isInViewport) {
          lastTs = now;
          lastRenderTs = now;
          return;
        }

        if (isLiteTier && now - lastRenderTs < 32) {
          return;
        }
        const dtMs = Math.min(80, Math.max(4, now - lastRenderTs));
        lastRenderTs = now;
        const dtNorm = dtMs / 16.67;

        if (isMobInit && !isLiteTier && !autoDowngraded && rootGroup) {
          const frameMs = now - lastTs;
          lastTs = now;
          if (frameMs > 42) slowFrames++;
          measuredFrames++;
          if (measuredFrames >= 24) {
            if (slowFrames >= 12 && (devMem === null || devMem < 8)) {
              autoDowngraded = true;
              activateLiteTier();
            }
            measuredFrames = 0;
            slowFrames = 0;
          }
        } else {
          lastTs = now;
        }

        const st = liveRef.current;
        const presetTable = window.innerWidth < 768 ? MOBILE_PRESETS : DESKTOP_PRESETS;
        const cfg = presetTable[st.preset];

        const dampDial = st.dragMode === "compass" ? 0.55 : 0.16;
        const factorDial = 1 - Math.pow(1 - dampDial, dtNorm);
        curDialDeg += (st.targetDialDeg - curDialDeg) * factorDial;
        curBearingDeg += (st.targetBearingDeg - curBearingDeg) * 0.25;

        if (dialGroup) {
          dialGroup.rotation.y = THREE.MathUtils.degToRad(curDialDeg);
        }
        if (qiblaGroup) {
          qiblaGroup.rotation.y = -THREE.MathUtils.degToRad(curBearingDeg);
        }

        const tgtPitch = THREE.MathUtils.clamp(cfg.pitch + st.orbitPitchOffset, 0.22, 1.48);
        const tgtYaw = cfg.yaw + st.orbitYawOffset;
        const aspectMult =
          st.preset === "kaaba" ? 1.0 : Math.max(1.0, 1.15 / Math.max(0.65, camera.aspect));
        const overheadDistBoost =
          st.preset === "perspective" ? Math.max(0, tgtPitch - 0.85) * 1.45 : 0;
        const tgtDist = (cfg.dist + overheadDistBoost) * aspectMult;

        const camEase = reduceMotion ? 1 : 1 - Math.pow(1 - 0.13, dtNorm);
        curPitch += (tgtPitch - curPitch) * camEase;
        curYaw += (tgtYaw - curYaw) * camEase;
        curDist += (tgtDist - curDist) * camEase;
        curTgtY += (cfg.targetY - curTgtY) * camEase;
        curTgtZ += (cfg.targetZ - curTgtZ) * camEase;

        camera.position.set(
          curDist * Math.cos(curPitch) * Math.sin(curYaw),
          curTgtY + curDist * Math.sin(curPitch),
          curTgtZ + curDist * Math.cos(curPitch) * Math.cos(curYaw)
        );
        camera.lookAt(0, curTgtY, curTgtZ);

        // Restrained, deliberate alignment glow (only the tiny vernier sight & emerald jewel brighten)
        alignedBlend += ((st.isAligned ? 1 : 0) - alignedBlend) * Math.min(1, 0.14 * dtNorm);
        if (lubberMat && lubberMat.emissive) {
          lubberMat.emissive.copy(brassCol).lerp(emeraldCol, alignedBlend);
          if (lubberMat.color) lubberMat.color.copy(brassCol).lerp(emeraldCol, alignedBlend);
          if ("emissiveIntensity" in lubberMat) {
            lubberMat.emissiveIntensity = 0.25 + alignedBlend * 1.15;
          }
        }
        if (qiblaGemMat && "emissiveIntensity" in qiblaGemMat) {
          qiblaGemMat.emissiveIntensity = 0.35 + alignedBlend * 1.1;
        }

        renderer.render(scene, camera);
      };

      rafId = requestAnimationFrame(animate);
    });

    return () => {
      isCancelled = true;
      cancelAnimationFrame(rafId);
      resizeObs?.disconnect();
      interObs?.disconnect();
      if (onVisChange) document.removeEventListener("visibilitychange", onVisChange);
      reduceMotionQuery?.removeEventListener?.("change", onReduceMotionChange);
      if (scene) {
        scene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m: any) => {
              m.map?.dispose?.();
              m.normalMap?.dispose?.();
              m.roughnessMap?.dispose?.();
              m.metalnessMap?.dispose?.();
              m.dispose?.();
            });
          }
        });
      }
      envRT?.dispose?.();
      pmrem?.dispose?.();
      renderer?.dispose?.();
      if (renderer?.domElement?.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  const computePointerAngle = (clientX: number, clientY: number) => {
    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = Math.atan2(clientX - cx, -(clientY - cy)) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return deg;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = liveRef.current;
    if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      st.dragMode = "orbit";
      st.lastClientX = e.clientX;
      st.lastClientY = e.clientY;
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return;
    if (e.pointerType === "touch" && st.deviceMode === "mobile") return;

    st.dragMode = "compass";
    st.startPointerAngle = computePointerAngle(e.clientX, e.clientY);
    st.startContinuous = continuousHeading;
    e.currentTarget.setPointerCapture(e.pointerId);
    callbacksRef.current.onDragStart?.();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = liveRef.current;
    if (st.dragMode === "orbit") {
      const dx = e.clientX - st.lastClientX;
      const dy = e.clientY - st.lastClientY;
      st.lastClientX = e.clientX;
      st.lastClientY = e.clientY;
      st.orbitYawOffset -= dx * 0.0075;
      st.orbitPitchOffset = Math.max(-0.55, Math.min(0.85, st.orbitPitchOffset + dy * 0.0065));
      if (!st.hasCustomOrbit) {
        st.hasCustomOrbit = true;
        callbacksRef.current.onOrbitChange?.(true);
      }
      return;
    }
    if (st.dragMode === "compass") {
      const curAngle = computePointerAngle(e.clientX, e.clientY);
      const delta = ((curAngle - st.startPointerAngle + 540) % 360) - 180;
      callbacksRef.current.onHeadingDrag?.(st.startContinuous - delta);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = liveRef.current;
    if (st.dragMode === "compass") callbacksRef.current.onDragEnd?.();
    st.dragMode = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const st = liveRef.current;
    const stepDeg = e.shiftKey ? 15 : 5;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      callbacksRef.current.onDragStart?.();
      callbacksRef.current.onHeadingDrag?.(continuousHeading - stepDeg);
      callbacksRef.current.onDragEnd?.();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      callbacksRef.current.onDragStart?.();
      callbacksRef.current.onHeadingDrag?.(continuousHeading + stepDeg);
      callbacksRef.current.onDragEnd?.();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      st.orbitPitchOffset = Math.max(-0.55, st.orbitPitchOffset - 0.12);
      if (!st.hasCustomOrbit) {
        st.hasCustomOrbit = true;
        callbacksRef.current.onOrbitChange?.(true);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      st.orbitPitchOffset = Math.min(0.85, st.orbitPitchOffset + 0.12);
      if (!st.hasCustomOrbit) {
        st.hasCustomOrbit = true;
        callbacksRef.current.onOrbitChange?.(true);
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      callbacksRef.current.onHeadingDrag?.(qiblaBearing);
    }
  };

  const normalizedAriaHeading = Math.round(((((continuousHeading + manualOffset) % 360) + 360) % 360) * 10) / 10;

  return (
    <div ref={stageRef} className="astrolabe-3d-shell">
      <div
        ref={mountRef}
        className="astrolabe-3d-canvas-wrap"
        role="slider"
        tabIndex={0}
        aria-label={
          locale === "ar"
            ? "بوصلة القبلة ثلاثية الأبعاد، استخدم الأسهم لتدوير البوصلة أو ضبط الزاوية"
            : locale === "en"
            ? "3D Qibla compass, use Left/Right arrow keys to rotate or Up/Down to tilt view"
            : "Kompas Kiblat 3D, gunakan panah Kiri/Kanan untuk memutar kompas atau Atas/Bawah untuk sudut kamera"
        }
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={normalizedAriaHeading}
        aria-valuetext={`${normalizedAriaHeading}°`}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        title={
          deviceMode === "desktop"
            ? locale === "ar"
              ? "اسحب بالزر الأيسر لتدوير البوصلة · بالزر الأيمن لزاوية الكاميرا"
              : locale === "en"
              ? "Left-drag to rotate compass · Right-drag to orbit 3D view"
              : "Klik kiri & geser: putar kompas · Klik kanan & geser: orbit sudut 3D"
            : locale === "ar"
            ? "أمسك الهاتف أفقياً وأدر جسمك نحو القبلة"
            : locale === "en"
            ? "Hold phone flat and rotate to align with Qibla"
            : "Pegang HP mendatar dan putar untuk membidik Kiblat"
        }
      />

      {loading && (
        <div className="astrolabe-3d-loader" role="status" aria-live="polite">
          <div className="astrolabe-3d-spinner" aria-hidden="true" />
          <span>{loadPct}%</span>
        </div>
      )}
    </div>
  );
}
