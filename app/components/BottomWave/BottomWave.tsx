"use client";

import { useMemo } from "react";

export function BottomWave({ bars = 150 }: { bars?: number }) {
  const barData = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const t = i / bars;
        const base =
          Math.abs(Math.sin(t * Math.PI * 4.8)) * 0.35 +
          Math.abs(Math.sin(t * Math.PI * 11.3)) * 0.3 +
          Math.abs(Math.cos(t * Math.PI * 2.1)) * 0.2 +
          Math.abs(Math.sin(t * Math.PI * 18.7)) * 0.15;
        const height = 8 + base * 56;
        const delay = -(t * 2.2).toFixed(3);
        const opacity = 0.35 + base * 0.65;

        return { height, delay, opacity };
      }),
    [bars],
  );

  return (
    <div className="bw w-full" aria-hidden>
      <div className="bw-glow" />
      {barData.map((b, i) => (
        <span
          key={i}
          className="bw-bar"
          style={
            {
              "--h": `${b.height}px`,
              "--d": `${b.delay}s`,
              "--o": b.opacity,
            } as React.CSSProperties
          }
        />
      ))}
      <style jsx>{`
        .bw {
          position: fixed;
          inset: auto 0 0 0;
          height: 100px;
          display: flex;
          align-items: flex-end;
          gap: 3px;
          padding: 0 12px;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .bw-glow {
          position: absolute;
          inset: 20% 8% -24% 8%;
          background: radial-gradient(
            ellipse 70% 100% at 50% 100%,
            color-mix(in srgb, var(--coral, #e07a5f) 16%, transparent),
            transparent
          );
          filter: blur(20px);
          pointer-events: none;
        }
        .bw-bar {
          flex: 1;
          max-width: 10px;
          height: var(--h);
          opacity: calc(var(--o) * 0.48);
          background: linear-gradient(
            to top,
            color-mix(in srgb, var(--coral, #e07a5f) 80%, #000),
            var(--coral, #e07a5f),
            color-mix(in srgb, var(--coral, #e07a5f) 90%, #fff)
          );
          border-radius: 4px 4px 0 0;
          transform-origin: bottom center;
          will-change: transform;
          animation: wave 2.2s ease-in-out var(--d) infinite alternate;
        }
        @keyframes wave {
          0% {
            transform: scaleY(1);
          }
          40% {
            transform: scaleY(0.45);
          }
          100% {
            transform: scaleY(1.2);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bw-bar {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
