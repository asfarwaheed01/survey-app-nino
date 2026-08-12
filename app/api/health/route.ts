import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result: {
    db: { ok: boolean; now?: string; tables?: string[]; error?: string };
    gemini: { keyPresent: boolean; model: string };
  } = {
    db: { ok: false },
    gemini: {
      keyPresent: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
    },
  };

  try {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    const sql = neon(process.env.DATABASE_URL);
    const [{ now }] = await sql`select now()`;
    const tables = await sql`
      select table_name from information_schema.tables
      where table_schema = 'public'
      order by table_name`;
    result.db = {
      ok: true,
      now,
      tables: tables.map((t) => t.table_name as string),
    };
  } catch (e) {
    result.db = {
      ok: false,
      error: e instanceof Error ? e.message : "unknown error",
    };
  }

  const healthy = result.db.ok && result.gemini.keyPresent;
  return NextResponse.json(result, { status: healthy ? 200 : 503 });
}
