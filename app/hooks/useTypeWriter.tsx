"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useTypewriter() {
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);

  const targetRef = useRef("");
  const shownRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  const tick = useCallback((now: number) => {
    const target = targetRef.current;
    if (shownRef.current >= target.length) {
      rafRef.current = null;
      setTyping(false);
      return;
    }
    if (now - lastRef.current >= 16) {
      lastRef.current = now;
      const backlog = target.length - shownRef.current;
      const step = backlog > 60 ? 8 : backlog > 24 ? 4 : backlog > 8 ? 2 : 1;
      shownRef.current = Math.min(target.length, shownRef.current + step);
      setDisplayed(target.slice(0, shownRef.current));
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const push = useCallback(
    (fullTextSoFar: string) => {
      targetRef.current = fullTextSoFar;
      setTyping(true);
      if (rafRef.current == null) {
        lastRef.current = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [tick],
  );

  const reset = useCallback((initial = "") => {
    targetRef.current = initial;
    shownRef.current = initial.length;
    setDisplayed(initial);
    setTyping(false);
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return { displayed, typing, push, reset };
}
