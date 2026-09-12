# Partisimulator

Partisimulator lets you talk to your favorite (or un-favorite) politician. Chat, discuss, and ask questions. Where do you stand politically?

If you're feeling up for it, you can even host your own panel debate!

Partisimulator embeds and retrieves each political party's manifesto and uses RAG to get accurate responses. That keeps each voice grounded in its own source. It doesn't borrow another party's positions.

## Tech stack

- Next.js (App Router)
- React
- Tailwind CSS
- Supabase (Postgres with pgvector)
- Vercel AI SDK, via OpenRouter (proxying Anthropic, OpenAI, and other models) or a local OpenAI-compatible endpoint (oMLX)

## Prerequisites

- Node.js 22.18 or later
- pnpm
- A Supabase project, for the database and pgvector

## Getting started

Install dependencies from the repository root.

```sh
pnpm install
```

### Environment variables

Create a `.env` file in the repository root with the required variables.

Use `.env.example` as a template.

Next.js loads `.env` automatically, and `scripts/seed.ts` reads it too.
One file covers both the dev server and the seed script below.

`MAKER_NAMES` is optional and only used by the "about us" page (`/om-projektet`): a comma-separated list of the project's real first names, kept out of source control on purpose. Leave it unset to skip that page's AI-generated cast list.

### Database setup

Create the `manifest_chunks` table and its search function by running [supabase/schema.sql](supabase/schema.sql) in your Supabase project's SQL editor.

Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` to your Supabase project's URL and service role key.

Then seed each party's manifesto into that table.

```sh
pnpm run seed
```

This embeds the PDFs in `scripts/manifests/` and writes the resulting chunks to Supabase.
Without this step, retrieval finds no manifest chunks for any party, and every reply falls back to the ungrounded, persona-only path.

### Start the development server

```sh
pnpm run dev
```

## Tooling

### Lint and format code

```sh
pnpm run lint-format-code
```

### Lint and format markdown

```sh
pnpm run lint-format-markdown
```

### Spellcheck

```sh
pnpm run spellcheck
```

### Analyze the codebase

Checks for unused code, circular dependencies, duplication, and complexity.

```sh
pnpm run analyze-code
```

Read the [coding guide](docs/CODING-GUIDE.md), the [tone of voice guide](docs/TONE-OF-VOICE.md), and the [markdown guide](docs/MARKDOWN-GUIDE.md) before contributing.

Write code, comments, commit messages, and documentation in English.

The app's own output stays Swedish - that's by design, not an exception to work around.

## Claude Code hooks

The guards in `.claude/hooks` run on Node, so they need no extra tooling and no setup step.

Claude Code registers them from `.claude/settings.json`.

Restart Claude Code after changing a hook or the settings file.

## Pre-commit hooks

Husky and lint-staged run `lint-format-code`, `lint-format-markdown`, and `spellcheck` on staged files before each commit.

`pnpm install` wires this up automatically through the "prepare" script.

No extra setup step is needed.

Only the staged content is committed.

If a hook reports an issue, fix it manually (if it isn't fixed automatically), then stage the file again before committing.

## Good to know

### Model provider

Chat generation goes through one of two backends.
`LLM_PROVIDER` in `.env` picks which one.
`getModel()` in [src/lib/model.ts](src/lib/model.ts) resolves the backend on every request.

#### OpenRouter, the default

The app uses `openrouter` when `LLM_PROVIDER` is unset or set to anything other than `mlx`.
It routes through [OpenRouter](https://openrouter.ai), which proxies most frontier models behind one API key.
This includes Anthropic and OpenAI models.
It works anywhere you deploy the app, including on Vercel.

#### Local models with oMLX

`mlx` routes to a local model that [oMLX](https://github.com/jundot/omlx) serves on your own machine.
It requires Apple Silicon.

#### Your Claude or ChatGPT login won't work here

Claude Pro, ChatGPT Plus, Claude Code CLI, and IDE plugins like a Copilot extension can't power this app.
They authenticate with an OAuth session tied to that one product.
Their terms of service block using that session to run a separate app's backend.

Anthropic and OpenAI sell API keys separately from those subscriptions.
Get one at [console.anthropic.com](https://console.anthropic.com) or [platform.openai.com](https://platform.openai.com).
API usage bills per token, apart from any subscription you already pay for.

OpenRouter already gives you both, which is why it's the default here.

For example, setting `OPENROUTER_MODEL=anthropic/claude-sonnet-4.5` does run this app on Claude.
It uses OpenRouter's metered access to that model, billed to your `OPENROUTER_API_KEY`.
Your Claude Pro seat and your Claude Code CLI login stay out of it entirely.

#### Environment variables

These environment variables control the model provider.

- `LLM_PROVIDER`, used by both, set to `mlx` to go local or leave unset for OpenRouter
- `OPENROUTER_API_KEY`, required by `openrouter`, the API key from your OpenRouter account
- `OPENROUTER_MODEL`, required by `openrouter`, the model slug to request, for example `anthropic/claude-sonnet-4.5` - there's no default, the app throws without it
- `MLX_BASE_URL`, used by `mlx`, the base URL of your running oMLX server, defaults to `http://localhost:8000/v1`
- `MLX_MODEL`, used by `mlx`, the model directory name exactly as oMLX reports it under `/v1/models`
- `MLX_API_KEY`, used by `mlx`, the API key your oMLX server expects, defaults to `local`

