"use client";

import { useEffect, useRef, ReactNode } from "react";


interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = "" }: TiltCardProps) {
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tiltRef.current) {
      import("vanilla-tilt").then((VanillaTilt) => {
        VanillaTilt.default.init(tiltRef.current!, {
          max: 15,
          speed: 400,
          glare: true,
          "max-glare": 0.2,
          perspective: 1000,
        });
      });
    }
  }, []);

  return (
    <div ref={tiltRef} className={className}>
      {children}
    </div>
  );
}
