# oriz-quiz

**Live: https://quiz.oriz.in**

AI quiz + flashcard maker. Paste notes or a topic, get a multiple-choice quiz or spaced-repetition flashcards, take the quiz, score, and export.

> 100% client-side. No upload, no signup, no account. Your notes never leave the browser. AI runs keyless via g4f with multi-provider failover.

[![License: MIT](https://img.shields.io/badge/License-MIT-e23b3b.svg)](./LICENSE)
![Client-side](https://img.shields.io/badge/runtime-100%25%20client--side-1f3d34)
![Astro](https://img.shields.io/badge/built%20with-Astro-ff5d01)

## What it does

- **MCQ quiz** — paste material → AI writes 3-30 questions with 4 options + one-line explanations. Take it, answer-lock reveals the right answer, wrong answers get explained.
- **Flashcards** — AI turns notes into front/back cards, stored locally, reviewed with the **SM-2** spaced-repetition algorithm (Again / Hard / Good / Easy).
- **Score + streak** — running streak fires confetti at 3+; a perfect quiz throws a big burst.
- **Save decks** — flashcard decks persist in IndexedDB; reopen and only the *due* cards come up.
- **Export** — quiz to TXT / JSON, deck to CSV (Anki/Quizlet friendly).
- **Pick a model** — auto-failover by default, or choose any g4f model.

Empty input? It uses a built-in sample topic so you can try it in one click.

## How it works

```mermaid
flowchart LR
  A[Notes / topic] --> B{{oz-ai · g4f}}
  B -->|JSON mode| C[parse + validate]
  C --> D[MCQ quiz]
  C --> E[Flashcards]
  D --> F[score + confetti]
  E --> G[(IndexedDB)]
  G --> H[SM-2 review]
  D --> X[export TXT/JSON]
  E --> Y[export CSV]
```

AI is **optional polish** — if every provider is down, generation shows a clear error and the rest of the tool (taking a saved quiz, reviewing saved decks, exporting) still works.

## Shared packages

Consumes the atomic `@chirag127/*` fleet packages (one source of truth, themed per site):

- `@chirag127/oz-ai` — keyless AI (g4f/gpt4free, multi-provider failover)
- `@chirag127/oz-file` — client download / file helpers
- `@chirag127/oz-tokens-base` — the `--oz-*` token contract (overridden here with a chalkboard palette)
- `@chirag127/oz-chrome` — shared header/footer/tool-shell + the oriz.in wordmark

## Design

Schoolbook chalkboard + gameshow: deep chalkboard green, chalk white, buzzer red, gold streak stars. Fraunces slab display + Schoolbell marker accents. Hand-drawn chalk underline, a physical buzzer button, flip-cards, and confetti. Dark by design, WCAG-AA contrast, responsive 390-1440px, respects `prefers-reduced-motion`.

## Develop

```bash
npm install --legacy-peer-deps
npm run dev        # local
npm test           # vitest — SM-2, parsing, export
npm run build      # static output to dist/
npm run deploy     # build + wrangler pages deploy
```

Windows note: use **npm**, not pnpm (pnpm skips `@esbuild/win32-x64` and the Astro build crashes).

## License

MIT © 2026 Chirag Singhal
