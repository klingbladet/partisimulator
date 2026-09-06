# PROJECT_MAP.md — PartiSimulator 2026

Senast uppdaterad: 2026-09-06

## Översikt

PartiSimulator är en svensk webapplikation där användare kan ställa politiska frågor till AI-simulerade partiledare för Sveriges 8 riksdagspartier. Svar bygger på respektive parts valmanifest via RAG (Retrieval-Augmented Generation).

## Tech Stack

| Lager         | Teknologi                                       |
| ------------- | ----------------------------------------------- |
| Framework     | Next.js 16.3.3 (App Router)                     |
| Språk         | TypeScript (strict), React 19.2.8               |
| Styling       | Tailwind CSS 4 + custom CSS-designsystem        |
| AI/LLM        | Vercel AI SDK + OpenRouter (`openrouter/free`)  |
| Embeddings    | @xenova/transformers (lokalt, 384-dim)          |
| Databas       | Supabase (PostgreSQL + pgvector)                |
| Pakethantering| pnpm                                            |
| Lintning      | Biome, markdownlint-cli2, cspell                |
| Node          | >= 22.18.0                                      |

## Tre interaktionslägen

1. **Direktfråga** (`/`) — En-partichat med uppfoljningsfrågor
2. **Alla partier** (`/grid`) — En fråga, alla 8 svarar i grid
3. **Debatt** (`/debatt`) — TV-debatt mellan 2+ partiledare

## Katalogstruktur

```text
partisimulator/
  src/
    app/
      page.tsx                    # Hem — direktfråga
      layout.tsx                  # Root layout (metadata, font)
      globals.css                 # Designsystem (525 rader)
      grid/page.tsx               # Alla partier
      debatt/page.tsx             # Debattläge
      api/
        ask/route.ts              # POST — enskild fråga (streaming)
        ask-all/route.ts          # POST — alla partier (SSE)
        debate/route.ts           # POST — debatt-svar (streaming)
    components/
      app-nav.tsx                 # Sticky nav med 3 flikar
      answer-bubble.tsx           # Svarskort i grid
      chat-bubble.tsx             # Chat-bubbla i direktfråga
      chat-view.tsx               # Full chattvy med header
      debate-components.tsx       # Debattbubbla
      debate-setup-panel.tsx      # Debatt-konfiguration
      debate-stage.tsx            # Talareväljare under debatt
      initial-question-form.tsx   # Startformulär med partiväljare
      page-container.tsx          # Gemensam wrapper
      party-avatar.tsx            # Cirkulär avatar med logotypecken
      party-chip.tsx              # Väljbar partiknapp
      question-input.tsx          # Textarea med räknare
      site-footer.tsx             # Footer med disclaimer
      stance-meter.tsx            # Ställning-till-tagg (för/emot/neutral)
    hooks/
      use-chat-conversation.ts    # State + streaming för direktfråga
      use-debate.ts               # State + streaming för debatt
    lib/
      api-response.ts             # Standardiserat felsvar
      embeddings.ts               # Lokal embedding-generering
      example-questions.ts        # 20 slumpmässiga frågor
      history.ts                  # Duplikatförebyggande
      model.ts                    # LLM-val (OpenRouter/MLX)
      openrouter.ts               # OpenRouter-klient
      parties.ts                  # Partidata + validering
      parties.json                # Statisk partydata (9 partier)
      prompts.ts                  # Systemprompt-byggare
      prompt-templates.json       # Statiska prompt-mallar
      rag.ts                      # Vektor-sökning i Supabase
      sentence-limit.ts           # Hård meningsbegränsning
      sources.ts                  # Käll- och standpunktparsning
      stream-ask-all.ts           # Klient-SSE-hjälpare
      supabase.ts                 # Supabase-klientfabrik
    types/
      chat.ts                     # ChatMessage
      debate.ts                   # DebateEntry
      manifest.ts                 # ManifestChunk
      party.ts                    # PartyId, PartyPersona
      stream.ts                   # AskAllEvent
  scripts/
    seed.ts                       # PDF → embeddings → Supabase
    manifests/                    # Partiernas valmanifest (PDF)
  data/pdfs/                      # Samma PDFer ( backup )
  supabase/schema.sql             # Databasschema + pgvector
  public/assets/
    characters/                   # Partiledar-avatars (webp)
    logos/                        # Partilogotyper (png)
    icons/                        # Ikoner (gavel m.m.)
    plenisalen.webp               # Debattbakgrund
```

## Dataflöde

```text
Användare → Komponent → Hook → API-route → RAG (Supabase pgvector)
                                         → Systemprompt (partipersona + kontext)
                                         → LLM (OpenRouter) → Streaming-svar
```

## API-endpoints

| Route         | Metod | Innehåll                                     | Timeout |
| ------------- | ----- | -------------------------------------------- | ------- |
| `/api/ask`    | POST  | Enskild partiledar-fråga (streaming)         | 60s     |
| `/api/ask-all`| POST  | Alla 8 partier parallellt (SSE)              | 120s    |
| `/api/debate` | POST  | Debatt-svar för nästa talare (streaming)     | 60s     |

## Beroendegraf (förenklad)

```text
page.tsx ──> use-chat-conversation ──> /api/ask ──> model, prompts, rag
grid/page.tsx ──> stream-ask-all ──> /api/ask-all ──> model, prompts, rag, sources
debatt/page.tsx ──> use-debate ─> /api/debate ──> model, prompts, rag

rag.ts ──> embeddings.ts ──> @xenova/transformers
rag.ts ──> supabase.ts ──> PostgreSQL + pgvector

prompts.ts ──> prompt-templates.json
prompts.ts ──> parties.ts ──> parties.json ──> types/party.ts
```

## Kända issue

- `getSupabaseClient()` i supabase.ts exporteras men används aldrig
- `seed.ts` kollar onödigtvis efter OPENROUTER_API_KEY
- Inga tester existerar
- `sentence-limit.ts` kan falla på förkortningar som "t.ex."
- Begränsad testparti (Shrek) bakom SHREK=true-flagga
