import type { ManifestChunk } from "@/types/manifest";
import { createEmbedding } from "./embeddings";
import { getSupabaseAdmin } from "./supabase";

/**
 * Builds the semantic search query for a debate turn.
 * The static topic alone keeps retrieval anchored to whatever the debate opened with, even many turns in
 * once the exchange has drilled into a specific claim - folding in the most recent exchange keeps the
 * retrieved manifest chunks pinned to what's actually being argued right now.
 */
export function buildRetrievalQuery(topic: string, history: { text: string }[], recentTurns: number = 2): string {
  const recentText = history
    .slice(-recentTurns)
    .map((entry) => entry.text)
    .join("\n");
  return recentText ? `${topic}\n${recentText}` : topic;
}

/**
 * Retrieves the most relevant manifest chunks for a given party and question
 * using cosine similarity search via Supabase pgvector.
 */
export async function retrieveContext(partyId: string, question: string, topK: number = 5): Promise<ManifestChunk[]> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<ManifestChunk[]>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("RAG timeout (30s) - fortsätter utan manifest")), 30_000);
    });

    const retrievalPromise = (async () => {
      const questionEmbedding = await createEmbedding(question);

      const { data, error } = await getSupabaseAdmin().rpc("match_manifest_chunks", {
        match_count: topK,
        match_party_id: partyId,
        match_threshold: 0.5,
        query_embedding: questionEmbedding,
      });

      if (error) {
        console.error("RAG search error:", error);
        return [];
      }

      return (data || []).map((row: { content: string; source_section: string; page_number: number }) => ({
        content: row.content,
        pageNumber: row.page_number || 0,
        sourceSection: row.source_section || "Okänt avsnitt",
      }));
    })();

    return await Promise.race([retrievalPromise, timeoutPromise]);
  } catch (error) {
    console.warn(`RAG retrieval failed/timed out for party ${partyId}, proceeding with persona only:`, error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
