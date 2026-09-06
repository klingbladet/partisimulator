# ROADMAP.md — PartiSimulator 2026

Senast uppdaterad: 2026-09-06

## Etapp 1: Prompt-Engineering & API-responser

Status: Ej påbörjad

### 1.1 Systemprompt-refaktorisering

- [x] Eliminera artighetsfraser och generiska AI-inledningar ("Det är en intressant fråga...")
- [x] Framtvinga direkt, rapp, talspråklig debatton per partiledare
- [x] Fil: `src/lib/prompts.ts`, `src/lib/prompt-templates.json`, `src/lib/parties.json`

### 1.2 Hårda längdbegränsningar (Token Budget)

- [x] Sätt strikt begränsning på 60-80 ord (ca 2-3 meningar) per svar/replik
- [x] Gäller samtliga prompt-mallar (one-shot, ask-all, debate)
- [x] Filer: `src/lib/prompt-templates.json`, `src/app/api/debate/route.ts`

### 1.3 Snabbstatus (Grid-vy)

- [ ] Utöka API-responsen för Alla Partier med strukturerat fält: `[FÖR]`, `[EMOT]`, `[NEUTRAL]`
- [ ] Fil: `src/app/api/ask-all/route.ts`, `src/types/stream.ts`

### 1.4 Ultratrimmade motiveringar

- [ ] Komprimera textinnehåll i Grid-vyns svarskort till absolut minimum
- [ ] Fil: `src/components/grid/answer-bubble.tsx`

---

## Etapp 2: Design, UX & Interaktioner

Status: Ej påbörjad

### 2.1 Enhetlig ikonografi

- [ ] Byt ut spridda/generiska ikoner mot lucide-react
- [ ] Finns redan `lucide-react` som beroende — konsolidera användning
- [ ] Filer: Alla komponenter med ikoner

### 2.2 Interaktiv landing page / startvy

- [ ] Välkomstsida med framträdande CTA-komponenter
- [ ] Navigering direkt till Grid-vy och Debattläge
- [ ] Fil: `src/app/page.tsx` (eller ny fil)

### 2.3 Kontextuella custom cursors

- [ ] Muspekare ändrar utseende baserat på aktiv kontext
- [ ] T.ex. ordförandeklubba/hammare i Debattläget
- [ ] Fil: `src/app/globals.css`, eventuellt nya komponenter

---

## Etapp 3: Debattläge (Logik & Tillstånd)

Status: Ej påbörjad

### 3.1 Slumpad öppningstalare

- [ ] Server-side randomization vid start av ny debatt
- [ ] Avgör vilken partiledare får ordet först
- [ ] Fil: `src/hooks/use-debate.ts`, eventuellt `src/app/api/debate/route.ts`

### 3.2 Auto-mode med hårt tak

- [ ] Auto-play toggle för sekventiell generering
- [ ] Hård gräns: max 4-6 totala repliker
- [ ] Fil: `src/hooks/use-debate.ts`

### 3.3 Manuell stegning (Play-kontroll)

- [ ] Dedikerad "Nästa replik"-knapp
- [ ] Stegar fram nästa inlägg i användarens takt
- [ ] Fil: `src/hooks/use-debate.ts`, `src/app/debatt/page.tsx`

---

## Etapp 4: Extra Features

Status: Ej påbörjad

### 4.1 1-mot-1 Direktfråga

- [ ] Förbättra nuvarande direktfråga-läge
- [ ] Förstärk systemprompt för personlig ton och skarpare jargong
- [ ] Filer: `src/lib/prompts.ts`, `src/app/api/ask/route.ts`

### 4.2 Text-to-Speech (Låg prioritet / Backlog)

- [ ] Integrering av röstsyntes för uppläsning av genererade inlägg
- [ ] Ej specificerat ännu — väntar på teknikval

---

## Framsteg

| Datum      | Aktivitet                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| 2026-09-06 | PROJECT_MAP.md och ROADMAP.md skapade                                        |
| 2026-09-06 | pnpm-workspace.yaml fixad (onlyBuiltDependencies → allowBuilds)               |
| 2026-09-06 | Etapp 1.1 klar: skarpare partipersonligheter + ingen-tyck-smörja-regel        |
| 2026-09-06 | Etapp 1.2 klar: 60-80 ord-mål i alla lägen, maxOutputTokens uppdaterat        |
