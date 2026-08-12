"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/app/components/Logo/Logo";
import { ProfileCard } from "@/app/components/ProfileCard/ProfileCard";
import { renderBold } from "@/app/lib/markdown";
import { t } from "@/app/lib/i18n";
import { TOTAL_QUESTIONS } from "@/app/lib/config";
import type {
  AnswerInput,
  Lang,
  Profile,
  QuestionMeta,
  StreamEvent,
} from "@/app/types";
import { Waveform } from "@/app/components/WaveForm/WaveForm";
import { CloseIcon, SendIcon, SpeakerIcon } from "@/app/components/Icons/Icons";

function stripMd(s: string) {
  return s.replace(/\*\*/g, "");
}

function SurveyInner() {
  const router = useRouter();
  const params = useParams<{ surveyid: string }>();
  const search = useSearchParams();
  const cid = params.surveyid;
  const lang = (search.get("lang") as Lang) ?? "en";

  const [question, setQuestion] = useState("");
  const [meta, setMeta] = useState<QuestionMeta | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [muted, setMuted] = useState(true);
  const [voiceNote, setVoiceNote] = useState(false);

  const started = useRef(false);
  const current = useRef<{ question: string; topic: string }>({
    question: "",
    topic: "",
  });
  const mutedRef = useRef(true);

  const speak = useCallback(
    (raw: string) => {
      if (
        mutedRef.current ||
        typeof window === "undefined" ||
        !window.speechSynthesis
      )
        return;
      const u = new SpeechSynthesisUtterance(stripMd(raw));
      u.lang = lang === "ka" ? "ka-GE" : "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [lang],
  );

  const send = useCallback(
    async (answer: AnswerInput | null) => {
      setBusy(true);
      setMeta(null);
      setQuestion("");
      setText("");
      setPicked([]);
      let acc = "";

      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: cid, answer }),
      });
      if (!res.body) return setBusy(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          let evt: StreamEvent;
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }

          if (evt.type === "token") {
            acc += evt.v;
            setQuestion(acc);
          } else if (evt.type === "progress") {
            setStep(evt.step);
            if (evt.step >= TOTAL_QUESTIONS) {
              setAnalyzing(true);
              setQuestion("");
            }
          } else if (evt.type === "meta") {
            current.current = { question: acc.trim(), topic: evt.meta.topic };
            setMeta(evt.meta);
            setBusy(false);
            speak(acc.trim());
          } else if (evt.type === "profile") {
            setProfile(evt.profile);
            setAnalyzing(false);
            setBusy(false);
          } else if (evt.type === "error") {
            setQuestion(t(lang, "errorGeneric"));
            setBusy(false);
          }
        }
      }
    },
    [cid, lang, speak],
  );

  useEffect(() => {
    if (started.current || !cid) return;
    started.current = true;
    send(null);
  }, [cid, send]);

  function submit(value: string) {
    if (!value.trim()) return;
    send({
      question: current.current.question,
      answer: value.trim(),
      topic: current.current.topic,
    });
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (next && typeof window !== "undefined") window.speechSynthesis?.cancel();
    else if (question) speak(question);
  }

  const pct = Math.min((step / TOTAL_QUESTIONS) * 100, 100);
  const showInput = meta && !busy && !analyzing && !profile;

  return (
    <main className="page">
      <div className="progress">
        <div className="bar" style={{ width: `${pct}%` }} />
      </div>

      <header className="bar-top">
        <Logo size={20} />
        <div className="controls">
          <button
            className="ctl round"
            onClick={toggleMute}
            aria-label="Toggle voice"
          >
            <SpeakerIcon muted={muted} />
          </button>
          <button
            className="ctl"
            onClick={() => router.push("/")}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <section className="stage">
        {profile ? (
          <div className="profileWrap">
            <ProfileCard profile={profile} lang={lang} />
          </div>
        ) : analyzing ? (
          <div className="analyzing">
            <Waveform active bars={9} />
            <p>{t(lang, "analyzing")}</p>
          </div>
        ) : busy && !question ? (
          <div className="analyzing">
            <Waveform active bars={6} />
          </div>
        ) : (
          <>
            <h1 className="question">
              {renderBold(question)}
              {busy && <span className="caret" />}
            </h1>

            {showInput && meta.inputType === "free_text" && (
              <div className="inputArea">
                <div className="pill">
                  <input
                    autoFocus
                    value={text}
                    placeholder={t(lang, "typeResponse")}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit(text)}
                  />
                  <button
                    className="sendBtn"
                    onClick={() => submit(text)}
                    aria-label={t(lang, "send")}
                  >
                    <SendIcon />
                  </button>
                </div>
                <VoiceLink
                  lang={lang}
                  note={voiceNote}
                  onClick={() => setVoiceNote(true)}
                />
              </div>
            )}

            {showInput && meta.inputType === "single_choice" && (
              <div className="inputArea">
                <div className="choices">
                  {meta.options.map((o) => (
                    <button
                      key={o}
                      className="choice"
                      onClick={() => submit(o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
                <VoiceLink
                  lang={lang}
                  note={voiceNote}
                  onClick={() => setVoiceNote(true)}
                />
              </div>
            )}

            {showInput && meta.inputType === "multiple_choice" && (
              <div className="inputArea">
                <p className="hint">{t(lang, "chooseMany")}</p>
                <div className="choices">
                  {meta.options.map((o) => (
                    <button
                      key={o}
                      className={`choice ${picked.includes(o) ? "on" : ""}`}
                      onClick={() =>
                        setPicked((p) =>
                          p.includes(o) ? p.filter((x) => x !== o) : [...p, o],
                        )
                      }
                    >
                      {o}
                    </button>
                  ))}
                </div>
                <button
                  className="submit"
                  disabled={picked.length === 0}
                  onClick={() => submit(picked.join(", "))}
                >
                  {t(lang, "submit")}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }
        .progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(0, 0, 0, 0.06);
          z-index: 5;
        }
        .bar {
          height: 100%;
          background: linear-gradient(90deg, var(--prog-a), var(--prog-b));
          transition: width 0.5s ease;
        }
        .bar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 26px;
        }
        .controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ctl {
          border: none;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          transition: background 0.15s ease;
        }
        .ctl:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        .round {
          background: #f6e4e1;
          color: var(--coral);
        }
        .round:hover {
          background: #f2d9d5;
        }
        .stage {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 24px 80px;
        }
        .question {
          max-width: 40ch;
          text-align: center;
          font-size: clamp(28px, 4.4vw, 52px);
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin: 0 0 48px;
        }
        .caret {
          display: inline-block;
          width: 3px;
          height: 0.9em;
          margin-left: 4px;
          background: var(--coral);
          vertical-align: text-bottom;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          50% {
            opacity: 0;
          }
        }
        .inputArea {
          width: min(680px, 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }
        .pill {
          width: 100%;
          display: flex;
          align-items: center;
          background: #fff;
          border: 1.5px solid var(--rose);
          border-radius: 999px;
          padding: 6px 6px 6px 24px;
          box-shadow: 0 8px 30px -20px rgba(120, 60, 40, 0.5);
        }
        .pill input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 17px;
          padding: 14px 0;
          background: transparent;
          color: var(--ink);
          font-family: inherit;
        }
        .pill input::placeholder {
          color: #a49c95;
        }
        .sendBtn {
          border: none;
          background: transparent;
          color: var(--muted);
          width: 48px;
          height: 48px;
          border-radius: 999px;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: all 0.15s ease;
        }
        .sendBtn:hover {
          color: var(--rose);
        }
        .choices {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
        }
        .choice {
          border: 1.5px solid rgba(200, 99, 90, 0.35);
          background: #fff;
          color: var(--ink);
          padding: 13px 24px;
          border-radius: 999px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .choice:hover {
          border-color: var(--coral);
          background: #fff6f4;
          transform: translateY(-1px);
        }
        .choice.on {
          background: var(--coral);
          color: #fff;
          border-color: var(--coral);
        }
        .hint {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }
        .submit {
          background: var(--rose);
          color: #fff;
          border: none;
          padding: 14px 30px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .submit:disabled {
          opacity: 0.45;
          cursor: default;
        }
        .analyzing {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }
        .analyzing p {
          color: var(--muted);
          max-width: 24ch;
        }
        .profileWrap {
          width: min(720px, 100%);
        }
      `}</style>
    </main>
  );
}

function VoiceLink({
  lang,
  note,
  onClick,
}: {
  lang: Lang;
  note: boolean;
  onClick: () => void;
}) {
  return (
    <div className="voice">
      <button onClick={onClick}>{t(lang, "switchToVoice")}</button>
      {note && <span>{t(lang, "voiceSoon")}</span>}
      <style jsx>{`
        .voice {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        button {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 15px;
          cursor: pointer;
          text-decoration: none;
        }
        button:hover {
          color: var(--ink);
        }
        span {
          font-size: 13px;
          color: #a49c95;
        }
      `}</style>
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense fallback={null}>
      <SurveyInner />
    </Suspense>
  );
}
