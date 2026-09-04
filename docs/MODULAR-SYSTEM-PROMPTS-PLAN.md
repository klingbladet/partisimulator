# Modular system prompts plan

This document records the plan behind the "src/lib/prompts.ts" refactor.
Status: implemented.

## Context

Partisimulator drives eight Swedish party personas through two template functions in "src/lib/prompts.ts", "buildDirectQuestionPrompt" and "buildDebatePrompt".
Each was one large template literal.
"party.tone", "party.rhetoricalStyle", and "party.keyIssues" were interpolated into exactly one line each, inside a numbered rules list that was otherwise identical for all eight parties.
Over 90 percent of what each model read was the same generic prose regardless of party, even though the persona data in "parties.ts" is genuinely distinct per party.
The two builders also duplicated the same "always answer, first person, cite sources, never refuse" rule text against each other, and each repeated it a second time internally.

This is the first of two related TODO items.
"Modular system prompts" gives each party a real voice instead of shared skeleton variables.
"Prompt output templates" forces a predictable, parseable answer structure.
Both are addressed by this change.

A stance marker for a future Agree, Disagree, Neutral meter was intentionally left out of this round.
Every field the server populates today on "ChatMessage", "DebateEntry", and "AskAllEvent", for example "sources", is rendered somewhere in the UI.
There is no precedent in this codebase for shipping a parsed field with no consumer.
The stance marker becomes its own increment when the meter UI is built.

## Approach

The refactor touches "src/lib/prompts.ts" only.
The public API stays identical, "buildDirectQuestionPrompt(party, context)" and "buildDebatePrompt(party, topic, context, conversationHistory)", so none of the three API routes need to change.
"src/lib/sources.ts" keeps working unmodified since the "[KÄLLA: ...]" marker convention is preserved verbatim.

Each builder is now composed from small named section functions joined with a blank line between sections.

- "buildManifestSection" factors out the "has RAG context" versus "fall back to ideology" branch
- "buildVoiceSection" is the core fix, it pulls tone, rhetorical style, key issues, party name, and display name into one prominent labeled block placed right after the role intro, instead of one interpolated line buried mid list
- "buildCoreBehaviorRules" holds the always answer, never refuse, first person, and cite sources rules, written once and shared by both modes
- "buildOutputFormatSection" is the new output template, an explicit numbered answer skeleton of opening stance, argument or proposal, optional source citation, and a length rule, shared by both modes and parametrized by a length constraint
- mode specific blocks stay separate, for example the debate rebuttal rule, the moderator reaction rule, the direct question follow up continuity rule, and the debate history block

"buildDirectQuestionPrompt" and "buildDebatePrompt" compose these blocks in order, role intro, voice, core rules, mode specific rules, output format, manifest context, debate history where applicable, then closing.

No changes were made to "src/types/party.ts" or "src/lib/parties.ts".
The persona data was already distinct per party, the problem was the template under using it, not the data being thin.

## Verification

1. "pnpm typecheck" passed with no errors, the public signatures are unchanged
2. Manual read through of the generated prompts for contrasting parties, for example S and SD, confirmed the voice content, the source citation instruction, and the mode specific rules still appear and read naturally in Swedish
3. Smoke test the three routes, "/ask" for one party, "/grid" for all parties, "/debatt" for a debate turn, to confirm streaming and citation extraction still work
