#!/usr/bin/env ts-node
/**
 * PartiSimulator 2026 – Manifest Seed Script
 *
 * Usage:
 *   1. PDF-filer i scripts/manifests/ (s.pdf, m.pdf, sd.pdf, v.pdf, c.pdf, kd.pdf, l.pdf, mp.pdf)
 *   2. Sätt OPENROUTER_API_KEY och Supabase-nycklar i .env.local
 *   3. Kör: npm run seed
 *
 * Embeddings körs LOKALT med @xenova/transformers (ingen API-nyckel behövs för embeddings).
 * Modell: paraphrase-multilingual-MiniLM-L12-v2 (384 dimensioner, stöder svenska)
 * Modellen laddas ner automatiskt vid första körning (~120 MB).
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import pdfParse from "pdf-parse";
import * as dotenv from "dotenv";
// @ts-ignore – transformers har inte fullständiga TS-typer i alla versioner
import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

// Load env variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
const CHUNK_SIZE = 500;   // approximate tokens (4 chars ≈ 1 token)
const CHUNK_OVERLAP = 50;
const CHARS_PER_TOKEN = 4;

// Embedding pipeline (initialized once and reused)
let embedder: FeatureExtractionPipeline | null = null;

/** Initialize the local embedding model (downloaded once, cached locally) */
async function getEmbedder() {
  if (!embedder) {
    console.log("   ⏳ Laddar ner embedding-modell (paraphrase-multilingual-MiniLM-L12-v2, ~120 MB)...");
    console.log("   (Detta sker bara en gång – modellen cachas lokalt)\n");
    embedder = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");
    console.log("   ✅ Embedding-modell laddad!\n");
  }
  return embedder;
}

/** Create a 384-dim embedding vector locally (no API call) */
async function createEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbedder();
  const output = await pipe([text], { pooling: "mean", normalize: true });
  // output.data is a Float32Array – convert to regular array
  return Array.from(output.data as Float32Array);
}

/** Split text into overlapping chunks */
function chunkText(text: string, chunkSizeChars: number, overlapChars: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSizeChars, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = end - overlapChars;
  }
  return chunks.filter((c) => c.length > 50);
}

/** Try to extract section heading from surrounding text */
function extractSection(fullText: string, chunkStart: number): string {
  const preceding = fullText.slice(Math.max(0, chunkStart - 300), chunkStart);
  const headingMatch = preceding.match(/\n([A-ZÅÄÖ][A-ZÅÄÖa-zåäö\s]{3,50})\n/g);
  if (headingMatch) {
    return headingMatch[headingMatch.length - 1].trim();
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
  const { error: deleteError } = await supabase
    .from("manifest_chunks")
    .delete()
    .eq("party_id", partyId);

  if (deleteError) {
    console.error(`   Fel vid borttagning av gamla chunks:`, deleteError);
  }

  // Process chunks
  let successCount = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkStart = fullText.indexOf(chunk);
    const position = chunkStart / fullText.length;
    const pageNumber = Math.floor(position * pdfData.numpages) + 1;
    const sourceSection = extractSection(fullText, chunkStart);

    try {
      const embedding = await createEmbedding(chunk);

      const { error } = await supabase.from("manifest_chunks").insert({
        party_id: partyId,
        content: chunk,
        embedding,
        source_section: sourceSection,
        page_number: pageNumber,
      });

      if (error) {
        console.error(`\n   Chunk ${i + 1} fel:`, error.message);
      } else {
        successCount++;
        process.stdout.write(`\r   Upladdade ${successCount}/${chunks.length} chunks...`);
      }
    } catch (err) {
      console.error(`\n   Embedding-fel för chunk ${i + 1}:`, err);
    }
  }

  console.log(`\n   ✅ Klar! ${successCount}/${chunks.length} chunks laddade upp för ${partyId}`);
}

async function main() {
  console.log("🗳️  PartiSimulator 2026 – Manifest Seeding");
  console.log("==========================================\n");
  console.log("📌 Embedding-motor: Lokal (paraphrase-multilingual-MiniLM-L12-v2)");
  console.log("📌 Ingen Anthropic-nyckel behövs för embeddings!\n");

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY saknas i .env.local");
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

  // Pre-load embedding model before processing parties
  await getEmbedder();

  for (const party of PARTIES) {
    await seedParty(party.id, party.pdfFile);
  }

  console.log("\n\n🎉 Seeding klar! Alla partiers manifest är uppladdade till Supabase.");
}

main().catch(console.error);
