# TODO

## Architecture

- [ ] Make the app 100% modular
- [ ] Add automated tests — none exist yet
- [ ] `sentence-limit.ts` can miscount sentences on abbreviations like "t.ex."

## Design and UX

- [ ] Interactive landing page: a clear welcome page with large CTAs leading straight to the main modes, All parties and Debate mode
- [ ] Introduce 4/8 point design system
- [ ] Design overhaul - focus on minimizing the "AI look"
- [ ] Dark mode, light mode, system - yes?
- [ ] Adapt app to smaller screens
- [ ] Consolidate icon usage across all components onto lucide-react
- [ ] Context-aware custom cursors, for example a gavel cursor in Debate mode

## General and prompt tuning (AI quality)

- [ ] More natural, concise language: cut wordy rambling and generic AI openers, such as "That's an interesting question," and enforce a strict length limit, about two to three sharp sentences or 60 to 80 words, to keep pace and readability high across the app
- [ ] Grid mode: add structured `[FÖR]/[EMOT]/[NEUTRAL]` fields to the ask-all API response instead of parsing them out of free text
- [ ] Grid mode: trim answer card text further toward an absolute minimum
- [ ] Rewrite every party's  instructions in English, to prevent AI hallucinated swedish!

## Extra features

- [ ] One-on-one direct question: let the user ask questions to a single party leader at a time, with extra focus on a more personal tone, sharper jargon, and a clearer persona profile
- [ ] Voice readout (text-to-speech): add support for a TTS model and an audio playback button on each reply, with a matching voice for each party leader, for example through OpenAI TTS or ElevenLabs
