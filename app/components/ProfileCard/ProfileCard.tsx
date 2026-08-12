"use client";

import { t } from "@/app/lib/i18n";
import { Lang, Profile } from "@/app/types";
import { Waveform } from "../WaveForm/WaveForm";

export function ProfileCard({
  profile,
  lang,
}: {
  profile: Profile;
  lang: Lang;
}) {
  const proseSections: { label: string; body: string }[] = [
    { label: t(lang, "communication"), body: profile.communication_style },
    { label: t(lang, "decision"), body: profile.decision_style },
  ];
  const listSections: { label: string; items: string[] }[] = [
    { label: t(lang, "strengths"), items: profile.strengths },
    { label: t(lang, "motivations"), items: profile.motivations },
    { label: t(lang, "recommendations"), items: profile.recommendations },
  ];

  let delay = 0;
  const next = () => (delay += 90);

  return (
    <div className="card">
      <div className="head" style={{ animationDelay: `${next()}ms` }}>
        <Waveform bars={7} />
        <h2>{t(lang, "profileTitle")}</h2>
      </div>

      {proseSections.map((s) => (
        <section
          key={s.label}
          className="sec"
          style={{ animationDelay: `${next()}ms` }}
        >
          <h3>{s.label}</h3>
          <p>{s.body}</p>
        </section>
      ))}

      {listSections.map((s) => (
        <section
          key={s.label}
          className="sec"
          style={{ animationDelay: `${next()}ms` }}
        >
          <h3>{s.label}</h3>
          <ul>
            {s.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </section>
      ))}

      <div className="cta" style={{ animationDelay: `${next()}ms` }}>
        <p>{t(lang, "profileOutro")}</p>
        <button className="reg">{t(lang, "register")}</button>
      </div>

      <style jsx>{`
        .card {
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 20px 50px -30px rgba(120, 60, 40, 0.35);
        }
        .head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        h2 {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
          color: var(--ink);
        }
        .sec {
          padding: 18px 0;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        h3 {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--coral);
          margin: 0 0 8px;
          font-weight: 700;
        }
        p {
          margin: 0;
          color: var(--ink);
          line-height: 1.6;
        }
        ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        li {
          background: #fdf2ef;
          border: 1px solid rgba(200, 99, 90, 0.25);
          color: var(--ink);
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.4;
        }
        .cta {
          margin-top: 22px;
          text-align: center;
        }
        .cta p {
          color: var(--muted);
          margin-bottom: 12px;
        }
        .reg {
          background: var(--coral);
          color: #fff;
          border: none;
          padding: 14px 28px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .head,
        .sec,
        .cta {
          opacity: 0;
          animation: rise 0.5s ease forwards;
        }
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .head,
          .sec,
          .cta {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
