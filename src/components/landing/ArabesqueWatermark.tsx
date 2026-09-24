"use client";

export default function ArabesqueWatermark() {
  return (
    <div className="arabesque-watermark-layer" aria-hidden="true">
      <svg
        className="arabesque-watermark-svg"
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.45">
          {/* Outer Ring */}
          <circle cx="400" cy="400" r="360" strokeDasharray="4 8" />
          <circle cx="400" cy="400" r="340" />

          {/* Square 1 */}
          <rect
            x="200"
            y="200"
            width="400"
            height="400"
            fill="none"
            transform="rotate(0 400 400)"
          />
          {/* Square 2 (Rotated 45deg to form Khatam 8-pointed star) */}
          <rect
            x="200"
            y="200"
            width="400"
            height="400"
            fill="none"
            transform="rotate(45 400 400)"
          />

          {/* Inner Interlaced Octagram */}
          <circle cx="400" cy="400" r="230" strokeDasharray="3 6" />
          <circle cx="400" cy="400" r="160" />

          {/* Star Rays & Central Medallion */}
          <line x1="400" y1="40" x2="400" y2="760" />
          <line x1="40" y1="400" x2="760" y2="400" />
          <line x1="145" y1="145" x2="655" y2="655" />
          <line x1="145" y1="655" x2="655" y2="145" />

          {/* Center Rosette */}
          <circle cx="400" cy="400" r="70" strokeWidth="1.8" />
          <circle cx="400" cy="400" r="20" fill="currentColor" fillOpacity="0.3" />
        </g>
      </svg>
    </div>
  );
}
