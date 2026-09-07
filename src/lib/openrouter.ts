import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  compatibility: "strict",
  headers: {
    "HTTP-Referer": "https://partisimulator.vercel.app",
    "X-Title": "PartiSimulator 2026",
  },
});

export function getOpenRouterModel(): string {
  const modelName = process.env.OPENROUTER_MODEL;
  if (!modelName) {
    throw new Error("OPENROUTER_MODEL måste anges när LLM_PROVIDER=openrouter");
  }
  return modelName;
}
