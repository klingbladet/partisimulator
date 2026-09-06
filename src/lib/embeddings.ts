/**
 * OpenAI embedding via text-embedding-3-small.
 * 384 dimensioner (matchar Supabase-tabellen).
 * Kör via API — ingen lokal modell (~120MB) behövs längre.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: "openai/text-embedding-3-small",
      dimensions: 384,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter embedding failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
