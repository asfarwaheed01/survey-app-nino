"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/app/components/Logo/Logo";
import { BottomWave } from "@/app/components/BottomWave/BottomWave";
import { Lang } from "@/app/types";
import { t } from "@/app/lib/i18n";

export default function Landing() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function start() {
    setError("");
    if (!EMAIL_RE.test(email.trim())) {
      setError(t(lang, "invalidEmail"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language: lang }),
      });
      if (!res.ok) {
        setError(t(lang, "invalidEmail"));
        setLoading(false);
        return;
      }
      const { conversationId } = await res.json();
      router.push(`/survey/${conversationId}?lang=${lang}`);
    } catch {
      setError(t(lang, "errorGeneric"));
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-5 pb-24 pt-10 text-center">
      <div className="mb-10">
        <Logo size={26} />
      </div>

      <h1 className="mb-5 max-w-[15ch] text-(--ink) text-[clamp(34px,6.4vw,68px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
        {t(lang, "heroTitle")}
      </h1>
      <p className="mb-11 max-w-[30ch] text-(--muted) text-[clamp(16px,2.2vw,21px)] leading-[1.4]">
        {t(lang, "heroSub")}
      </p>

      <div className="flex w-full max-w-107.5 flex-col gap-3">
        <input
          type="email"
          placeholder={t(lang, "emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) start();
          }}
          className="w-full rounded-xl border border-(--line) bg-white px-5! py-4! text-center text-base text-(--ink) outline-none placeholder:text-[#9a938c] focus:border-(--rose)"
        />

        <button
          type="button"
          onClick={start}
          disabled={loading || !EMAIL_RE.test(email.trim())}
          className="w-full cursor-pointer rounded-xl bg-(--rose) px-5 py-4 text-base font-semibold text-white transition-colors hover:not-disabled:bg-[#c47b74] disabled:cursor-default disabled:opacity-60"
        >
          {loading ? t(lang, "starting") : t(lang, "start")}
        </button>

        {error && <p className="mt-0.5 text-sm text-[#c0392b]">{error}</p>}
      </div>

      <p className="mt-9 text-[15px] text-[#a39d95]">{t(lang, "meta")}</p>

      <button
        type="button"
        onClick={() => setLang((l) => (l === "en" ? "ka" : "en"))}
        className="mt-3.5 rounded-full border border-(--line) bg-transparent px-5 py-2 text-sm font-semibold text-(--muted) transition-colors duration-150 hover:border-(--ink) hover:text-(--ink)"
      >
        {lang === "en" ? "KA" : "EN"}
      </button>

      <BottomWave />
    </main>
  );
}