#### Examples

Local model, served by oMLX:

```sh
EMBEDDINGS_PROVIDER=local
LLM_PROVIDER=mlx
MLX_BASE_URL=http://localhost:8000/v1
MLX_MODEL=Dolphin3.0-Llama3.1-8B-MLX-6bit
```

Frontier model, routed through OpenRouter.
Leave `LLM_PROVIDER` unset or set it to `openrouter`.

```sh
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
```

```sh
OPENROUTER_MODEL=openai/gpt-5
```

### Embeddings provider

Embeddings for the manifesto RAG are a separate choice from chat generation.
`EMBEDDINGS_PROVIDER` in `.env` picks which one, independently of `LLM_PROVIDER`.
`createEmbedding()` in [src/lib/embeddings.ts](src/lib/embeddings.ts) resolves the backend on every request.

#### Local, the default

The app runs embeddings locally via `@xenova/transformers` when `EMBEDDINGS_PROVIDER` is `local`, unset, or set to anything other than `openrouter`.
No network call and no API key needed.
This holds regardless of `LLM_PROVIDER`, so even `mlx` and OpenRouter chat generation both get local, offline, no-cost RAG by default.

#### OpenRouter

Set `EMBEDDINGS_PROVIDER=openrouter` to call OpenRouter's hosted `openai/text-embedding-3-small` model instead, billed to your `OPENROUTER_API_KEY`.
Useful where bundling the local model isn't practical, for example some serverless deployments.

#### Environment variables

- `EMBEDDINGS_PROVIDER`, set to `openrouter` to use OpenRouter's hosted embeddings, or `local` (or leave unset) to run locally
- `OPENROUTER_API_KEY`, used by `openrouter`, the same key used by the `openrouter` chat provider

#### Examples

Local embeddings, the default behavior when the variable is unset or absent:

```sh
EMBEDDINGS_PROVIDER=local
```

OpenRouter embeddings, independent of whichever `LLM_PROVIDER` you're running - `.env.example` ships with this in its default (OpenRouter) block:

```sh
EMBEDDINGS_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
```

### Test-only parties

`SHREK` in `.env` shows test-only parties, hidden from the default experience. Set it to `true` to see them; it defaults to `false`.

### Debugging and rate limiting

`DEBUG=true` in `.env` logs RAG and LLM generation durations, RAG chunk counts, and the resolved model per request to the console. Local dev only, no log shipping.

`RATE_LIMIT_ENABLED=false` in `.env` turns off the best-effort, in-memory per-IP rate limiting on `/api/ask`, `/api/ask-all`, and `/api/debate`. It defaults to enabled.

## AI reflection

This assignment asks for a reflection on the AI technology used, written directly in this README.

### Which new AI technology did we identify, and how did we apply it?

We identified retrieval-augmented generation, RAG for short, paired with Supabase's pgvector extension.
Each party's manifesto gets split into overlapping chunks and embedded once, ahead of time, by `scripts/seed.ts`.
At request time, `retrieveContext()` in [src/lib/rag.ts](src/lib/rag.ts) embeds the user's question and runs a cosine similarity search against those chunks through a `match_manifest_chunks` Postgres function.
The matching chunks get folded into that party's system prompt, so its answer only draws on lines its own manifesto actually contains.

We also built a grounding check on top of retrieval.
`createGroundingMarkerTransform()` in [src/lib/grounding-transform.ts](src/lib/grounding-transform.ts) stamps a reply as ungrounded, server side, whenever retrieval found no matching chunks.
A model can still claim a source in its own text, so the client never trusts that claim on its own.

Chat generation itself streams through the Vercel AI SDK, which lets one code path (`getModel()` in [src/lib/model.ts](src/lib/model.ts)) swap between OpenRouter's hosted models and a local oMLX server with one environment variable.

### Why did we choose that technology?

Eight parties needed eight distinct, non-interchangeable voices, each backed by its own real source text.
RAG was the direct fit: it grounds each party in its own manifesto chunks instead of one shared prompt, so no party can drift into citing another party's policy.

Embeddings beat keyword search here because a voter's question rarely uses the same words as a manifesto.
"Vad tycker ni om klimatet?" and a manifesto section titled "Miljö och hållbar utveckling" share no keywords, but sit close together in embedding space.

Local embeddings, through `@xenova/transformers`, run for free with no API key and no network round trip, so retrieval adds no extra latency or cost to most requests.
OpenRouter over a single-provider SDK meant the app could compare answers from different frontier models, or fail over between them, by changing one environment variable instead of a line of code, and it still works on a serverless deploy target like Vercel, unlike the local-only MLX path.

### Why was the AI component needed, and could we have solved it another way?

The core feature, answering an open-ended political question in a specific party's voice, is inherently generative.
A user can ask anything, in any phrasing, so no fixed set of canned replies or a decision tree could cover it.

The RAG layer specifically replaces what would otherwise be manual, per-party keyword tagging of manifesto passages, decided by us instead of by whatever the user actually asks.
That approach breaks the moment a question uses different words than the tags anticipated, which is often, given how varied real questions turn out to be.

AI was not free of tradeoffs.
A language model can still hallucinate a stance no manifesto supports, so this app leans on retrieval grounding (the ungrounded marker above) and a visible link to the real manifesto PDF, rather than trusting the model's own claims about its sources.

## Changelog

A [changelog](CHANGELOG.md) exists for those curious.
