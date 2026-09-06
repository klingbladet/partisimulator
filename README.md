# Partisimulator

Partisimulator lets you talk to your favorite (or un-favorite) politician. Chat, discuss, and ask questions.

If you're feeling up for it, you can even host your own panel debate.

Each party answers only from its own election manifesto.

Partisimulator embeds and retrieves each manifesto per party with RAG. That keeps each voice grounded in its own source. It doesn't borrow another party's positions.

## Tech stack

- Next.js (App Router)
- React
- Tailwind CSS
- Supabase (Postgres with pgvector)
- Vercel AI SDK, with Anthropic and OpenAI providers

## Prerequisites

- Node.js 22 or later
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

### Start the development server

```sh
pnpm dev
```

## Tooling

### Lint and format code

```sh
pnpm lint-format-code
```

### Lint and format markdown

```sh
pnpm lint-format-markdown
```

### Spellcheck

```sh
pnpm spellcheck
```

### Analyze the codebase

Checks for unused code, circular dependencies, duplication, and complexity.

```sh
pnpm analyze-code
```

Read the [coding guide](docs/CODING-GUIDE.md), the [tone of voice guide](docs/TONE-OF-VOICE.md), and the [markdown guide](docs/MARKDOWN-GUIDE.md) before contributing.

Write code, comments, commit messages, and documentation in English.
The app's own output stays Swedish — that's by design, not an exception to work around.

## Claude Code hooks

The guards in `.claude/hooks` run on Node, so they need no extra tooling and no setup step.

Claude Code registers them from `.claude/settings.json`.

Restart Claude Code after changing a hook or the settings file.

## Pre-commit hooks

Husky and lint-staged run `lint-format-code`, `lint-format-markdown`, and `spellcheck` on staged files before each commit.

`pnpm install` wires this up automatically through the `prepare` script.
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
It only works for local development, since a deployed instance can't reach a server running on your laptop.

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
- `OPENROUTER_API_KEY`, used by `openrouter`, the API key from your OpenRouter account
- `OPENROUTER_MODEL`, used by `openrouter`, the model slug to request, for example `anthropic/claude-sonnet-4.5`
- `MLX_BASE_URL`, used by `mlx`, the base URL of your running oMLX server, defaults to `http://localhost:8000/v1`
- `MLX_MODEL`, used by `mlx`, the model directory name exactly as oMLX reports it under `/v1/models`

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

Local embeddings, the default — `EMBEDDINGS_PROVIDER=local` is what `.env.example` ships with, though the variable is optional and can be left unset entirely:

```sh
EMBEDDINGS_PROVIDER=local
```

OpenRouter embeddings, independent of whichever `LLM_PROVIDER` you're running:

```sh
EMBEDDINGS_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
```
