import { type FeatureExtractionPipeline, pipeline as xenovaPipeline } from "@xenova/transformers";

/**
 * Local embedding helper using @xenova/transformers.
 * Runs entirely on the server — no external API call needed.
 *
 * Model: paraphrase-multilingual-MiniLM-L12-v2
 * - 384 dimensions
 * - Multilingual (supports Swedish)
 * - Downloaded and cached automatically on first use (~120 MB)
 */

let _embedder: FeatureExtractionPipeline | null = null;

export async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  console.log("--> [EMBEDDINGS] getEmbedder called, cached:", !!_embedder);
  if (!_embedder) {
    console.log("--> [EMBEDDINGS] Loading @xenova/transformers pipeline...");
    _embedder = await xenovaPipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");
    console.log("--> [EMBEDDINGS] Pipeline loaded successfully!");
  }
  return _embedder;
}

/**
 * Creates a 384-dimensional embedding vector for a given text.
 * Runs locally – no API key or network call required.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbedder();
  const output = await pipe([text], { normalize: true, pooling: "mean" });
  return Array.from(output.data as Float32Array);
}
