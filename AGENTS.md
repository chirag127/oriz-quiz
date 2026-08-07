# oriz-quiz — agent guide

AI quiz + flashcard maker (quiz.oriz.in). Static Astro, 100% client-side.

> Self-contained rules. Source of truth: chirag127/workspace/knowledge/. Manual sync.

## Project-specific (this repo)

- **Client-only.** No backend, no server routes, no secrets. All logic in the browser.
- **Build with npm, NOT pnpm, on Windows** — pnpm skips `@esbuild/win32-x64` → Astro build crashes. Use `npm install --legacy-peer-deps && npm run build`.
- **AI = `@chirag127/oz-ai`** (g4f, keyless, multi-provider failover). Optional polish — degrades gracefully; core (saved quizzes/decks, export) works offline.
- **Own distinct identity** — schoolbook chalkboard + gameshow. Never reuse another oriz site's palette/type/motion. Consume `@chirag127/*` for MECHANISM/a11y/token-contract only.
- **Shared packages** (`file:../design-system/packages/*`): oz-ai, oz-file, oz-tokens-base, oz-chrome. Don't reimplement; changes propagate to every site.
- Deploy: `astro build && wrangler pages deploy dist --project-name oriz-quiz --branch main --commit-dirty=true`.

## Fleet rules (canonical)

- **Caveman/terse** prose, commits, issues. Answer in word 1. Code before prose.
- **Minimum everything.** Smallest unit that works. Reuse > write. Community packages first.
- **codebase-memory-mcp FIRST** for code questions (search_graph/trace_path/get_code_snippet/query_graph). Grep/Read only for non-code or files you edit.
- **main only**, direct commit, push by default, conventional commits, never force-push. Scan secrets before push.
- **Search web ≥2×** before non-trivial tool/pricing/library decisions.
- **No auth on free surfaces.** No card-on-file for own tooling.
