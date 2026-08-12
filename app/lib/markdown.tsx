import { Fragment, type ReactNode } from "react";

function sanitize(text: string): string {
  return text.replace(/\s*—\s*/g, ", ").replace(/\s*–\s*/g, ", ");
}

export function renderBold(text: string): ReactNode {
  const clean = sanitize(text);
  const parts = clean.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
