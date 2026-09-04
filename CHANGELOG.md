# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - yyyy-mm-dd

### Added

- Nothing yet...

### Changed

- Nothing yet...

### Removed

- Nothing yet...

### Fixed

- Nothing yet...

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
