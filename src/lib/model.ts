import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { logDebug } from "@/lib/debug-log";
import { getOpenRouterModel, openrouter } from "@/lib/openrouter";

// oMLX exposes the Chat Completions API, not the Responses API, and ignores the API key.
const mlx = createOpenAI({
  apiKey: process.env.MLX_API_KEY || "local",
  baseURL: process.env.MLX_BASE_URL || "http://localhost:8000/v1",
});

export function getModel(): LanguageModel {
  if (process.env.LLM_PROVIDER === "mlx") {
    const modelName = process.env.MLX_MODEL;
    if (!modelName) {
      throw new Error("MLX_MODEL måste anges när LLM_PROVIDER=mlx");
    }
    logDebug(`Model: mlx/${modelName}`);
    return mlx.chat(modelName);
  }
  // Party personas must never leak chain-of-thought: exclude reasoning tokens from the response
  // for any model routed through OpenRouter, reasoning-capable or not.
  const modelName = getOpenRouterModel();
  logDebug(`Model: openrouter/${modelName}`);
  return openrouter.chat(modelName, { reasoning: { effort: "low", exclude: true } });
}
