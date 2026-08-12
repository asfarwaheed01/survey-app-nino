import { NextRequest } from "next/server";
import {
  getConversation,
  getAnswers,
  saveAnswer,
  saveMessage,
  bumpStep,
  markCompleted,
  saveProfile,
  type AnswerRow,
} from "@/app/lib/db";
import { streamText } from "@/app/lib/gemini";
import {
  questionSystemPrompt,
  buildSummary,
  profileSystemPrompt,
  profileUserPrompt,
  DELIM,
} from "@/app/lib/prompts";
import { TOTAL_QUESTIONS } from "@/app/lib/config";
import type {
  AnswerInput,
  QuestionMeta,
  StreamEvent,
  Profile,
} from "@/app/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const enc = new TextEncoder();
const sse = (e: StreamEvent) => enc.encode(`data: ${JSON.stringify(e)}\n\n`);

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    conversationId: string;
    answer?: AnswerInput | null;
  };
  const { conversationId, answer } = body;

  const conversation = await getConversation(conversationId);
  if (!conversation) {
    return new Response("conversation not found", { status: 404 });
  }
  const lang = conversation.language;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(sse(e));

      try {
        // --- Build the answers list with the MINIMUM number of DB round-trips ---
        // First question ever: no DB read needed at all — we already know there's
        // nothing to fetch. This is the turn users are most sensitive to being slow.
        let answers: AnswerRow[] = [];

        if (answer && answer.answer) {
          // We already have the new answer's text from the request — no need to
          // write it then immediately re-read it. Fetch prior answers and persist
          // the new one CONCURRENTLY (they're independent), instead of the old
          // sequential save -> save -> re-fetch -> bump chain (4 round-trips).
          const [prior] = await Promise.all([
            getAnswers(conversationId),
            saveMessage(conversationId, "user", answer.answer, "text").catch(
              (e) => console.error("[message] saveMessage failed", e),
            ),
            saveAnswer(
              conversationId,
              answer.question,
              answer.answer,
              answer.topic || null,
            ).catch((e) => console.error("[message] saveAnswer failed", e)),
          ]);
          answers = [
            ...prior,
            {
              question: answer.question,
              answer: answer.answer,
              topic: answer.topic || null,
            },
          ];
        }

        const answered = answers.length;
        // Fire-and-forget — doesn't gate anything the client is waiting on.
        bumpStep(conversationId, answered).catch((e) =>
          console.error("[message] bumpStep failed", e),
        );
        send({ type: "progress", step: answered, total: TOTAL_QUESTIONS });

        // 2) Branch: more questions, or generate the profile.
        if (answered >= TOTAL_QUESTIONS) {
          await generateProfile(conversationId, answers, lang, send);
        } else {
          await generateQuestion(
            conversationId,
            answers,
            answered + 1,
            lang,
            send,
          );
        }

        send({ type: "done" });
      } catch (err) {
        console.error("[message] error", err);
        send({ type: "error", message: "server_error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// ---- Question generation: stream the message text, then emit structured meta ----
async function generateQuestion(
  conversationId: string,
  answers: AnswerRow[],
  questionNumber: number,
  lang: "en" | "ka",
  send: (e: StreamEvent) => void,
) {
  const system = questionSystemPrompt(lang);
  const user = buildSummary(answers, questionNumber);

  let full = "";
  let emitted = 0; // chars of the message text already sent to the client
  let metaFound = false;

  for await (const chunk of streamText(system, user)) {
    full += chunk;
    if (metaFound) continue;

    const idx = full.indexOf(DELIM);
    if (idx === -1) {
      // Emit everything except a trailing window that could be a partial delimiter.
      const safe = Math.max(0, full.length - (DELIM.length - 1));
      if (safe > emitted) {
        send({ type: "token", v: full.slice(emitted, safe) });
        emitted = safe;
      }
    } else {
      if (idx > emitted) send({ type: "token", v: full.slice(emitted, idx) });
      emitted = idx;
      metaFound = true;
    }
  }

  // Flush any remaining message text if no delimiter ever appeared.
  if (!metaFound && full.length > emitted) {
    send({ type: "token", v: full.slice(emitted) });
  }

  const messageText = (
    metaFound ? full.slice(0, full.indexOf(DELIM)) : full
  ).trim();
  const metaRaw = metaFound
    ? full.slice(full.indexOf(DELIM) + DELIM.length).trim()
    : "";

  const meta = parseMeta(metaRaw);
  send({ type: "meta", meta });

  // Persisting the assistant's message happens after the client already has the
  // full text and can act on it — awaiting here adds no perceived latency.
  await saveMessage(conversationId, "assistant", messageText, "question").catch(
    (e) => console.error("[message] saveMessage(assistant) failed", e),
  );
}

function parseMeta(raw: string): QuestionMeta {
  const fallback: QuestionMeta = {
    inputType: "free_text",
    options: [],
    topic: "general",
    shouldContinue: true,
  };
  if (!raw) return fallback;
  try {
    const cleaned = raw
      .replace(/^```json/i, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<QuestionMeta>;
    return {
      inputType: parsed.inputType ?? "free_text",
      options: Array.isArray(parsed.options) ? parsed.options : [],
      topic: parsed.topic ?? "general",
      shouldContinue: parsed.shouldContinue ?? true,
    };
  } catch {
    return fallback;
  }
}

// ---- Profile generation: stream JSON over the wire, emit one parsed profile ----
async function generateProfile(
  conversationId: string,
  answers: AnswerRow[],
  lang: "en" | "ka",
  send: (e: StreamEvent) => void,
) {
  const system = profileSystemPrompt(lang);
  const user = profileUserPrompt(answers);

  let full = "";
  for await (const chunk of streamText(system, user, /* json */ true)) {
    full += chunk;
  }

  const profile = parseProfile(full);

  // These three writes are independent of each other — run them concurrently.
  await Promise.all([
    saveProfile(conversationId, profile).catch((e) =>
      console.error("[message] saveProfile failed", e),
    ),
    saveMessage(
      conversationId,
      "assistant",
      JSON.stringify(profile),
      "profile",
    ).catch((e) => console.error("[message] saveMessage(profile) failed", e)),
    markCompleted(conversationId).catch((e) =>
      console.error("[message] markCompleted failed", e),
    ),
  ]);

  send({ type: "profile", profile });
}

function parseProfile(raw: string): Profile {
  const cleaned = raw
    .replace(/^```json/i, "")
    .replace(/```$/, "")
    .trim();
  const asArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String) : v ? [String(v)] : [];
  try {
    const p = JSON.parse(cleaned);
    return {
      communication_style: String(p.communication_style ?? ""),
      strengths: asArray(p.strengths),
      decision_style: String(p.decision_style ?? ""),
      motivations: asArray(p.motivations),
      recommendations: asArray(p.recommendations),
    };
  } catch {
    return {
      communication_style: "",
      strengths: [],
      decision_style: "",
      motivations: [],
      recommendations: [],
    };
  }
}
