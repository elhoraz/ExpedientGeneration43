"use client";

import { useCallback, useEffect, useRef } from "react";

interface AudioEngineRefs {
  ctx: AudioContext | null;
  master: AudioNode | null;
  pinkNoiseBuf: AudioBuffer | null;
}

/**
 * Procedural Mecha Foley & Spatial Audio Engine (Master Compressor + Pink Noise).
 */
export function useMechaAudio(soundEnabledRef: React.MutableRefObject<boolean>) {
  const audioRef = useRef<AudioEngineRefs>({
    ctx: null,
    master: null,
    pinkNoiseBuf: null,
  });

  useEffect(() => {
    const engine = audioRef.current;
    return () => {
      if (engine.ctx) {
        try {
          engine.ctx.close();
        } catch {}
        engine.ctx = null;
        engine.master = null;
        engine.pinkNoiseBuf = null;
      }
    };
  }, []);

  const ensureAudio = useCallback(() => {
    if (!soundEnabledRef.current) return null;
    if (!audioRef.current.ctx && typeof window !== "undefined") {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        const ctx: AudioContext = new AC();
        audioRef.current.ctx = ctx;

        const comp = ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-14, ctx.currentTime);
        comp.knee.setValueAtTime(16, ctx.currentTime);
        comp.ratio.setValueAtTime(5, ctx.currentTime);
        comp.attack.setValueAtTime(0.004, ctx.currentTime);
        comp.release.setValueAtTime(0.14, ctx.currentTime);

        const master = ctx.createGain();
        master.gain.setValueAtTime(0.88, ctx.currentTime);
        comp.connect(master);
        master.connect(ctx.destination);
        audioRef.current.master = comp;

        // Pre-bake 2s pink noise buffer (Kellet filter) for realistic pressurized air & dry steel transients
        const sr = ctx.sampleRate;
        const buf = ctx.createBuffer(1, sr * 2, sr);
        const out = buf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < out.length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
        audioRef.current.pinkNoiseBuf = buf;
      }
    }
    if (audioRef.current.ctx && audioRef.current.ctx.state === "suspended") {
      audioRef.current.ctx.resume().catch(() => {});
    }
    return audioRef.current.ctx;
  }, [soundEnabledRef]);

  const getDest = useCallback((ctx: AudioContext): AudioNode => {
    return audioRef.current.master || ctx.destination;
  }, []);

  const playTick = useCallback(
    (velocity: number) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      try {
        const dest = getDest(ctx);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(dest);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(340 + Math.min(velocity * 10, 360), ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.024);
        gain.gain.setValueAtTime(0.032, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
      } catch {}
    },
    [ensureAudio, getDest]
  );

  const playPneumaticHiss = useCallback(
    (delaySec = 0, durSec = 0.45, peakGain = 0.14, freqStart = 2800, freqEnd = 520) => {
      const ctx = ensureAudio();
      const buf = audioRef.current.pinkNoiseBuf;
      if (!ctx || !buf) return;
      try {
        const dest = getDest(ctx);
        const t0 = ctx.currentTime + delaySec;

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;

        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.setValueAtTime(340, t0);

        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.Q.setValueAtTime(1.1, t0);
        lp.frequency.setValueAtTime(freqStart, t0);
        lp.frequency.exponentialRampToValueAtTime(freqEnd, t0 + durSec);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.022);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + durSec);

        src.connect(hp);
        hp.connect(lp);
        lp.connect(gain);
        gain.connect(dest);
        src.start(t0, Math.random() * 0.8);
        src.stop(t0 + durSec + 0.03);
      } catch {}
    },
    [ensureAudio, getDest]
  );

  const playServoGlide = useCallback(
    (startHz = 110, endHz = 220, durSec = 0.85, delaySec = 0, peakGain = 0.055) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      try {
        const dest = getDest(ctx);
        const t0 = ctx.currentTime + delaySec;

        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.Q.setValueAtTime(1.6, t0);
        bp.frequency.setValueAtTime(420, t0);
        bp.frequency.exponentialRampToValueAtTime(endHz > startHz ? 960 : 380, t0 + durSec);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0005, t0);
        gain.gain.linearRampToValueAtTime(peakGain, t0 + Math.min(0.1, durSec * 0.25));
        gain.gain.setValueAtTime(peakGain * 0.85, t0 + durSec * 0.65);
        gain.gain.exponentialRampToValueAtTime(0.0005, t0 + durSec);

        bp.connect(gain);
        gain.connect(dest);

        [
          { type: "triangle" as OscillatorType, mult: 1.0 },
          { type: "sine" as OscillatorType, mult: 2.008 },
        ].forEach((layer) => {
          const osc = ctx.createOscillator();
          osc.type = layer.type;
          osc.frequency.setValueAtTime(startHz * layer.mult, t0);
          osc.frequency.exponentialRampToValueAtTime(endHz * layer.mult, t0 + durSec);
          osc.connect(bp);
          osc.start(t0);
          osc.stop(t0 + durSec + 0.03);
        });
      } catch {}
    },
    [ensureAudio, getDest]
  );

  const playMechaClick = useCallback(
    (pitchScale = 1.0, delaySec = 0, vol = 0.22) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      try {
        const dest = getDest(ctx);
        const t0 = ctx.currentTime + delaySec;

        const punch = ctx.createOscillator();
        const pGain = ctx.createGain();
        punch.type = "sine";
        punch.frequency.setValueAtTime(96 * pitchScale, t0);
        punch.frequency.exponentialRampToValueAtTime(36, t0 + 0.048);
        pGain.gain.setValueAtTime(vol * 1.15, t0);
        pGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.095);
        punch.connect(pGain);
        pGain.connect(dest);
        punch.start(t0);
        punch.stop(t0 + 0.11);

        const buf = audioRef.current.pinkNoiseBuf;
        if (buf) {
          const nSrc = ctx.createBufferSource();
          nSrc.buffer = buf;
          const nBp = ctx.createBiquadFilter();
          nBp.type = "bandpass";
          nBp.frequency.setValueAtTime(1650 * pitchScale, t0);
          nBp.Q.setValueAtTime(2.2, t0);
          const nG = ctx.createGain();
          nG.gain.setValueAtTime(vol * 0.85, t0);
          nG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.032);
          nSrc.connect(nBp);
          nBp.connect(nG);
          nG.connect(dest);
          nSrc.start(t0, Math.random() * 0.5);
          nSrc.stop(t0 + 0.045);
        }

        [0, 0.042].forEach((offset, step) => {
          const tapT = t0 + offset;
          const amp = step === 0 ? vol * 0.2 : vol * 0.14;
          const base = (step === 0 ? 740 : 1080) * pitchScale;
          [1.0, 1.61].forEach((ratio) => {
            const mOsc = ctx.createOscillator();
            const mG = ctx.createGain();
            mOsc.type = "sine";
            mOsc.frequency.setValueAtTime(base * ratio, tapT);
            mG.gain.setValueAtTime(amp, tapT);
            mG.gain.exponentialRampToValueAtTime(0.0005, tapT + 0.045);
            mOsc.connect(mG);
            mG.connect(dest);
            mOsc.start(tapT);
            mOsc.stop(tapT + 0.055);
          });
        });
      } catch {}
    },
    [ensureAudio, getDest]
  );

  const playBassDrop = useCallback(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      const dest = getDest(ctx);
      const now = ctx.currentTime;

      const sub = ctx.createOscillator();
      const sGain = ctx.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(78, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 0.95);
      sGain.gain.setValueAtTime(0.46, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
      sub.connect(sGain);
      sGain.connect(dest);
      sub.start(now);
      sub.stop(now + 1.2);

      const padLp = ctx.createBiquadFilter();
      padLp.type = "lowpass";
      padLp.frequency.setValueAtTime(860, now);
      padLp.frequency.exponentialRampToValueAtTime(320, now + 1.65);
      padLp.connect(dest);

      [146.83, 220.0, 329.63, 440.0].forEach((hz, idx) => {
        const cOsc = ctx.createOscillator();
        const cGain = ctx.createGain();
        cOsc.type = idx < 2 ? "triangle" : "sine";
        const st = now + idx * 0.03;
        cOsc.frequency.setValueAtTime(hz, st);
        cGain.gain.setValueAtTime(0.001, st);
        cGain.gain.linearRampToValueAtTime(idx < 2 ? 0.042 : 0.025, st + 0.06);
        cGain.gain.exponentialRampToValueAtTime(0.0005, st + 1.55);
        cOsc.connect(cGain);
        cGain.connect(padLp);
        cOsc.start(st);
        cOsc.stop(st + 1.62);
      });
    } catch {}
  }, [ensureAudio, getDest]);

  return {
    ensureAudio,
    playTick,
    playPneumaticHiss,
    playServoGlide,
    playMechaClick,
    playBassDrop,
  };
}
