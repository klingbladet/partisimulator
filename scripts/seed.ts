#!/usr/bin/env tsx

/**
 * PartiSimulator 2026 – Manifest Seed Script
 *
 * Usage:
 *   1. PDF-filer i scripts/manifests/ (s.pdf, m.pdf, sd.pdf, v.pdf, c.pdf, kd.pdf, l.pdf, mp.pdf)
 *   2. Sätt Supabase-nycklarna i .env.local (och OPENROUTER_API_KEY om EMBEDDINGS_PROVIDER=openrouter)
 *   3. Kör: npm run seed
 *
 * Embeddings körs LOKALT med @xenova/transformers som standard (ingen API-nyckel behövs).
 * Modell: paraphrase-multilingual-MiniLM-L12-v2 (384 dimensioner, stöder svenska)
 * Modellen laddas ner automatiskt vid första körning (~120 MB).
 * Sätt EMBEDDINGS_PROVIDER=openrouter för att köra embeddings via OpenRouter istället.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import pdfParse from "pdf-parse";
import { createEmbedding } from "../src/lib/embeddings";

// Load env variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));

const PARTIES = [
  { id: "parti-s", pdfFile: "s.pdf" },
  { id: "parti-m", pdfFile: "m.pdf" },
  { id: "parti-sd", pdfFile: "sd.pdf" },
  { id: "parti-v", pdfFile: "v.pdf" },
  { id: "parti-c", pdfFile: "c.pdf" },
  { id: "parti-kd", pdfFile: "kd.pdf" },
  { id: "parti-l", pdfFile: "l.pdf" },
  { id: "parti-mp", pdfFile: "mp.pdf" },
];

const MANIFESTS_DIR = path.join(__dirname, "manifests");
const CHUNK_SIZE = 500; // approximate tokens (4 chars ≈ 1 token)
const CHUNK_OVERLAP = 50;
const CHARS_PER_TOKEN = 4;

interface TextChunk {
  text: string;
  start: number;
}

/** Split text into overlapping chunks, keeping each chunk's original offset for page/section lookup */
function chunkText(text: string, chunkSizeChars: number, overlapChars: number): TextChunk[] {
  const chunks: TextChunk[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSizeChars, text.length);
    chunks.push({ start, text: text.slice(start, end).trim() });
    if (end >= text.length) break;
    start = end - overlapChars;
  }
  return chunks.filter((chunk) => chunk.text.length > 50);
}

/** Try to extract section heading from surrounding text */
function extractSection(fullText: string, chunkStart: number): string {
  const preceding = fullText.slice(Math.max(0, chunkStart - 300), chunkStart);
  const headingMatch = preceding.match(/\n([A-ZÅÄÖ][A-ZÅÄÖa-zåäö\s]{3,50})\n/g);
  const lastHeading = headingMatch?.at(-1);

  if (lastHeading) {
    return lastHeading.trim();
  }
  return "Allmänt";
}

async function seedParty(partyId: string, pdfFile: string) {
  const pdfPath = path.join(MANIFESTS_DIR, pdfFile);

  if (!fs.existsSync(pdfPath)) {
    console.warn(`⚠️  PDF saknas: ${pdfPath} – hoppar över ${partyId}`);
    return;
  }

  console.log(`\n📄 Bearbetar ${partyId}: ${pdfFile}`);

  // Parse PDF
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(pdfBuffer);
  const fullText = pdfData.text;

  console.log(`   Extraherade ${fullText.length} tecken, ${pdfData.numpages} sidor`);

  // Split into chunks
  const chunkSizeChars = CHUNK_SIZE * CHARS_PER_TOKEN;
  const overlapChars = CHUNK_OVERLAP * CHARS_PER_TOKEN;
  const chunks = chunkText(fullText, chunkSizeChars, overlapChars);

  console.log(`   Skapade ${chunks.length} chunks`);

  // Delete existing chunks for this party
  const { error: deleteError } = await supabase.from("manifest_chunks").delete().eq("party_id", partyId);

  if (deleteError) {
    console.error(`   Fel vid borttagning av gamla chunks:`, deleteError);
  }

  // Process chunks
  let successCount = 0;
  for (const [index, { text: chunk, start: chunkStart }] of chunks.entries()) {
    const position = chunkStart / fullText.length;
    const pageNumber = Math.floor(position * pdfData.numpages) + 1;
    const sourceSection = extractSection(fullText, chunkStart);

    try {
      const embedding = await createEmbedding(chunk);

      const { error } = await supabase.from("manifest_chunks").insert({
        content: chunk,
        embedding,
        page_number: pageNumber,
        party_id: partyId,
        source_section: sourceSection,
      });

      if (error) {
        console.error(`\n   Chunk ${index + 1} fel:`, error.message);
      } else {
        successCount++;
        process.stdout.write(`\r   Uppladdade ${successCount}/${chunks.length} chunks...`);
      }
    } catch (error) {
      console.error(`\n   Embedding-fel för chunk ${index + 1}:`, error);
    }
  }

  console.log(`\n   ✅ Klar! ${successCount}/${chunks.length} chunks laddade upp för ${partyId}`);
}

async function main() {
  console.log("🗳️  PartiSimulator 2026 – Manifest Seeding");
  console.log("==========================================\n");
  const usesOpenRouterEmbeddings = process.env.EMBEDDINGS_PROVIDER === "openrouter";
  console.log(
    usesOpenRouterEmbeddings
      ? "📌 Embedding-motor: OpenRouter (openai/text-embedding-3-small)"
      : "📌 Embedding-motor: Lokal (paraphrase-multilingual-MiniLM-L12-v2)",
  );

  if (usesOpenRouterEmbeddings && !process.env.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY saknas i .env.local (krävs när EMBEDDINGS_PROVIDER=openrouter)");
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Supabase-nycklar saknas i .env.local");
    process.exit(1);
  }

  if (!fs.existsSync(MANIFESTS_DIR)) {
    console.error(`❌ Mappen scripts/manifests/ saknas`);
    process.exit(1);
  }

  for (const party of PARTIES) {
    await seedParty(party.id, party.pdfFile);
  }

  console.log("\n\n🎉 Seeding klar! Alla partiers manifest är uppladdade till Supabase.");
}

main().catch(console.error);
