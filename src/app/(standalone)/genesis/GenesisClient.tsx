"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

export default function GenesisClient({ userId }: { userId: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSingularity, setIsSingularity] = useState(false);
    const isSingularityRef = useRef(false);
    const [showRevelation, setShowRevelation] = useState(false);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        isSingularityRef.current = isSingularity;
    }, [isSingularity]);

    useEffect(() => {
        document.body.classList.add("page-genesis");
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let particleArray: any[] = [];
        const mouse = { x: undefined as number | undefined, y: undefined as number | undefined, radius: 80 };

        const onMouseMove = (event: MouseEvent) => { mouse.x = event.clientX; mouse.y = event.clientY; };
        const onTouchMove = (event: TouchEvent) => { mouse.x = event.touches[0].clientX; mouse.y = event.touches[0].clientY; };
        const onLeave = () => { mouse.x = undefined; mouse.y = undefined; };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('mouseleave', onLeave);
        window.addEventListener('touchend', onLeave);

        class Particle {
            x: number; y: number; baseX: number; baseY: number; size: number; color: string; density: number;
            constructor(x: number, y: number, color: string) {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.baseX = x;
                this.baseY = y;
                this.size = (Math.random() * 1.5) + 0.5;
                this.color = color;
                this.density = (Math.random() * 30) + 1;
            }
            draw() {
                ctx!.fillStyle = this.color;
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.closePath();
                ctx!.fill();
            }
            update(isSing: boolean) {
                if (isSing) return;
                const dx = (mouse.x || -1000) - this.x;
                const dy = (mouse.y || -1000) - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (mouse.radius - distance) / mouse.radius;
                const directionX = forceDirectionX * force * this.density;
                const directionY = forceDirectionY * force * this.density;

                if (distance < mouse.radius) {
                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    if (this.x !== this.baseX) { this.x -= (this.x - this.baseX) / 10; }
                    if (this.y !== this.baseY) { this.y -= (this.y - this.baseY) / 10; }
                }
            }
        }

        const initParticles = () => {
            particleArray = [];
            const image = new Image();
            image.src = '/images/logo-utuh.webp';

            image.onload = () => {
                const isMobile = window.innerWidth <= 768;
                const logoWidth = isMobile ? 250 : 400;
                const scale = logoWidth / image.width;
                const logoHeight = image.height * scale;

                const startX = (canvas!.width - logoWidth) / 2;
                const startY = (canvas!.height - logoHeight) / 2 - 50;

                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                if (!tempCtx) return;
                tempCanvas.width = logoWidth;
                tempCanvas.height = logoHeight;

                tempCtx.drawImage(image, 0, 0, logoWidth, logoHeight);
                const pixels = tempCtx.getImageData(0, 0, logoWidth, logoHeight).data;

                const step = isMobile ? 5 : 3;

                for (let y = 0; y < logoHeight; y += step) {
                    for (let x = 0; x < logoWidth; x += step) {
                        const index = (y * logoWidth + x) * 4;
                        const alpha = pixels[index + 3];

                        if (alpha > 128) {
                            const r = pixels[index];
                            const g = pixels[index + 1];
                            const b = pixels[index + 2];
                            const color = `rgb(${r}, ${g}, ${b})`;

                            const positionX = x + startX;
                            const positionY = y + startY;

                            particleArray.push(new Particle(positionX, positionY, color));
                        }
                    }
                }
            };
        };

        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        initParticles();

        // Store particle array in ref to be accessible by singularity event
        (canvas as any).particleArray = particleArray;

        const animate = () => {
            if (reducedMotion) {
                ctx.fillStyle = 'rgba(6, 11, 20, 0.9)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < particleArray.length; i++) {
                    particleArray[i].x = particleArray[i].baseX;
                    particleArray[i].y = particleArray[i].baseY;
                    particleArray[i].draw();
                }
                return;
            }
            if (!isSingularityRef.current && !(canvas as any).isSingularityStarted) {
                ctx.fillStyle = 'rgba(6, 11, 20, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                for (let i = 0; i < particleArray.length; i++) {
                    particleArray[i].draw();
                    particleArray[i].update((canvas as any).isSingularityStarted);
                }
            }
            animationRef.current = requestAnimationFrame(animate);
        };
        animate();

        const onResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
            if (reducedMotion) animate();
        };
        window.addEventListener('resize', onResize);

        return () => {
            document.body.classList.remove("page-genesis");
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('mouseleave', onLeave);
            window.removeEventListener('touchend', onLeave);
            window.removeEventListener('resize', onResize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const triggerSingularity = () => {
        if (isSingularity) return;
        setIsSingularity(true);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        (canvas as any).isSingularityStarted = true;
        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setShowRevelation(true);
            return;
        }

        if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 200, 500]);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const particleArray = (canvas as any).particleArray || [];

        gsap.to(particleArray, {
            x: centerX,
            y: centerY,
            duration: 1.5,
            ease: "power2.in",
            stagger: { amount: 0.7, from: "random" },
            onUpdate: () => {
                ctx.fillStyle = 'rgba(6, 11, 20, 0.25)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < particleArray.length; i++) {
                    particleArray[i].draw();
                }
            },
            onComplete: () => {
                if (navigator.vibrate) navigator.vibrate([1000]);

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                gsap.to(particleArray, {
                    x: () => centerX + (Math.random() - 0.5) * window.innerWidth * 2,
                    y: () => centerY + (Math.random() - 0.5) * window.innerHeight * 2,
                    duration: 1.8,
                    ease: "expo.out",
                    onUpdate: () => {
                        ctx.fillStyle = 'rgba(6, 11, 20, 0.4)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        for (let i = 0; i < particleArray.length; i++) {
                            particleArray[i].draw();
                        }
                    },
                    onComplete: () => {
                        setShowRevelation(true);
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                });
            }
        });
    };

    return (
        <>
            <style>{`
        :root { --genesis-gold: #d4af37; --genesis-dark: var(--bg-main, #060b14); }
        body.page-genesis { margin: 0; padding: 0; background-color: var(--bg-main, #060b14); color: var(--text-primary, #ffffff); overflow: hidden; user-select: text; font-family: var(--font-sans, inherit); height: 100dvh; width: 100%; }
        .btn-back-vault { position: absolute; top: max(20px, calc(env(safe-area-inset-top, 16px) + 6px)); inset-inline-start: max(20px, env(safe-area-inset-left, 16px)); z-index: 100; display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 10px 20px; background: var(--surface-raised, rgba(12, 18, 28, 0.92)); border: 1px solid rgba(212,175,55,0.35); border-radius: 10px; color: var(--gold-main, #d4af37); font-size: 0.78rem; font-weight: 600; letter-spacing: 0.06em; text-decoration: none; text-transform: uppercase; transition: border-color 0.25s ease, transform 0.25s ease; cursor: pointer; }
        .btn-back-vault:focus-visible, .btn-singularity:focus-visible, .btn-return:focus-visible { outline: 2px solid var(--gold-main, #d4af37); outline-offset: 2px; }

        .genesis-wrapper { position: fixed; inset: 0; width: 100%; height: 100dvh; max-width: 100vw; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; }

        #canvas1 { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; touch-action: none; }

        .hud-overlay { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 50; display: flex; flex-direction: column; align-items: center; gap: 20px; pointer-events: none; transition: opacity 0.4s ease; }
        .hud-text { font-family: var(--font-manrope), sans-serif; color: var(--gold-main, #d4af37); font-size: 0.85rem; letter-spacing: 0.06em; text-transform: uppercase; text-align: center; }

        .btn-singularity { pointer-events: auto; background: rgba(12, 18, 28, 0.92); border: 1px solid var(--gold-main, #d4af37); color: var(--gold-main, #d4af37); min-height: 48px; padding: 14px 36px; border-radius: 50px; font-family: var(--font-sans, inherit); font-size: 0.88rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; transition: background 0.3s ease, color 0.3s ease, transform 0.3s ease; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }

        .revelation-box { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 100; text-align: center; opacity: 0; pointer-events: none; transition: opacity 1.2s ease; }
        .revelation-box.show { opacity: 1; pointer-events: auto; }

        .rev-title { font-family: 'Playfair Display', serif; color: var(--text-primary, #fff); font-size: clamp(2.2rem, 6vw, 4.5rem); margin: 0; letter-spacing: 0.06em; text-transform: uppercase; }
        .rev-subtitle { font-family: var(--font-manrope), sans-serif; color: var(--gold-main, #d4af37); font-size: 1rem; letter-spacing: 0.06em; margin-top: 15px; }

        .btn-return { display: inline-flex; align-items: center; justify-content: center; margin-top: 32px; min-height: 44px; padding: 12px 30px; border: 1px solid var(--border-strong, rgba(255,255,255,0.3)); color: var(--text-primary, #fff); text-decoration: none; font-family: var(--font-sans, inherit); text-transform: uppercase; letter-spacing: 0.06em; border-radius: 30px; transition: background 0.25s ease, color 0.25s ease; }

        @media (hover: hover) and (pointer: fine) {
            .btn-back-vault:hover { transform: translateX(-3px); border-color: #d4af37; color: var(--text-primary, #fff); }
            .btn-singularity:hover { background: var(--gold-main, #d4af37); color: #060b14; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), 0 0 20px rgba(212, 175, 55, 0.3); transform: scale(1.03); }
            .btn-return:hover { background: var(--text-primary, #fff); color: var(--bg-main, #060b14); }
        }

        :root[data-theme="light"] .btn-back-vault,
        :root[data-theme="light"] .btn-singularity {
            background: #ffffff;
            color: #7c520a;
            border-color: rgba(124, 82, 10, 0.45);
        }
        :root[data-theme="light"] .hud-text,
        :root[data-theme="light"] .rev-subtitle {
            color: #7c520a;
        }
        :root[data-theme="light"] .btn-return {
            border-color: rgba(24, 24, 27, 0.3);
            color: #18181b;
        }

        @media (max-width: 768px) { 
            .btn-back-vault { top: max(16px, calc(env(safe-area-inset-top, 16px) + 6px)); inset-inline-start: max(16px, env(safe-area-inset-left, 16px)); padding: 8px 14px; font-size: 0.75rem; } 
            .hud-overlay { width: 90%; bottom: max(20px, calc(env(safe-area-inset-bottom, 20px) + 8px)); gap: 12px; }
            .hud-text { font-size: 0.78rem; letter-spacing: 0.04em; }
            .btn-singularity { padding: 12px 24px; font-size: 0.82rem; letter-spacing: 0.06em; width: 100%; max-width: 280px; }
            .rev-title { font-size: 2.1rem; letter-spacing: 0.05em; }
            .rev-subtitle { font-size: 0.88rem; letter-spacing: 0.03em; padding: 0 15px; }
        }

        @media (prefers-reduced-motion: reduce) {
            .hud-overlay, .revelation-box, .btn-back-vault, .btn-singularity, .btn-return {
                transition: none !important;
                animation: none !important;
            }
        }
      `}</style>

            <Link href="/fitur" className="btn-back-vault">
                <i className="fa-solid fa-chevron-left" aria-hidden="true"></i> Kembali ke Fitur
            </Link>

            <div className="genesis-wrapper">
                <canvas id="canvas1" ref={canvasRef}></canvas>

                <div className="hud-overlay" style={{ opacity: isSingularity ? 0 : 1 }}>
                    <div className="hud-text">Usap layar untuk menggerakkan partikel<br />Biarkan diam untuk membentuk lambang angkatan</div>
                    <button type="button" className="btn-singularity" onClick={triggerSingularity}>Mulai Penjelajahan Sejarah</button>
                </div>

                <div className={`revelation-box ${showRevelation ? 'show' : ''}`}>
                    <h1 className="rev-title">WE ARE ONE</h1>
                    <div className="rev-subtitle">Angkatan 43 Pondok Modern Arrisalah, satu ikatan persaudaraan sejati.</div>
                    <Link href="/fitur" className="btn-return">Kembali ke Menu Fitur</Link>
                </div>
            </div>
        </>
    );
}
