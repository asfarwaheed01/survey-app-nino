import { createConversation, upsertUser } from "@/app/lib/db";
import { Lang } from "@/app/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email, language } = (await req.json()) as {
      email?: string;
      language?: Lang;
    };

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    const lang: Lang = language === "ka" ? "ka" : "en";

    const userId = await upsertUser(email.toLowerCase().trim());
    const conversationId = await createConversation(userId, lang);

    return NextResponse.json({ conversationId, language: lang });
  } catch (err) {
    console.error("[start] error", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
