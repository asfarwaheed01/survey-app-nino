import { neon } from "@neondatabase/serverless";
import { Lang, Profile } from "../types";

const sql = neon(process.env.DATABASE_URL!);

/** Find a user by email or create one. Returns the user id. */
export async function upsertUser(email: string): Promise<string> {
  const rows = await sql`
    insert into users (email) values (${email})
    on conflict (email) do update set email = excluded.email
    returning id
  `;
  return rows[0].id as string;
}

export async function createConversation(
  userId: string,
  language: Lang,
): Promise<string> {
  const rows = await sql`
    insert into conversations (user_id, language)
    values (${userId}, ${language})
    returning id
  `;
  return rows[0].id as string;
}

export interface ConversationRow {
  id: string;
  status: string;
  current_step: number;
  language: Lang;
}

export async function getConversation(
  id: string,
): Promise<ConversationRow | null> {
  const rows = await sql`
    select id, status, current_step, language from conversations where id = ${id}
  `;
  return (rows[0] as ConversationRow) ?? null;
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  messageType: "text" | "question" | "profile" = "text",
) {
  await sql`
    insert into messages (conversation_id, role, content, message_type)
    values (${conversationId}, ${role}, ${content}, ${messageType})
  `;
}

export async function saveAnswer(
  conversationId: string,
  question: string,
  answer: string,
  topic: string | null,
) {
  await sql`
    insert into answers (conversation_id, question, answer, topic)
    values (${conversationId}, ${question}, ${answer}, ${topic})
  `;
}

export interface AnswerRow {
  question: string;
  answer: string;
  topic: string | null;
}

export async function getAnswers(conversationId: string): Promise<AnswerRow[]> {
  const rows = await sql`
    select question, answer, topic from answers
    where conversation_id = ${conversationId}
    order by created_at asc
  `;
  return rows as AnswerRow[];
}

export async function markCompleted(conversationId: string) {
  await sql`
    update conversations
    set status = 'completed', completed_at = now()
    where id = ${conversationId}
  `;
}

export async function bumpStep(conversationId: string, step: number) {
  await sql`update conversations set current_step = ${step} where id = ${conversationId}`;
}

export async function saveProfile(conversationId: string, p: Profile) {
  await sql`
    insert into profiles
      (conversation_id, communication_style, strengths, decision_style, motivations, recommendations)
    values
      (${conversationId}, ${p.communication_style}, ${JSON.stringify(p.strengths)},
       ${p.decision_style}, ${JSON.stringify(p.motivations)}, ${JSON.stringify(p.recommendations)})
    on conflict (conversation_id) do update set
      communication_style = excluded.communication_style,
      strengths           = excluded.strengths,
      decision_style      = excluded.decision_style,
      motivations         = excluded.motivations,
      recommendations     = excluded.recommendations
  `;
}
