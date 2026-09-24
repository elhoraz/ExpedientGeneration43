"use client";

import { useEffect, useRef, ReactNode } from "react";


interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = "" }: TiltCardProps) {
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (window.innerWidth <= 768 || isTouch) return;

    if (tiltRef.current) {
      import("vanilla-tilt").then((VanillaTilt) => {
        if (tiltRef.current) {
          VanillaTilt.default.init(tiltRef.current, {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.2,
            perspective: 1000,
          });
        }
      });
    }
  }, []);

  return (
    <div ref={tiltRef} className={className}>
      {children}
    </div>
  );
}
