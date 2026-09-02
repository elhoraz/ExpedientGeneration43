"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

export default function GenesisClient({ userId }: { userId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSingularity, setIsSingularity] = useState(false);
  const [showRevelation, setShowRevelation] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
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
            let dx = (mouse.x || -1000) - this.x;
            let dy = (mouse.y || -1000) - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            let force = (mouse.radius - distance) / mouse.radius;
            let directionX = forceDirectionX * force * this.density;
            let directionY = forceDirectionY * force * this.density;

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
            if(!tempCtx) return;
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
                        
                        let positionX = x + startX;
                        let positionY = y + startY;
                        
                        particleArray.push(new Particle(positionX, positionY, color));
                    }
                }
            }
        };
    };

    initParticles();

    // Store particle array in ref to be accessible by singularity event
    (canvas as any).particleArray = particleArray;

    const animate = () => {
        if (!isSingularity && !(canvas as any).isSingularityStarted) {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.3)';
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
    };
    window.addEventListener('resize', onResize);

    return () => {
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
    
    if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 200, 500]);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particleArray = (canvas as any).particleArray || [];

    gsap.to(particleArray, {
        x: centerX,
        y: centerY,
        duration: 2,
        ease: "power2.in",
        stagger: { amount: 1, from: "random" },
        onUpdate: () => {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.2)';
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
                duration: 2,
                ease: "expo.out",
                onUpdate: () => {
                    ctx.fillStyle = 'rgba(2, 2, 2, 0.4)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    for (let i = 0; i < particleArray.length; i++) {
                        particleArray[i].draw();
                    }
                },
                onComplete: () => {
                    setShowRevelation(true);
                    ctx.clearRect(0,0, canvas.width, canvas.height);
                    // Usually we would log this to backend here
                }
            });
        }
    });
  };

  return (
    <>
      <style>{`
        :root { --genesis-gold: #d4af37; --genesis-dark: #020202; }
        body { margin: 0; padding: 0; background-color: var(--genesis-dark); overflow: hidden; user-select: none; font-family: 'Inter', sans-serif; height: 100vh; width: 100vw; }
        .btn-back-vault { position: absolute; top: 30px; left: 30px; z-index: 100; display: flex; align-items: center; gap: 10px; padding: 10px 20px; background: rgba(0,0,0,0.6); border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; color: #d4af37; font-size: 11px; font-weight: 600; letter-spacing: 3px; text-decoration: none; text-transform: uppercase; backdrop-filter: blur(10px); transition: all 0.3s ease; cursor: pointer; }
        .btn-back-vault:hover { transform: translateX(-5px); box-shadow: 0 0 20px rgba(212,175,55,0.5); border-color: #ffd700; color: #fff; }

        .genesis-wrapper { position: relative; width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; }

        #canvas1 { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; touch-action: none; }

        .hud-overlay { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 50; display: flex; flex-direction: column; align-items: center; gap: 20px; pointer-events: none; transition: opacity 0.5s; }
        .hud-text { font-family: 'Courier New', monospace; color: rgba(212,175,55,0.7); font-size: 0.8rem; letter-spacing: 4px; text-transform: uppercase; text-align: center; text-shadow: 0 0 10px rgba(0,0,0,0.8); animation: pulseText 2s infinite alternate; }
        @keyframes pulseText { 0% { opacity: 0.5; } 100% { opacity: 1; } }

        .btn-singularity { pointer-events: auto; background: rgba(212, 175, 55, 0.1); backdrop-filter: blur(10px); border: 1px solid var(--genesis-gold); color: var(--genesis-gold); padding: 15px 40px; border-radius: 50px; font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 4px; cursor: pointer; transition: all 0.4s ease; box-shadow: 0 0 20px rgba(0,0,0,0.8); }
        .btn-singularity:hover { background: var(--genesis-gold); color: #000; box-shadow: 0 0 40px rgba(212, 175, 55, 0.6); transform: scale(1.05); }

        .revelation-box { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 100; text-align: center; opacity: 0; pointer-events: none; transition: opacity 2s ease; }
        .revelation-box.show { opacity: 1; pointer-events: auto; }

        .rev-title { font-family: 'Playfair Display', serif; color: #fff; font-size: clamp(2.5rem, 6vw, 5rem); text-shadow: 0 0 30px var(--genesis-gold); margin: 0; letter-spacing: 8px; text-transform: uppercase; }
        .rev-subtitle { font-family: 'Courier New', monospace; color: #d4af37; font-size: 1rem; letter-spacing: 5px; margin-top: 15px; }

        .btn-return { display: inline-block; margin-top: 40px; padding: 12px 30px; border: 1px solid rgba(255,255,255,0.3); color: #fff; text-decoration: none; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 2px; border-radius: 30px; transition: 0.3s; }
        .btn-return:hover { background: #fff; color: #000; }

        @media (max-width: 768px) { 
            .btn-back-vault { top: 15px; left: 15px; padding: 8px 14px; font-size: 10px; } 
            .hud-overlay { width: 90%; bottom: 25px; gap: 12px; }
            .hud-text { font-size: 0.72rem; letter-spacing: 2px; }
            .btn-singularity { padding: 12px 24px; font-size: 0.8rem; letter-spacing: 2px; width: 100%; max-width: 280px; }
            .rev-title { font-size: 2.2rem; letter-spacing: 4px; }
            .rev-subtitle { font-size: 0.85rem; letter-spacing: 2px; padding: 0 15px; }
        }
      `}</style>

      <Link href="/fitur" className="btn-back-vault">
        <i className="fa-solid fa-chevron-left"></i> Exit Genesis
      </Link>

      <div className="genesis-wrapper">
        <canvas id="canvas1" ref={canvasRef}></canvas>
        
        <div className="hud-overlay" style={{ opacity: isSingularity ? 0 : 1 }}>
            <div className="hud-text">Usap layar untuk mendisrupsi partikel<br/>Biarkan untuk membentuk identitas</div>
            <button type="button" className="btn-singularity" onClick={triggerSingularity}>Initiate Singularity</button>
        </div>

        <div className={`revelation-box ${showRevelation ? 'show' : ''}`}>
            <h1 className="rev-title">WE ARE ONE</h1>
            <div className="rev-subtitle">Ribuan entitas, satu kekuatan tak tertembus.</div>
            <Link href="/fitur" className="btn-return">Kembali ke Vault</Link>
        </div>
      </div>
    </>
  );
}
