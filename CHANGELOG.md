# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - yyyy-mm-dd

### Added

- None yet...

### Changed

- Nav logo now reads "Partisimulator 2026" on a single line.

### Removed

- None yet...

### Fixed

- None yet...

## [0.1.4] - 2026-09-07

### Added

- `--color-success` CSS variable in `globals.css`, alongside the existing `--color-error*`/`--color-warning` tokens
- Grid mode: a white "active question" card above the answer grid (matching debate mode's topic strip), showing the question that's actually being answered — tracked in its own `activeQuestion` state so editing the input mid-stream doesn't retroactively change it
- Grid mode ("Alla partier"): a "Partierna som svarar" preview section showing all 8 party cards before a question is asked, matching the up-front party preview already shown on the one-shot and debate pages
- `src/app/icon.png` (the app's gavel cursor image) wired up via Next's file-based favicon convention, replacing the default Vercel icon — the stale `src/app/favicon.ico`, a since-abandoned `src/app/icon.svg` attempt, and the unused `public/favicon.svg` still need manual deletion (blocked by this session's sandbox permissions)
- Self-hosted "Big Shoulders Black" display font (`src/app/fonts/`, loaded via `next/font/local`) for all headings and the `AppNav` logo text

### Changed

- `StanceMeter` (the Agree/Disagree/Neutral badge) restyled from a soft Tailwind alert pill (thin colored border, pastel background) to match the app's neo-brutalist system: solid black border, hard-offset shadow, solid color fill
- One-shot page's black party banner: dropped the key-issues list from the subtitle line, keeping just the party name, now bigger (`text-xs` → `text-sm`)
- The avatar/icon shown under each chat and debate bubble (party avatar and the user/moderator icon) enlarged from 22px to 44px
- The "Du"/moderator bubble, its icon badge, and its name label switched from `--color-user` (indigo) to `--color-ink` (black), so the human side of the conversation reads as neutral rather than another "party" color
- Grid mode's answer cards: 3 per row on desktop instead of 4 (`.grid-answers` in `globals.css`)
- The "Avbryt" stop icon (lucide's `Square`) is now solid-filled instead of outlined, across all three modes, so it reads clearly as a stop control against the rest of the app's outline iconography
- One-shot page split into two separate cards (question input, then a "Vem vill du fråga?" party picker), matching the already-separate input/party-picker cards used in debate and grid mode
- Debate mode's topic entry enlarged from a single-line `<input>` to a `rows={3}` textarea, matching the size of the shared `QuestionInput` used on the other two pages
- Debate mode's "Debattämne" heading above the topic input removed, matching the other two modes' headline-less input cards
- Grid mode: tightened the gap between the question-input card and the party grid from `mb-8` to `mb-6`, matching the spacing used elsewhere

### Removed

- `debateMode` state in `src/hooks/use-debate.ts` — set on start/reset and returned from the hook, but never read by `debatt/page.tsx` (its only consumer) and never set to anything but `"auto"`; fully dead
- 8 unused party-color CSS variables (`--color-s`, `--color-m`, `--color-sd`, `--color-v`, `--color-c`, `--color-kd`, `--color-l`, `--color-mp`) — never referenced anywhere in CSS or components; party colors are read from `parties.json` per party instead
- The Instrument Serif Google Fonts import and `--font-serif` variable, superseded by the local heading font

### Fixed

- `sanitizeSpeech()` (strips leaked model "thinking"/instruction text) was only wired into the debate path; one-shot chat (`use-chat-conversation.ts`) and grid mode (`/api/ask-all`) now run replies through it too, before extracting stance/sources
- `/api/debate` had no error handling at all, and `/api/ask-all` only caught errors inside each party's own promise — a malformed request body, or `getModel()` throwing, escaped as an unstyled 500 instead of the app's usual `{error}` JSON response; both routes now match `/api/ask`'s try/catch and `errorResponse` shape
- `src/lib/rag.ts` left five debug `console.log`/`console.warn` calls (`--> [RAG] ...`) from tracking down the embeddings regression; removed, and the surviving timeout/error warnings no longer carry the debug prefix
- `retrieveContext()`'s 30s timeout timer was never cleared once the real retrieval settled first (the common case), leaving a dangling `setTimeout` per call; now cleared in a `finally` block
- Party avatar under the chat/debate bubble had its background hardcoded to `--color-user` (indigo), a copy-paste artifact from the user bubble above it — now uses the party's own color
- One-shot chat's `[STÅNDPUNKT: ...]` marker leaked as raw bracket text while streaming and only turned into the parsed stance pill once the whole reply finished; the marker is now parsed live the moment it fully streams in (`pendingStance` in `use-chat-conversation.ts`), and an in-progress, not-yet-closed marker no longer renders as visible text in the meantime
- Grid mode's "Partierna som svarar" preview initially rendered as plain, unstyled avatars with no card background; switched to the same `PartyChip` component used elsewhere so it actually renders as a party grid

## [0.1.3] - 2026-09-06

### Added

- `MAX_DEBATE_TURNS = 8` hard cap on auto-mode debates (`src/hooks/use-debate.ts`)
- "Nästa replik" button for manual step-through once auto-mode is paused (`debate-controls.tsx`, `handleNextSpeaker`)
- `sanitizeSpeech()` strips leaked model "thinking"/instruction text from debate replies before they're stored or shown
- `ROADMAP.md` and `PROJECT_MAP.md`, both since superseded (see Removed)
- "Embeddings provider" section in `README.md`, documenting `EMBEDDINGS_PROVIDER` alongside the existing model-provider docs
- `ignoreScripts: false` in `pnpm-workspace.yaml`, and a rule in `CLAUDE.md`/`AGENTS.md` against bypassing lint/format hooks via `git commit --no-verify` or `ignore-scripts`
- "Antigravity hooks" section in `CLAUDE.md`/`AGENTS.md`, documenting the `.agents/hooks` guards alongside the existing Claude Code hooks section
- Rule in `CLAUDE.md`/`AGENTS.md` and `README.md`: write code, comments, commit messages, and documentation in English, distinct from the app's own Swedish output
- `README.md`'s "Embeddings provider" section now documents `local` as an explicit, settable value for `EMBEDDINGS_PROVIDER` (matching `.env.example`), not just "leave it unset"

### Changed

- New `noPleasantries` prompt rule bans AI-style openers ("Det är en intressant fråga...")
- Response length tightened across one-shot, ask-all, and debate prompts to a 60-80 word target (`prompt-templates.json`), with matching `maxOutputTokens` adjustments
- Debate mode: auto-play is now the fixed default on start; manual stepping only surfaces once paused
- RAG embeddings (`createEmbedding` in `src/lib/embeddings.ts`) now support two backends, mirroring `getModel()`'s `LLM_PROVIDER` pattern: local `@xenova/transformers` (default, no network call or API key) or OpenRouter's hosted `openai/text-embedding-3-small`, selected via the new `EMBEDDINGS_PROVIDER` env var
- RAG timeout raised from 2.5s to 30s (`src/lib/rag.ts`); debate retrieval now only feeds the last 2 history entries into the query
- Hardcoded hex colors and box-shadow values replaced with CSS custom properties across `globals.css` and components
- `pnpm-workspace.yaml`: `onlyBuiltDependencies` migrated to `allowBuilds` (pnpm 10.26+)

### Removed

- `getSupabaseClient()` and the backing `_publicClient` cache in `src/lib/supabase.ts` — exported but never called anywhere in the codebase
- `ROADMAP.md`'s and `PROJECT_MAP.md`'s still-relevant content, moved into `TODO.md` (translated to English) ahead of deleting both files

### Fixed

- `scripts/seed.ts` no longer requires `OPENROUTER_API_KEY` unconditionally; it's only checked when `EMBEDDINGS_PROVIDER=openrouter`, matching the dual-backend embeddings change
- `scripts/seed.ts` imported `getEmbedder` from `src/lib/embeddings.ts`, which no longer exports it after the dual-backend rewrite; removed the import, but initially missed that `main()` still called `await getEmbedder()` a few lines later — `tsconfig.json` excluded `scripts/` from type-checking, so this dangling reference wasn't caught until a manual regression pass; removed the stray call, since `createEmbedding()` already lazy-loads internally
- `tsconfig.json` no longer excludes `scripts/` from type-checking; it was already fully type-correct under the same compiler settings, so there was no reason it wasn't being checked
- `sanitizeSpeech()` was defined twice, identically, in both `src/lib/sanitize.ts` and `src/app/api/debate/route.ts`; the route now imports it from `@/lib/sanitize` instead of keeping its own copy
- `CLAUDE.md`/`AGENTS.md`'s hook-bypass rule referenced `~/.npmrc` for `ignore-scripts`; pnpm only reads auth/registry settings from `.npmrc`, so this pointed at the wrong file — corrected to the global `~/.config/pnpm/config.yaml`
- Reverted every party's `rhetoricalStyle` and `tone` in `parties.json` back to `main`'s originals; the AI had invented/hallucinated non-Swedish words
- `DebateStage`'s speaker selector rendered a doubled selection ring: the branch added `borderColor`/`boxShadow` styling to the outer speaker button while an identical ring already existed on the inner `PartyAvatar`, stacking two rings 2px apart; removed the outer button's duplicate, restoring the single ring on the avatar
- `globals.css`'s `:disabled, [disabled]` rule used `cursor: not-allowed !important`; the `!important` was redundant, since that selector already outranks the universal-selector cursor rule on specificity alone — removed
- `cspell.json`'s `ignorePaths` now excludes `pnpm-workspace.yaml` (dependency-name allowlists, not prose) and `next-env.d.ts` (Next.js-generated, never hand-edited)

## [0.1.2] - 2026-09-06

### Added

- Husky and lint-staged, running lint-format-code, lint-format-markdown, and spellcheck on staged files before each commit
- Add tool hooks for Antigravity and perhaps ChatGPT? I don't know with all these FRIGGING files and folders and scripts. Please agree on a standard!!!!!!!!!!!!!!!!!!!!

### Changed

- Reorganized `src/components` into `chat/`, `debate/`, `grid/`, and `shared/` feature folders
- Extracted shared `SourcesList` and `TypingDots` components, removing duplicated markup from the chat/debate/answer bubbles
- Extracted `DebateControls` from `debatt/page.tsx`
- Renamed `debate-components.tsx` to `debate-bubble.tsx` for naming consistency
- Merged `ChatBubble` and `DebateBubble` into one shared `Bubble` component (`src/components/shared/bubble.tsx`) with a `variant` prop
- `PartyChip`: shows the party leader's full name (bold, bigger) above the party name instead of the abbreviation; no longer fades the selected card when `disabled`
- One-shot page: submit button reads "Fråga {leader's first name} från {party name}!"; removed the "är vald" banner below the party grid
- Grid mode: removed the empty-state "Skriv en fråga..." block; answer cards no longer swap to a typing-dots indicator in the header while streaming, and no longer repeat the party abbreviation next to the logo badge
- `Bubble`: avatar/name row moved below the bubble for both variants, with more breathing room and a tail that points down at it; removed the per-turn "#N" badge; user/moderator bubble now has a small circular avatar (matching party avatars) instead of a bare icon
- Debate mode redesigned into three regions: a slim `DebateStage` header strip (topic + every debater's avatar, current speaker ringed in their color) on top, the transcript given the dominant share of vertical space in the middle, and a single-row `DebateControls` composer (input, send, stop, pause/resume, end) at the bottom — matching the one-shot page's header/transcript/input convention
- Debate mode: "Avsluta debatten" now asks for confirmation before ending
- Debate mode: replies now open by addressing the previous speaker by name and referencing something concrete they just said, instead of stating a generic stance first
- Debate mode: replies may now call out a genuine self-contradiction from anywhere earlier in the debate, not just the immediately preceding speaker
- Anti-tampering fallback line is now improvised per-party instead of one fixed sentence repeated by every party
- All modes: policy claims must be paired with a concrete, tangible consequence for an ordinary voter instead of generic phrasing
- Debate mode: manifesto retrieval now queries on the topic plus the most recent exchange instead of the static topic alone, so cited chunks stay pinned to the specific claim being argued as the debate drills in
- Debate mode's finished state redesigned into a "game over"-style card (message + single "Ny debatt" button), replacing the stat-line banner
- Corrected CLAUDE.md's model provider description and added missing tooling, pre-commit, and Claude Code hooks info from README.md

### Removed

- One-shot page's "är vald" banner and Grid mode's empty-state block (see Changed)
- `src/components/chat/chat-bubble.tsx` and `src/components/debate/debate-bubble.tsx`, replaced by the shared `Bubble` component

### Fixed

- Debate mode: a stale snapshot of `history` was rebuilt after every reply instead of reading the latest state, which could silently drop or reorder a user interjection sent while a reply was streaming (occasionally making it vanish entirely); each turn now reserves its slot in history immediately and fills it in when done, so ordering holds regardless of when an interjection is sent
- Debate mode's interjection composer was effectively unusable during auto mode (input disabled and the send button hidden behind "Avbryt" almost the entire time, since replies chain back to back); the input is always typeable now and send/stop are separate, always-available buttons
- Debate auto mode could pick the same party to open a new round that had just closed the previous one; the next speaker's queue now avoids repeating the last speaker
- Debate transcript auto-scroll now also snaps to bottom the instant a new speaker starts, not just when a turn completes
- `DebateStage`'s debater avatar row now wraps instead of overflowing its container on small screens
- Removed the global `html { scroll-behavior: smooth }` rule in `globals.css`, which fought the new instant-snap-to-bottom scrolling added for chained auto-mode debate turns (see above); scroll-to-bottom calls that do want an animation already pass `behavior: "smooth"` explicitly per call
- Navigating away from an in-progress reply (one-shot, grid, or debate) no longer leaves it streaming in the background — the request is now aborted on unmount
- Debate mode: the reply prompt's closing instruction always referenced the debate's static opening topic, even when the last entry was a user interjection asking something else, making parties drift back to the original question instead of answering the new one; it now points at the interjected question directly when that's what's being answered
- Debate mode: any draft text sitting in the interjection input, not yet submitted, was silently swept into the transcript and sent the moment the next speaker's turn started (auto mode's chained turns in particular); removed the duplicate auto-submit path in `generateSpeech` so only explicitly submitting (Send/Enter) ever adds an interjection
- Grid mode's answer cards could overflow their column when a party name had no natural line-break point (e.g. "Sverigedemokraterna"), pushing the whole page (nav and footer included) into a horizontal scrollbar; party name/abbreviation now truncate in the card header, and `.grid-answers`' columns use `minmax(0, 1fr)` so this class of overflow can't recur
- One-shot's active-party banner showed a redundant abbreviation pill next to the name, inconsistent with grid mode's card header; removed it
- None of `/api/ask`, `/api/ask-all`, or `/api/debate` forwarded the request's abort signal into `streamText`/`generateText`, so aborting the fetch client-side (e.g. navigating away) never actually stopped the LLM call server-side — it kept running and streaming into nothing; all three now pass `abortSignal: req.signal` through
- Debate auto mode's chained turns could keep firing after the debate page unmounted: the unmount cleanup only aborted the in-flight fetch, but `generateSpeech`'s post-await check for whether to continue to the next speaker only reads `autoModeRef`/`debateFinishedRef`, never the fact that the hook itself had unmounted; the cleanup now also marks the debate finished so the chain stops
- Navigating away from Grid mode while all 8 parties were still answering didn't actually stop their generation server-side: `/api/ask-all`'s hand-rolled SSE stream had no `cancel()` handler, so its `Promise.all` of `generateText` calls kept running to completion regardless of whether the client was still reading — `req.signal` only reflects the already-fully-read request body, not the response being abandoned; a dedicated `AbortController` wired to the stream's `cancel()` now actually stops every in-flight party call

## [0.1.1] - 2026-09-05

### Added

- Agree/Disagree/Neutral stance meter on every answer in one-shot and grid mode, parsed from a new "[STÅNDPUNKT: ...]" marker the model is required to lead each answer with
- Grid mode: each party's answer now has a short quick-scan reply plus a 5–7 sentence long answer in a closed-by-default "Läs mer" drawer, split via a new "[LÅNGT SVAR]" marker
- Grid mode: a "Fortsätt chatta" button on each card hands the question and answer off to the direct-question page with that party pre-selected and the conversation already seeded, via new "?party=&q=&a=" URL params read by "useChatConversation"
- Deterministic per-model length enforcement: "src/lib/sentence-limit.ts" truncates replies to a configured sentence count in code (a streamText transform for the streaming routes, a plain truncation for ask-all), so the length limit holds regardless of which model answers, not just when a model happens to follow the prompt's own instruction
- Shrek as a feature-flagged test party (behind "SHREK=true", exposed to client code via "next.config.ts"'s "env" option), hidden from the default 8-party experience
- "SiteFooter" component: the single, global AI-simulation notice, rendered once in the footer on every page
- "PageContainer" component: shared max-w-6xl content width across all three routes, matching "AppNav"'s own width
- Cancel/stop button in all three modes (one-shot, grid, debate) — aborts the in-flight request, keeps whatever text streamed so far, and snaps the view back to the bottom
- Debate auto mode: a Play/Pause toggle that generates replies in sequence automatically, with speaking order reshuffled every round (unlimited by design, no reply cap — the user pauses or ends the debate manually)
- Random opening speaker when a debate starts
- "Slumpa fråga" button next to the question input in all three modes, populates the field with a random example question from a new "src/lib/example-questions.ts"
- lucide-react icon set, replacing every emoji across the app
- Anti-tampering rule in every party's system prompt, built in "buildRulesSection" ("src/lib/prompts.ts"): an explicit exception to the "always answer" rule for meta-questions about the AI/system prompt/instructions, bans the words that let a model self-disclose as an AI, and gives it a party-specific in-character deflection line instead of breaking character

### Changed

- Refactor "src/lib/prompts.ts" into composable section builders so each party's voice gets its own prominent block and both prompt modes share one output template instead of duplicated prose, see "docs/MODULAR-SYSTEM-PROMPTS-PLAN.md"
- Split the direct-question prompt into two independently tunable templates, "buildOneShotPrompt" for "/api/ask" and "buildAskAllPrompt" for "/api/ask-all", so grid answers can have their own short-length rule instead of sharing the one-shot conversation's rules verbatim
- Move party persona data into "src/lib/parties.json" and static prompt section text (headers, rule wording, per-mode output steps and length constraints) into "src/lib/prompt-templates.json", so tweaking a party's personality or a prompt's wording no longer requires reading "prompts.ts"
- Grid mode's answer cards move sources into the header (always visible) instead of the bottom of the card body, and drop the mandatory full AI-simulation disclaimer paragraph in favor of the "Fortsätt chatta" button — a deliberate, explicit exception to this project's own "notice after every response" rule, scoped to grid cards only; one-shot and debate bubbles keep their disclaimer
- Removed the per-answer AI-simulation disclaimer everywhere in favor of the single global footer notice; ".claude/CLAUDE.md"'s disclaimer rule updated to match
- Logo in "AppNav" is a plain anchor instead of "next/link", so clicking it always does a full page reload and clears state
- Auto-scroll in one-shot chat and the debate transcript now only fires when a new turn is added, not on every streamed chunk, so scrolling up during generation isn't fought
- One-shot page: the question input and party selector are combined into a single card, input above the party grid; typing is now allowed before a party is picked — only the submit button requires one
- Debate setup: topic input moved above the party/debater grid
- Removed the non-functional "Fråga alla 8 partier" hand-off button and the "Enter för att skicka" hint from the one-shot page
- CSS converted to logical properties (inline-start/end, block-start/end) throughout "globals.css" and Tailwind utility classes across components
- Grid mode's answer cards are equal height per row, with the "Fortsätt chatta" button pinned to the card's bottom edge
- Grid mode's "alla 8 har svarat" banner moved up next to the progress bar instead of the bottom of the page, so it's visible without scrolling
- Grid mode's question input card is full width, matching the rest of the page
- Relaxed hooks to allow pnpm
- Debate mode: removed the redundant "Vem talar härnäst?" pill-button speaker list ("DebateSpeakerSelector") since clicking a party card already selects the next speaker; the remaining speaker picker ("DebateStage") now reuses the same "PartyChip" cards and "party-grid" layout as the one-shot and setup-panel party selectors instead of its own bespoke standing-cutout/TV-chyron styling
- Debate mode: reordered the active-debate layout to input bar, then the party/speaker cards, then the transcript, matching the one-shot page's input-above-selector convention
- "PartyChip" accepts an optional "disabled" prop (default false, no change for existing callers) so it can be reused as the debate speaker picker while a reply is streaming
- Debate transcript now also auto-scrolls while a reply is streaming, not just when a full turn completes, but only when already scrolled near the bottom — so long replies stay in view without fighting someone scrolled up to reread an earlier turn
- Various design tweaks to unify design across the different modes

### Removed

- Completed items from "TODO.md": modular system prompts, lucide-react iconography, global footer disclaimer, cancel/stop in all modes, stop-forces-scroll, prompt output templates, grid quick-status stance and trimmed answers, debate random opening speaker, debate auto/manual controls, and the agree/disagree/neutral meter

### Fixed

- Sources section on grid mode's answer cards always renders now, showing "Ingen källa finns" instead of disappearing when a party's answer has no source
- A malformed or truncated "[STÅNDPUNKT: ...]" marker (e.g. a model cutting "FÖR" short) no longer leaks into the visible answer text

## [0.1.0] - 2026-09-04

Set up repo, install packages like linter, formatter. Did some restructuring. Added projects docs and stuff like that. Support for local models.

### Added

- Support for local models

### Changed

- Restructure repo

### Fixed

- Remove dead code
