"use client";

import type { CSSProperties } from "react";

/**
 * The revelo signature equalizer.
 * - Static (logo): bars sit at varied heights so it reads as a real waveform.
 * - active: bars pulse with a staggered scaleY animation (GPU-smooth).
 */
export function Waveform({
  active = false,
  bars = 5,
  size = 22,
  className = "",
}: {
  active?: boolean;
  bars?: number;
  size?: number; // height in px
  className?: string;
}) {
  // Deterministic, varied peak heights (0.4–1.0) so bars differ and SSR matches.
  const peaks = Array.from({ length: bars }, (_, i) => {
    const n = 0.5 + 0.5 * Math.sin(i * 1.35 + 0.6);
    return 0.4 + 0.6 * n;
  });

  return (
    <span
      className={`wf ${active ? "wf--active" : ""} ${className}`}
      style={{ height: size }}
      aria-hidden
    >
      {peaks.map((h, i) => (
        <i
          key={i}
          style={
            {
              "--h": h,
              "--d": `${(i % bars) * 0.1}s`,
            } as CSSProperties
          }
        />
      ))}
      <style jsx>{`
        .wf {
          display: inline-flex;
          align-items: center;
          gap: 2.5px;
        }
        .wf i {
          display: block;
          width: 3px;
          height: 100%;
          border-radius: 999px;
          background: var(--coral, #c8635a);
          transform: scaleY(var(--h));
          transform-origin: center;
        }
        .wf--active i {
          animation: wf-pulse 1.05s ease-in-out infinite;
          animation-delay: var(--d);
        }
        @keyframes wf-pulse {
          0%,
          100% {
            transform: scaleY(calc(var(--h) * 0.32));
            opacity: 0.6;
          }
          50% {
            transform: scaleY(var(--h));
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .wf--active i {
            animation: none;
          }
        }
      `}</style>
    </span>
  );
}
