"use client";

import { Waveform } from "../WaveForm/WaveForm";

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="logo" style={{ fontSize: size }}>
      <Waveform bars={5} size={size} />
      <span className="word">Survery App</span>
      <style jsx>{`
        .logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--ink);
          user-select: none;
        }
      `}</style>
    </span>
  );
}
