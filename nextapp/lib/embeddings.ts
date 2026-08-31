// @ts-ignore – @xenova/transformers saknar fullständiga TS-typer
import { pipeline as xenovaPipeline } from "@xenova/transformers";

/**
 * Local embedding helper using @xenova/transformers.
 * Runs entirely on the server — no external API call needed.
 *
 * Model: paraphrase-multilingual-MiniLM-L12-v2
 * - 384 dimensions
 * - Multilingual (supports Swedish)
 * - Downloaded and cached automatically on first use (~120 MB)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _embedder: any = null;

async function getEmbedder() {
  console.log("--> [EMBEDDINGS] getEmbedder called, cached:", !!_embedder);
  if (!_embedder) {
    console.log("--> [EMBEDDINGS] Loading @xenova/transformers pipeline...");
    _embedder = await xenovaPipeline(
      "feature-extraction",
      "Xenova/paraphrase-multilingual-MiniLM-L12-v2"
    );
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = await pipe([text], { pooling: "mean", normalize: true });
  return Array.from(output.data) as number[];
}
