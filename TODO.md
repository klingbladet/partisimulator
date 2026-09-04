# TODO

## Design and UX

- [ ] Iconography and interface: replace generic icons with a consistent library, for example lucide-react or react-icons
- [ ] Interactive landing page: a clear welcome page with large CTAs leading straight to the main modes, All parties and Debate mode
- [ ] Themed custom cursors: a playful cursor that matches the context, for example a gavel when the user is in Debate mode

## General and prompt tuning (AI quality)

- [ ] More natural language: cut wordy rambling and generic AI openers, such as "That's an interesting question," and write short, natural, conversational answers
- [ ] Short, concise answers: a strict length limit, about two to three sharp sentences or 60 to 80 words, to keep pace and readability high across the app

## Main mode: All parties (grid view)

- [ ] Quick status: each party gives a direct, color-coded stance at the top of its answer card: [FOR], [AGAINST], or [NEUTRAL]
- [ ] Ultra-trimmed reasoning: very short, compressed answers so the user can easily scan and compare all 8 parties' answers on one screen

## Main mode: Debate

- [ ] Random opening speaker: the system automatically and randomly picks which of the selected party leaders speaks first
- [ ] Auto mode with a cap: a toggle for automatic flow that generates replies in sequence, with a hard limit, for example a maximum of 4 to 6 replies total, to save tokens and bring the debate to a close
- [ ] Manual control (play button): a clear "Play" or "Next reply" button that steps to the next reply at the user's own pace

## Extra features

- [ ] One-on-one direct question: let the user ask questions to a single party leader at a time, with extra focus on a more personal tone, sharper jargon, and a clearer persona profile
- [ ] Voice readout (text-to-speech): add an audio playback button on each reply, with a matching voice for each party leader, for example through OpenAI TTS or ElevenLabs
