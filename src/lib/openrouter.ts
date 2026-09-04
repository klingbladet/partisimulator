import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": "https://partisimulator.vercel.app",
    "X-Title": "PartiSimulator 2026",
  },
});

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL || "openrouter/free";
}
