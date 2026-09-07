import { type FeatureExtractionPipeline, pipeline as xenovaPipeline } from "@xenova/transformers";

let _embedder: FeatureExtractionPipeline | null = null;

/** Local embedding pipeline, cached after first load (~120MB, paraphrase-multilingual-MiniLM-L12-v2). */
async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!_embedder) {
    _embedder = await xenovaPipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");
  }
  return _embedder;
}

async function createLocalEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbedder();
  const output = await pipe([text], { normalize: true, pooling: "mean" });
  return Array.from(output.data as Float32Array);
}

async function createOpenRouterEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    body: JSON.stringify({
      dimensions: 384,
      input: text,
      model: "openai/text-embedding-3-small",
    }),
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter embedding failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Creates a 384-dimensional embedding vector for a given text.
 * Runs locally by default, with no network call or API key needed. Set EMBEDDINGS_PROVIDER=openrouter
 * to call OpenRouter's hosted model instead, e.g. where bundling the local model isn't practical.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  if (process.env.EMBEDDINGS_PROVIDER === "openrouter") {
    return createOpenRouterEmbedding(text);
  }
  return createLocalEmbedding(text);
}
