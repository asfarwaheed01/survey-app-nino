import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

export async function* streamText(
  systemInstruction: string,
  userText: string,
  json = false,
): AsyncGenerator<string> {
  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents: userText,
    config: {
      systemInstruction,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}
