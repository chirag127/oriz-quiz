# oriz-quiz

> AI quiz + flashcard maker — paste notes or a topic, get an MCQ quiz or SM-2 flashcards. 100% client-side.

[![License: MIT](https://img.shields.io/badge/License-MIT-e23b3b.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/chirag127/oriz-quiz?style=social)](https://github.com/chirag127/oriz-quiz/stargazers)
[![last commit](https://img.shields.io/github/last-commit/chirag127/oriz-quiz)](https://github.com/chirag127/oriz-quiz/commits/main)
![Astro](https://img.shields.io/badge/built%20with-Astro-ff5d01?logo=astro&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)

- **Live app:** https://quiz.oriz.in _(canonical — Cloudflare Pages)_
- **About / info:** https://chirag127.github.io/oriz-quiz/ _(GitHub Pages landing)_
- **Repo:** https://github.com/chirag127/oriz-quiz
- **For LLMs:** https://quiz.oriz.in/llms.txt · https://quiz.oriz.in/llms-full.txt

AI quiz + flashcard maker. Paste notes or a topic, get a multiple-choice quiz or spaced-repetition flashcards, take the quiz, score, and export.

> **100% client-side. No upload, no signup, free.** Your notes never leave the browser. AI runs keyless via g4f with multi-provider failover.

**⭐ If this is useful, please [star the repo](https://github.com/chirag127/oriz-quiz/stargazers) — it helps others find it.**

## What it does

- **MCQ quiz** - paste material, AI writes 3-30 questions with 4 options + one-line explanations. Take it; answer-lock reveals the right answer and explains wrong picks.
- **Flashcards** - AI turns notes into front/back cards, stored locally, reviewed with the **SM-2** spaced-repetition algorithm (Again / Hard / Good / Easy).
- **Score + streak** - a running streak fires confetti at 3+; a perfect quiz throws a big burst.
- **Save decks** - flashcard decks persist in IndexedDB; reopen and only the *due* cards come up.
- **Export** - quiz to TXT / JSON, deck to CSV (Anki/Quizlet friendly).
- **Pick a model** - auto-failover by default, or choose any g4f model.

Empty input? It uses a built-in sample topic so you can try it in one click.

AI is **optional polish** - if every provider is down, generation shows a clear error and the rest of the tool (taking a saved quiz, reviewing saved decks, exporting) still works.

## How it works

```mermaid
flowchart LR
  A[Notes / topic] --> B{{oz-ai / g4f}}
  B -->|JSON mode| C[parse + validate]
  C --> D[MCQ quiz]
  C --> E[Flashcards]
  D --> F[score + confetti]
  E --> G[(IndexedDB)]
  G --> H[SM-2 review]
  D --> X[export TXT/JSON]
  E --> Y[export CSV]
```

## Two surfaces

This repo powers two things:

- The **live app** on Cloudflare Pages: https://quiz.oriz.in
- A separate **info page** on GitHub Pages (about the project, not a mirror): https://chirag127.github.io/oriz-quiz/ (source in `gh-info/`, published by `.github/workflows/gh-pages-info.yml`).

## Tech

- Client-only **Astro** static site; React island for the app UI.
- Keyless AI via `@chirag127/oz-ai` (g4f / gpt4free, multi-provider failover).
- IndexedDB for decks; **SM-2** spaced repetition; no server, no database.
- **PWA-installable**, offline-capable; shared `@chirag127/oz-*` fleet packages, themed per site (chalkboard palette here).

## Develop

```bash
npm install --legacy-peer-deps
npm run dev        # local
npm test           # vitest - SM-2, parsing, export
npm run build      # static output to dist/
npm run deploy     # build + wrangler pages deploy
```

Windows note: use **npm**, not pnpm (pnpm skips `@esbuild/win32-x64` and the Astro build crashes).

## Part of the oriz family

One of ~80 small, fast, single-purpose tools and sites in the **oriz** fleet — see [blog.oriz.in](https://blog.oriz.in) for how it's built and run solo. Sibling tools: [muse.oriz.in](https://muse.oriz.in) · [persona.oriz.in](https://persona.oriz.in) · [json.oriz.in](https://json.oriz.in) · [diagram.oriz.in](https://diagram.oriz.in).

**Cost:** $0 — static build hosted free on Cloudflare Pages; AI is keyless (g4f) and client-side.

## Contributing

Issues and PRs welcome. Conventional commits are the changelog.

## Author

Chirag Singhal · chirag@oriz.in

## Status

Stable.

## License

MIT (c) 2026 Chirag Singhal
